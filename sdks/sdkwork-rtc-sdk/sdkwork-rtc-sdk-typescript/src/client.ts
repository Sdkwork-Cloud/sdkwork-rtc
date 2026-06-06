import { describeCapabilitySupport, hasCapability, negotiateCapabilities } from './capabilities.js';
import { RtcSdkException } from './errors.js';
import { getRtcProviderExtensions, hasRtcProviderExtension } from './provider-extension-catalog.js';
import {
  cloneRtcCapabilitySet,
  cloneRtcProviderMetadata,
  cloneRtcProviderSelection,
  shallowFreezeRtcRuntimeValue,
} from './runtime-freeze.js';
import { RTC_RUNTIME_SURFACE_FAILURE_CODE } from './runtime-surface.js';
import type {
  RtcCapabilityNegotiationRequest,
  RtcCapabilityNegotiationResult,
  RtcCapabilityKey,
  RtcCapabilitySet,
  RtcCapabilitySupportState,
  RtcJoinOptions,
  RtcMuteState,
  RtcPublishOptions,
  RtcProviderExtensionDescriptor,
  RtcProviderMetadata,
  RtcProviderSelection,
  RtcRuntimeController,
  RtcRuntimeControllerContext,
  RtcSessionDescriptor,
  RtcTrackPublication,
} from './types.js';
import type { RtcRuntimeSurfaceMethodName } from './runtime-surface.js';

export interface RtcClient<TNativeClient = unknown> {
  readonly metadata: RtcProviderMetadata;
  readonly capabilities: RtcCapabilitySet;
  readonly selection: RtcProviderSelection;
  join(options: RtcJoinOptions): Promise<RtcSessionDescriptor>;
  leave(): Promise<RtcSessionDescriptor>;
  publish(options: RtcPublishOptions): Promise<RtcTrackPublication>;
  unpublish(trackId: string): Promise<void>;
  muteAudio(muted?: boolean): Promise<RtcMuteState>;
  muteVideo(muted?: boolean): Promise<RtcMuteState>;
  describeCapability(capability: RtcCapabilityKey): RtcCapabilitySupportState;
  negotiateCapabilities(request: RtcCapabilityNegotiationRequest): RtcCapabilityNegotiationResult;
  getProviderExtensions(): readonly RtcProviderExtensionDescriptor[];
  supportsProviderExtension(extensionKey: string): boolean;
  supportsCapability(capability: RtcCapabilityKey): boolean;
  requireCapability(capability: RtcCapabilityKey): void;
  unwrap(): TNativeClient;
}

export class StandardRtcClient<TNativeClient = unknown> implements RtcClient<TNativeClient> {
  readonly #metadata: RtcProviderMetadata;
  readonly #capabilities: RtcCapabilitySet;
  readonly #selection: RtcProviderSelection;
  readonly #nativeClient: TNativeClient;
  readonly #runtimeController?: RtcRuntimeController<TNativeClient>;

  get metadata(): RtcProviderMetadata {
    return this.#metadata;
  }

  get capabilities(): RtcCapabilitySet {
    return this.#capabilities;
  }

  get selection(): RtcProviderSelection {
    return this.#selection;
  }

  constructor(
    metadata: RtcProviderMetadata,
    capabilities: RtcCapabilitySet,
    selection: RtcProviderSelection,
    nativeClient: TNativeClient,
    runtimeController?: RtcRuntimeController<TNativeClient>,
  ) {
    this.#metadata = cloneRtcProviderMetadata(metadata);
    this.#capabilities = cloneRtcCapabilitySet(capabilities);
    this.#selection = cloneRtcProviderSelection(selection);
    this.#nativeClient = nativeClient;
    this.#runtimeController = runtimeController;
  }

  #getRuntimeContext(): RtcRuntimeControllerContext<TNativeClient> {
    return shallowFreezeRtcRuntimeValue({
      metadata: this.#metadata,
      capabilities: this.#capabilities,
      selection: this.#selection,
      nativeClient: this.#nativeClient,
    });
  }

  #requireRuntimeMethod<TMethodName extends RtcRuntimeSurfaceMethodName>(
    methodName: TMethodName,
  ): NonNullable<RtcRuntimeController<TNativeClient>[TMethodName]> {
    const method = this.#runtimeController?.[methodName];
    if (typeof method !== 'function') {
      throw new RtcSdkException({
        code: RTC_RUNTIME_SURFACE_FAILURE_CODE,
        message: `RTC runtime bridge method not available: ${String(methodName)}`,
        providerKey: this.#metadata.providerKey,
        pluginId: this.#metadata.pluginId,
        details: {
          methodName,
        },
      });
    }

    return method;
  }

  async join(options: RtcJoinOptions): Promise<RtcSessionDescriptor> {
    const join = this.#requireRuntimeMethod('join');
    return join.call(this.#runtimeController, options, this.#getRuntimeContext());
  }

  async leave(): Promise<RtcSessionDescriptor> {
    const leave = this.#requireRuntimeMethod('leave');
    return leave.call(this.#runtimeController, this.#getRuntimeContext());
  }

  async publish(options: RtcPublishOptions): Promise<RtcTrackPublication> {
    const publish = this.#requireRuntimeMethod('publish');
    return publish.call(this.#runtimeController, options, this.#getRuntimeContext());
  }

  async unpublish(trackId: string): Promise<void> {
    const unpublish = this.#requireRuntimeMethod('unpublish');
    await unpublish.call(this.#runtimeController, trackId, this.#getRuntimeContext());
  }

  async muteAudio(muted = true): Promise<RtcMuteState> {
    const muteAudio = this.#requireRuntimeMethod('muteAudio');
    return muteAudio.call(this.#runtimeController, muted, this.#getRuntimeContext());
  }

  async muteVideo(muted = true): Promise<RtcMuteState> {
    const muteVideo = this.#requireRuntimeMethod('muteVideo');
    return muteVideo.call(this.#runtimeController, muted, this.#getRuntimeContext());
  }

  describeCapability(capability: RtcCapabilityKey): RtcCapabilitySupportState {
    return describeCapabilitySupport(this.capabilities, capability);
  }

  negotiateCapabilities(request: RtcCapabilityNegotiationRequest): RtcCapabilityNegotiationResult {
    return negotiateCapabilities(this.capabilities, request);
  }

  getProviderExtensions(): readonly RtcProviderExtensionDescriptor[] {
    return getRtcProviderExtensions(this.#metadata.extensionKeys);
  }

  supportsProviderExtension(extensionKey: string): boolean {
    return hasRtcProviderExtension(this.#metadata.extensionKeys, extensionKey);
  }

  supportsCapability(capability: RtcCapabilityKey): boolean {
    return hasCapability(this.capabilities, capability);
  }

  requireCapability(capability: RtcCapabilityKey): void {
    if (!this.supportsCapability(capability)) {
      throw new RtcSdkException({
        code: 'capability_not_supported',
        message: `RTC capability not supported: ${capability}`,
        providerKey: this.#metadata.providerKey,
        pluginId: this.#metadata.pluginId,
        details: {
          capability,
        },
      });
    }
  }

  unwrap(): TNativeClient {
    return this.#nativeClient;
  }
}
