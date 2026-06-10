import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcCapabilityDescriptor } from './types.js';

export const REQUIRED_RTC_CAPABILITIES = freezeRtcRuntimeValue(['session', 'credential', 'provider.webhook', 'provider.event-normalization', 'health', 'media.audio', 'media.video', 'live.broadcast', 'live.audience'] as const);
export const OPTIONAL_RTC_CAPABILITIES = freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'cloud-mix', 'cdn-relay', 'data-channel', 'transcription', 'beauty', 'spatial-audio', 'e2ee', 'provider.active-query'] as const);

export type RtcRequiredCapability = (typeof REQUIRED_RTC_CAPABILITIES)[number];
export type RtcOptionalCapability = (typeof OPTIONAL_RTC_CAPABILITIES)[number];
export type RtcCapabilityKey = RtcRequiredCapability | RtcOptionalCapability;

export const SESSION_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'session',
  category: 'required-baseline',
  surface: 'cross-surface',
});

export const CREDENTIAL_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'credential',
  category: 'required-baseline',
  surface: 'control-plane',
});

export const PROVIDER_WEBHOOK_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'provider.webhook',
  category: 'required-baseline',
  surface: 'control-plane',
});

export const PROVIDER_EVENT_NORMALIZATION_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'provider.event-normalization',
  category: 'required-baseline',
  surface: 'control-plane',
});

export const HEALTH_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'health',
  category: 'required-baseline',
  surface: 'control-plane',
});

export const MEDIA_AUDIO_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'media.audio',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const MEDIA_VIDEO_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'media.video',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const LIVE_BROADCAST_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'live.broadcast',
  category: 'required-baseline',
  surface: 'cross-surface',
});

export const LIVE_AUDIENCE_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'live.audience',
  category: 'required-baseline',
  surface: 'cross-surface',
});

export const SCREEN_SHARE_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'screen-share',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const RECORDING_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'recording',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const ARTIFACT_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'artifact',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const CLOUD_MIX_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'cloud-mix',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const CDN_RELAY_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'cdn-relay',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const DATA_CHANNEL_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'data-channel',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const TRANSCRIPTION_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'transcription',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const BEAUTY_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'beauty',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const SPATIAL_AUDIO_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'spatial-audio',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const E2EE_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'e2ee',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const PROVIDER_ACTIVE_QUERY_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'provider.active-query',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const RTC_CAPABILITY_CATALOG: readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] = freezeRtcRuntimeValue([
  SESSION_RTC_CAPABILITY_DESCRIPTOR,
  CREDENTIAL_RTC_CAPABILITY_DESCRIPTOR,
  PROVIDER_WEBHOOK_RTC_CAPABILITY_DESCRIPTOR,
  PROVIDER_EVENT_NORMALIZATION_RTC_CAPABILITY_DESCRIPTOR,
  HEALTH_RTC_CAPABILITY_DESCRIPTOR,
  MEDIA_AUDIO_RTC_CAPABILITY_DESCRIPTOR,
  MEDIA_VIDEO_RTC_CAPABILITY_DESCRIPTOR,
  LIVE_BROADCAST_RTC_CAPABILITY_DESCRIPTOR,
  LIVE_AUDIENCE_RTC_CAPABILITY_DESCRIPTOR,
  SCREEN_SHARE_RTC_CAPABILITY_DESCRIPTOR,
  RECORDING_RTC_CAPABILITY_DESCRIPTOR,
  ARTIFACT_RTC_CAPABILITY_DESCRIPTOR,
  CLOUD_MIX_RTC_CAPABILITY_DESCRIPTOR,
  CDN_RELAY_RTC_CAPABILITY_DESCRIPTOR,
  DATA_CHANNEL_RTC_CAPABILITY_DESCRIPTOR,
  TRANSCRIPTION_RTC_CAPABILITY_DESCRIPTOR,
  BEAUTY_RTC_CAPABILITY_DESCRIPTOR,
  SPATIAL_AUDIO_RTC_CAPABILITY_DESCRIPTOR,
  E2EE_RTC_CAPABILITY_DESCRIPTOR,
  PROVIDER_ACTIVE_QUERY_RTC_CAPABILITY_DESCRIPTOR
]);

const RTC_CAPABILITY_DESCRIPTOR_BY_KEY = new Map<
  RtcCapabilityKey,
  RtcCapabilityDescriptor<RtcCapabilityKey>
>(RTC_CAPABILITY_CATALOG.map((descriptor) => [descriptor.capabilityKey, descriptor]));

export function getRtcCapabilityCatalog(): readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] {
  return RTC_CAPABILITY_CATALOG;
}

export function getRtcCapabilityDescriptor(
  capabilityKey: RtcCapabilityKey,
): RtcCapabilityDescriptor<RtcCapabilityKey> | undefined {
  return RTC_CAPABILITY_DESCRIPTOR_BY_KEY.get(capabilityKey);
}
