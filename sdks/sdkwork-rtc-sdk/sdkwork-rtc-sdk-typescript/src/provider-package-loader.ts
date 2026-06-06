import { RtcSdkException } from './errors.js';
import type { RtcDriverManager } from './driver-manager.js';
import {
  getRtcProviderPackageByPackageIdentity,
  getRtcProviderPackageByProviderKey,
} from './provider-package-catalog.js';
import {
  registerRtcProviderModule,
  registerRtcProviderModules,
  type RtcProviderModule,
  type RtcProviderModuleDriverOptions,
  type RtcProviderModuleRegistration,
} from './provider-module.js';
import type { RtcProviderPackageCatalogEntry } from './types.js';

export interface RtcProviderPackageLoadRequest {
  providerKey?: string;
  packageIdentity?: string;
}

export interface RtcResolvedProviderPackageLoadTarget {
  providerKey: string;
  packageIdentity: string;
  packageEntry: RtcProviderPackageCatalogEntry;
}

export type RtcProviderModuleNamespace = Record<string, unknown>;

export interface RtcProviderPackageImportFn {
  (
    packageIdentity: string,
    packageEntry: RtcProviderPackageCatalogEntry,
  ): Promise<RtcProviderModuleNamespace>;
}

export interface RtcProviderPackageLoader {
  (
    target: RtcResolvedProviderPackageLoadTarget,
  ): Promise<RtcProviderModuleNamespace>;
}

