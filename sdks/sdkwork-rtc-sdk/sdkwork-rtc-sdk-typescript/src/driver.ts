import { createCapabilitySet } from './capabilities.js';
import { StandardRtcClient, type RtcClient } from './client.js';
import { cloneRtcProviderMetadata, freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcResolvedClientConfig,
  RtcProviderMetadata,
  RtcRuntimeController,
} from './types.js';

export interface RtcProviderDriver<TNativeClient = unknown> {
  readonly metadata: RtcProviderMetadata;
  connect(config: RtcResolvedClientConfig): Promise<RtcClient<TNativeClient>>;
}

export interface CreateRtcProviderDriverOptions<TNativeClient = unknown> {
  metadata: RtcProviderMetadata;
  nativeFactory?: (config: RtcResolvedClientConfig) => Promise<TNativeClient> | TNativeClient;
  runtimeController?: RtcRuntimeController<TNativeClient>;
}

export function createRtcProviderDriver<TNativeClient = unknown>(
  options: CreateRtcProviderDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient> {
  const metadata = cloneRtcProviderMetadata(options.metadata);

  return freezeRtcRuntimeValue({
    metadata,
    async connect(config: RtcResolvedClientConfig): Promise<RtcClient<TNativeClient>> {
      const nativeClient = await (options.nativeFactory?.(config) ?? ({
        providerKey: metadata.providerKey,
        driverId: metadata.driverId,
        nativeConfig: config.nativeConfig ?? null,
      } as TNativeClient));

      return new StandardRtcClient(
        metadata,
        createCapabilitySet({
          required: metadata.requiredCapabilities,
          optional: metadata.optionalCapabilities,
        }),
        {
          providerKey: config.providerKey,
          source: config.selectionSource,
        },
        nativeClient,
        options.runtimeController,
      );
    },
  });
}
