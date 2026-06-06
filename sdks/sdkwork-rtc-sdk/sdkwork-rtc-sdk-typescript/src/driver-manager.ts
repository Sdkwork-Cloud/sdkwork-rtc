import { RtcSdkException } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcClient } from './client.js';
import type { RtcProviderDriver } from './driver.js';
import {
  DEFAULT_RTC_PROVIDER_KEY,
  getBuiltinRtcProviderMetadata,
  getOfficialRtcProviderMetadata,
} from './provider-catalog.js';
import { resolveRtcProviderSelection } from './provider-selection.js';
import { createRtcProviderSupportState } from './provider-support.js';
import type {
  RtcClientConfig,
  RtcProviderMetadata,
  RtcProviderSupportState,
  RtcProviderSelection,
  RtcResolvedClientConfig,
} from './types.js';

function sameStringArray(actual: readonly string[], expected: readonly string[]): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function isOfficialProviderMetadataMatch(
  actual: RtcProviderMetadata,
  expected: RtcProviderMetadata,
): boolean {
  return (
    actual.providerKey === expected.providerKey &&
    actual.pluginId === expected.pluginId &&
    actual.driverId === expected.driverId &&
    actual.displayName === expected.displayName &&
    actual.defaultSelected === expected.defaultSelected &&
    sameStringArray(actual.urlSchemes, expected.urlSchemes) &&
    sameStringArray(actual.requiredCapabilities, expected.requiredCapabilities) &&
    sameStringArray(actual.optionalCapabilities, expected.optionalCapabilities) &&
    sameStringArray(actual.extensionKeys, expected.extensionKeys)
  );
}

export interface RtcDriverManagerOptions {
  defaultProviderKey?: string;
  drivers?: readonly RtcProviderDriver[];
}

export class RtcDriverManager {
  readonly #drivers = new Map<string, RtcProviderDriver>();
  readonly #builtinProviderKeys = new Set<string>();
  readonly #officialProviders = new Map<string, RtcProviderMetadata>();
  readonly #defaultProviderKey: string;

  constructor(options: RtcDriverManagerOptions = {}) {
    this.#defaultProviderKey = options.defaultProviderKey ?? DEFAULT_RTC_PROVIDER_KEY;

    for (const metadata of getBuiltinRtcProviderMetadata()) {
      this.#builtinProviderKeys.add(metadata.providerKey);
    }

    for (const metadata of getOfficialRtcProviderMetadata()) {
      this.#officialProviders.set(metadata.providerKey, metadata);
    }

    this.registerAll(options.drivers ?? []);
  }

  #assertCanRegister(driver: RtcProviderDriver, plannedProviderKeys: ReadonlySet<string> = new Set()): void {
    const providerKey = driver.metadata.providerKey;
    const officialProvider = this.#officialProviders.get(providerKey);
    if (!officialProvider) {
      throw new RtcSdkException({
        code: 'provider_not_official',
        message: `RTC driver registration requires an official provider catalog entry: ${providerKey}`,
        providerKey,
        pluginId: driver.metadata.pluginId,
      });
    }

    if (!isOfficialProviderMetadataMatch(driver.metadata, officialProvider)) {
      throw new RtcSdkException({
        code: 'provider_metadata_mismatch',
        message: `RTC driver metadata must match the official provider catalog: ${providerKey}`,
        providerKey,
        pluginId: driver.metadata.pluginId,
        details: {
          expectedMetadata: officialProvider,
          receivedMetadata: driver.metadata,
        },
      });
    }

    if (this.#drivers.has(providerKey) || plannedProviderKeys.has(providerKey)) {
      throw new RtcSdkException({
        code: 'driver_already_registered',
        message: `RTC driver already registered for provider: ${providerKey}`,
        providerKey,
        pluginId: driver.metadata.pluginId,
      });
    }
  }

  register(driver: RtcProviderDriver): this {
    this.#assertCanRegister(driver);
    this.#drivers.set(driver.metadata.providerKey, driver);
    return this;
  }

  registerAll(drivers: readonly RtcProviderDriver[]): this {
    const plannedProviderKeys = new Set<string>();

    for (const driver of drivers) {
      this.#assertCanRegister(driver, plannedProviderKeys);
      plannedProviderKeys.add(driver.metadata.providerKey);
    }

    for (const driver of drivers) {
      this.#drivers.set(driver.metadata.providerKey, driver);
    }

    return this;
  }

  list() {
    return freezeRtcRuntimeValue([...this.#drivers.values()].map((driver) => driver.metadata));
  }

  hasDriver(providerKey: string): boolean {
    return this.#drivers.has(providerKey);
  }

  getMetadata(config: RtcClientConfig = {}) {
    const selection = this.resolveSelection(config);
    const registeredDriver = this.#drivers.get(selection.providerKey);
    if (registeredDriver) {
      return registeredDriver.metadata;
    }

    const officialProvider = this.#officialProviders.get(selection.providerKey);
    if (officialProvider) {
      return officialProvider;
    }

    throw new RtcSdkException({
      code: 'driver_not_found',
      message: `No RTC driver registered for provider: ${selection.providerKey}`,
      providerKey: selection.providerKey,
    });
  }

  getDefaultMetadata() {
    return this.getMetadata({ defaultProviderKey: this.#defaultProviderKey });
  }

  describeProviderSupport(providerKey: string): RtcProviderSupportState {
    const officialProvider = this.#officialProviders.get(providerKey);
    const registeredDriver = this.#drivers.get(providerKey);
    const builtin = this.#builtinProviderKeys.has(providerKey);
    const official = officialProvider !== undefined;
    const registered = registeredDriver !== undefined;

    return createRtcProviderSupportState({
      providerKey,
      builtin,
      official,
      registered,
    });
  }

  listProviderSupport(): readonly RtcProviderSupportState[] {
    return freezeRtcRuntimeValue(
      [...this.#officialProviders.keys()].map((providerKey) =>
        this.describeProviderSupport(providerKey),
      ),
    );
  }

  resolveSelection(config: RtcClientConfig = {}): RtcProviderSelection {
    return resolveRtcProviderSelection(
      config,
      config.defaultProviderKey ?? this.#defaultProviderKey,
    );
  }

  resolve(config: RtcClientConfig = {}): RtcProviderDriver {
    const selection = this.resolveSelection(config);
    const providerKey = selection.providerKey;

    const driver = this.#drivers.get(providerKey);
    if (!driver) {
      throw new RtcSdkException({
        code: 'driver_not_found',
        message: `No RTC driver registered for provider: ${providerKey}`,
        providerKey,
      });
    }

    return driver;
  }

  async connect<TNativeClient = unknown>(config: RtcClientConfig = {}): Promise<RtcClient<TNativeClient>> {
    const selection = this.resolveSelection(config);
    const driver = this.#drivers.get(selection.providerKey);
    if (!driver) {
      if (this.#officialProviders.has(selection.providerKey)) {
        throw new RtcSdkException({
          code: 'provider_not_supported',
          message: `RTC provider is officially defined but not registered in this runtime: ${selection.providerKey}`,
          providerKey: selection.providerKey,
        });
      }

      throw new RtcSdkException({
        code: 'driver_not_found',
        message: `No RTC driver registered for provider: ${selection.providerKey}`,
        providerKey: selection.providerKey,
      });
    }

    const resolvedConfig: RtcResolvedClientConfig = {
      ...config,
      providerKey: selection.providerKey,
      selectionSource: selection.source,
    };
    return driver.connect(resolvedConfig) as Promise<RtcClient<TNativeClient>>;
  }
}