export interface RtcProviderPackageInstallRequest<TNativeClient = unknown>
  extends RtcProviderPackageLoadRequest {
  options?: RtcProviderModuleDriverOptions<TNativeClient>;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRtcProviderModule<TNativeClient = unknown>(
  value: unknown,
): value is RtcProviderModule<TNativeClient> {
  return (
    isObjectRecord(value) &&
    typeof value.packageName === 'string' &&
    isObjectRecord(value.metadata) &&
    typeof value.createDriver === 'function'
  );
}

export function resolveRtcProviderPackageLoadTarget(
  request: RtcProviderPackageLoadRequest,
): RtcResolvedProviderPackageLoadTarget {
  const packageEntryByProviderKey =
    typeof request.providerKey === 'string' && request.providerKey.length > 0
      ? getRtcProviderPackageByProviderKey(request.providerKey)
      : undefined;
  const packageEntryByPackageIdentity =
    typeof request.packageIdentity === 'string' && request.packageIdentity.length > 0
      ? getRtcProviderPackageByPackageIdentity(request.packageIdentity)
      : undefined;

  if (
    typeof request.providerKey === 'string' &&
    request.providerKey.length > 0 &&
    typeof request.packageIdentity === 'string' &&
    request.packageIdentity.length > 0
  ) {
    if (
      !packageEntryByProviderKey ||
      !packageEntryByPackageIdentity ||
      packageEntryByProviderKey.providerKey !== packageEntryByPackageIdentity.providerKey
    ) {
      throw new RtcSdkException({
        code: 'provider_package_identity_mismatch',
        message:
          'RTC provider package request drift detected: providerKey and packageIdentity must resolve to the same official package boundary',
        providerKey: request.providerKey,
        pluginId: packageEntryByProviderKey?.pluginId ?? packageEntryByPackageIdentity?.pluginId,
        details: {
          requestedProviderKey: request.providerKey,
          requestedPackageIdentity: request.packageIdentity,
          resolvedProviderKey: packageEntryByProviderKey?.providerKey,
          resolvedPackageIdentity: packageEntryByPackageIdentity?.packageIdentity,
        },
      });
    }
  }

  const packageEntry = packageEntryByProviderKey ?? packageEntryByPackageIdentity;
  if (!packageEntry) {
    throw new RtcSdkException({
      code: 'provider_package_not_found',
      message:
        'RTC provider package resolution requires a known providerKey or packageIdentity from the official package catalog',
      providerKey: request.providerKey,
      details: {
        providerKey: request.providerKey,
        packageIdentity: request.packageIdentity,
      },
    });
  }

  return {
    providerKey: packageEntry.providerKey,
    packageIdentity: packageEntry.packageIdentity,
    packageEntry,
  };
}

export function createRtcProviderPackageLoader(
  importPackage: RtcProviderPackageImportFn = async (packageIdentity) => import(packageIdentity),
): RtcProviderPackageLoader {
  return async (target) => {
    try {
      return await importPackage(target.packageIdentity, target.packageEntry);
    } catch (error) {
      throw new RtcSdkException({
        code: 'provider_package_load_failed',
        message: `Failed to load RTC provider package: ${target.packageIdentity}`,
        providerKey: target.providerKey,
        pluginId: target.packageEntry.pluginId,
        details: {
          packageIdentity: target.packageIdentity,
          moduleSymbol: target.packageEntry.moduleSymbol,
        },
        cause: error,
      });
    }
  };
}

export async function loadRtcProviderModule<TNativeClient = unknown>(
  request: RtcProviderPackageLoadRequest,
  loader: RtcProviderPackageLoader,
): Promise<RtcProviderModule<TNativeClient>> {
  const target = resolveRtcProviderPackageLoadTarget(request);

  let namespace: RtcProviderModuleNamespace;
  try {
    namespace = await loader(target);
  } catch (error) {
    if (error instanceof RtcSdkException) {
      throw error;
    }

    throw new RtcSdkException({
      code: 'provider_package_load_failed',
      message: `Failed to load RTC provider package: ${target.packageIdentity}`,
      providerKey: target.providerKey,
      pluginId: target.packageEntry.pluginId,
      details: {
        packageIdentity: target.packageIdentity,
        moduleSymbol: target.packageEntry.moduleSymbol,
      },
      cause: error,
    });
  }

  if (!isObjectRecord(namespace)) {
    throw new RtcSdkException({
      code: 'provider_module_export_missing',
      message: `RTC provider package did not return a module namespace object: ${target.packageIdentity}`,
      providerKey: target.providerKey,
      pluginId: target.packageEntry.pluginId,
      details: {
        packageIdentity: target.packageIdentity,
        moduleSymbol: target.packageEntry.moduleSymbol,
      },
    });
  }

  const providerModule = namespace[target.packageEntry.moduleSymbol];
  if (!isRtcProviderModule<TNativeClient>(providerModule)) {
    throw new RtcSdkException({
      code: 'provider_module_export_missing',
      message: `RTC provider package is missing the required provider module export: ${target.packageEntry.moduleSymbol}`,
      providerKey: target.providerKey,
      pluginId: target.packageEntry.pluginId,
      details: {
        packageIdentity: target.packageIdentity,
        moduleSymbol: target.packageEntry.moduleSymbol,
        availableExports: Object.keys(namespace),
      },
    });
  }

  return providerModule;
}

export async function installRtcProviderPackage<TNativeClient = unknown>(
  manager: RtcDriverManager,
  request: RtcProviderPackageInstallRequest<TNativeClient>,
  loader: RtcProviderPackageLoader,
): Promise<RtcDriverManager> {
  const providerModule = await loadRtcProviderModule<TNativeClient>(request, loader);
  registerRtcProviderModule(manager, providerModule, request.options);
  return manager;
}

export async function installRtcProviderPackages<TNativeClient = unknown>(
  manager: RtcDriverManager,
  requests: readonly RtcProviderPackageInstallRequest<TNativeClient>[],
  loader: RtcProviderPackageLoader,
): Promise<RtcDriverManager> {
  const registrations: RtcProviderModuleRegistration<TNativeClient>[] = [];

  for (const request of requests) {
    registrations.push({
      providerModule: await loadRtcProviderModule<TNativeClient>(request, loader),
      options: request.options,
    });
  }

  registerRtcProviderModules(manager, registrations);
  return manager;
}
