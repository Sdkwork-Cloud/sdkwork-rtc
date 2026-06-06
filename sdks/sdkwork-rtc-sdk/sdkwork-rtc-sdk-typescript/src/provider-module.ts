import { RtcSdkException } from './errors.js';
import type { CreateRtcProviderDriverOptions, RtcProviderDriver } from './driver.js';
import type { RtcDriverManager } from './driver-manager.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcProviderCatalogEntry,
  RtcTypeScriptAdapterContract,
} from './types.js';

export type RtcProviderModuleDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
>;

export interface RtcProviderModule<TNativeClient = unknown> {
  readonly packageName: string;
  readonly metadata: RtcProviderCatalogEntry;
  readonly builtin: boolean;
  readonly typescriptAdapter: RtcTypeScriptAdapterContract;
  createDriver(
    options?: RtcProviderModuleDriverOptions<TNativeClient>,
  ): RtcProviderDriver<TNativeClient>;
}

export interface RtcProviderModuleRegistration<TNativeClient = unknown> {
  providerModule: RtcProviderModule<TNativeClient>;
  options?: RtcProviderModuleDriverOptions<TNativeClient>;
}

export interface CreateRtcProviderModuleOptions<TNativeClient = unknown> {
  packageName: string;
  metadata: RtcProviderCatalogEntry;
  builtin: boolean;
  createDriver(
    options?: RtcProviderModuleDriverOptions<TNativeClient>,
  ): RtcProviderDriver<TNativeClient>;
}

export function createRtcProviderModule<TNativeClient = unknown>(
  options: CreateRtcProviderModuleOptions<TNativeClient>,
): RtcProviderModule<TNativeClient> {
  return freezeRtcRuntimeValue({
    packageName: options.packageName,
    metadata: options.metadata,
    builtin: options.builtin,
    typescriptAdapter: options.metadata.typescriptAdapter,
    createDriver(driverOptions = {}) {
      return options.createDriver(driverOptions);
    },
  });
}

function sameJsonShape(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function assertRtcProviderModuleContract<TNativeClient = unknown>(
  providerModule: RtcProviderModule<TNativeClient>,
): void {
  const packageContract = providerModule.metadata.typescriptPackage;

  if (providerModule.packageName !== packageContract.packageName) {
    throw new RtcSdkException({
      code: 'provider_module_contract_mismatch',
      message: `RTC provider module package contract drift detected for ${providerModule.metadata.providerKey}: packageName must match the assembly-driven TypeScript package contract`,
      providerKey: providerModule.metadata.providerKey,
      pluginId: providerModule.metadata.pluginId,
      details: {
        expectedPackageName: packageContract.packageName,
        receivedPackageName: providerModule.packageName,
      },
    });
  }

  if (providerModule.builtin !== packageContract.rootPublic) {
    throw new RtcSdkException({
      code: 'provider_module_contract_mismatch',
      message: `RTC provider module package contract drift detected for ${providerModule.metadata.providerKey}: builtin/rootPublic must match the assembly-driven TypeScript package contract`,
      providerKey: providerModule.metadata.providerKey,
      pluginId: providerModule.metadata.pluginId,
      details: {
        expectedRootPublic: packageContract.rootPublic,
        receivedBuiltin: providerModule.builtin,
      },
    });
  }

  if (!sameJsonShape(providerModule.typescriptAdapter, providerModule.metadata.typescriptAdapter)) {
    throw new RtcSdkException({
      code: 'provider_module_contract_mismatch',
      message: `RTC provider module package contract drift detected for ${providerModule.metadata.providerKey}: TypeScript adapter contract must match provider metadata`,
      providerKey: providerModule.metadata.providerKey,
      pluginId: providerModule.metadata.pluginId,
      details: {
        expectedTypeScriptAdapter: providerModule.metadata.typescriptAdapter,
        receivedTypeScriptAdapter: providerModule.typescriptAdapter,
      },
    });
  }
}

export function registerRtcProviderModule<TNativeClient = unknown>(
  manager: RtcDriverManager,
  providerModule: RtcProviderModule<TNativeClient>,
  options: RtcProviderModuleDriverOptions<TNativeClient> = {},
): RtcDriverManager {
  assertRtcProviderModuleContract(providerModule);
  manager.register(providerModule.createDriver(options));
  return manager;
}

export function registerRtcProviderModules<TNativeClient = unknown>(
  manager: RtcDriverManager,
  registrations: readonly RtcProviderModuleRegistration<TNativeClient>[],
): RtcDriverManager {
  const drivers = registrations.map((registration) => {
    assertRtcProviderModuleContract(registration.providerModule);
    return registration.providerModule.createDriver(registration.options);
  });

  manager.registerAll(drivers);

  return manager;
}
