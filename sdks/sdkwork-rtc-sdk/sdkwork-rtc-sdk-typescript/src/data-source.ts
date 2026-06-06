import {
  createCapabilitySet,
  describeCapabilitySupport,
  negotiateCapabilities,
} from './capabilities.js';
import { RtcDriverManager } from './driver-manager.js';
import { getRtcProviderExtensions, hasRtcProviderExtension } from './provider-extension-catalog.js';
import type { RtcClient } from './client.js';
import type {
  RtcCapabilityKey,
  RtcCapabilityNegotiationRequest,
  RtcCapabilityNegotiationResult,
  RtcCapabilitySupportState,
  RtcClientConfig,
  RtcProviderExtensionDescriptor,
  RtcProviderMetadata,
  RtcProviderSelection,
  RtcProviderSupportState,
} from './types.js';

export interface RtcDataSourceConfig extends RtcClientConfig {
  driverManager?: RtcDriverManager;
}

export interface RtcDataSourceOptions extends RtcDataSourceConfig {}

export class RtcDataSource {
  readonly #config: RtcDataSourceConfig;
  readonly #driverManager: RtcDriverManager;

  constructor(config: RtcDataSourceConfig = {}) {
    this.#config = config;
    this.#driverManager = config.driverManager ?? new RtcDriverManager();
  }

  describe(overrides: RtcClientConfig = {}): RtcProviderMetadata {
    return this.#driverManager.getMetadata({
      ...this.#config,
      ...overrides,
    });
  }

  describeSelection(overrides: RtcClientConfig = {}): RtcProviderSelection {
    return this.#driverManager.resolveSelection({
      ...this.#config,
      ...overrides,
    });
  }

  describeProviderSupport(overrides: RtcClientConfig = {}): RtcProviderSupportState {
    const selection = this.describeSelection(overrides);
    return this.#driverManager.describeProviderSupport(selection.providerKey);
  }

  listProviderSupport(): readonly RtcProviderSupportState[] {
    return this.#driverManager.listProviderSupport();
  }

  describeCapability(
    capability: RtcCapabilityKey,
    overrides: RtcClientConfig = {},
  ): RtcCapabilitySupportState {
    const metadata = this.describe(overrides);
    return describeCapabilitySupport(
      createCapabilitySet({
        required: metadata.requiredCapabilities,
        optional: metadata.optionalCapabilities,
      }),
      capability,
    );
  }

  negotiateCapabilities(
    request: RtcCapabilityNegotiationRequest,
    overrides: RtcClientConfig = {},
  ): RtcCapabilityNegotiationResult {
    const metadata = this.describe(overrides);
    return negotiateCapabilities(
      createCapabilitySet({
        required: metadata.requiredCapabilities,
        optional: metadata.optionalCapabilities,
      }),
      request,
    );
  }

  describeProviderExtensions(overrides: RtcClientConfig = {}): readonly RtcProviderExtensionDescriptor[] {
    const metadata = this.describe(overrides);
    return getRtcProviderExtensions(metadata.extensionKeys);
  }

  supportsProviderExtension(extensionKey: string, overrides: RtcClientConfig = {}): boolean {
    const metadata = this.describe(overrides);
    return hasRtcProviderExtension(metadata.extensionKeys, extensionKey);
  }

  async createClient<TNativeClient = unknown>(
    overrides: RtcClientConfig = {},
  ): Promise<RtcClient<TNativeClient>> {
    return this.#driverManager.connect({
      ...this.#config,
      ...overrides,
    });
  }
}
