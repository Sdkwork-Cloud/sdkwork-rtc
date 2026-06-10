import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderActivationEntry } from './types.js';

export const RTC_PROVIDER_ACTIVATION_STATUSES = freezeRtcRuntimeValue(['package-boundary', 'control-metadata-only'] as const);

export const VOLCENGINE_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'volcengine',
  pluginId: 'rtc-volcengine',
  driverId: 'sdkwork-rtc-driver-volcengine',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: true,
  packageIdentity: '@sdkwork/rtc-sdk-provider-volcengine',
});

export const ALIYUN_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'aliyun',
  pluginId: 'rtc-aliyun',
  driverId: 'sdkwork-rtc-driver-aliyun',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: true,
  packageIdentity: '@sdkwork/rtc-sdk-provider-aliyun',
});

export const TENCENT_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'tencent',
  pluginId: 'rtc-tencent',
  driverId: 'sdkwork-rtc-driver-tencent',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: true,
  packageIdentity: '@sdkwork/rtc-sdk-provider-tencent',
});

export const AGORA_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'agora',
  pluginId: 'rtc-agora',
  driverId: 'sdkwork-rtc-driver-agora',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: true,
  packageIdentity: '@sdkwork/rtc-sdk-provider-agora',
});

export const ZEGO_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'zego',
  pluginId: 'rtc-zego',
  driverId: 'sdkwork-rtc-driver-zego',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: false,
  packageIdentity: '@sdkwork/rtc-sdk-provider-zego',
});

export const LIVEKIT_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'livekit',
  pluginId: 'rtc-livekit',
  driverId: 'sdkwork-rtc-driver-livekit',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: true,
  packageIdentity: '@sdkwork/rtc-sdk-provider-livekit',
});

export const TWILIO_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'twilio',
  pluginId: 'rtc-twilio',
  driverId: 'sdkwork-rtc-driver-twilio',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: false,
  packageIdentity: '@sdkwork/rtc-sdk-provider-twilio',
});

export const JITSI_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'jitsi',
  pluginId: 'rtc-jitsi',
  driverId: 'sdkwork-rtc-driver-jitsi',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: false,
  packageIdentity: '@sdkwork/rtc-sdk-provider-jitsi',
});

export const JANUS_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'janus',
  pluginId: 'rtc-janus',
  driverId: 'sdkwork-rtc-driver-janus',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: false,
  packageIdentity: '@sdkwork/rtc-sdk-provider-janus',
});

export const MEDIASOUP_RTC_PROVIDER_ACTIVATION_ENTRY: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: 'mediasoup',
  pluginId: 'rtc-mediasoup',
  driverId: 'sdkwork-rtc-driver-mediasoup',
  activationStatus: 'package-boundary',
  runtimeBridge: true,
  rootPublic: false,
  packageBoundary: true,
  builtin: false,
  packageIdentity: '@sdkwork/rtc-sdk-provider-mediasoup',
});

export const RTC_PROVIDER_ACTIVATION_CATALOG: readonly RtcProviderActivationEntry[] = freezeRtcRuntimeValue([
  VOLCENGINE_RTC_PROVIDER_ACTIVATION_ENTRY,
  ALIYUN_RTC_PROVIDER_ACTIVATION_ENTRY,
  TENCENT_RTC_PROVIDER_ACTIVATION_ENTRY,
  AGORA_RTC_PROVIDER_ACTIVATION_ENTRY,
  ZEGO_RTC_PROVIDER_ACTIVATION_ENTRY,
  LIVEKIT_RTC_PROVIDER_ACTIVATION_ENTRY,
  TWILIO_RTC_PROVIDER_ACTIVATION_ENTRY,
  JITSI_RTC_PROVIDER_ACTIVATION_ENTRY,
  JANUS_RTC_PROVIDER_ACTIVATION_ENTRY,
  MEDIASOUP_RTC_PROVIDER_ACTIVATION_ENTRY
]);

const RTC_PROVIDER_ACTIVATION_BY_PROVIDER_KEY = new Map<
  string,
  RtcProviderActivationEntry
>(RTC_PROVIDER_ACTIVATION_CATALOG.map((entry) => [entry.providerKey, entry]));

export function getRtcProviderActivationCatalog(): readonly RtcProviderActivationEntry[] {
  return RTC_PROVIDER_ACTIVATION_CATALOG;
}

export function getRtcProviderActivationByProviderKey(
  providerKey: string,
): RtcProviderActivationEntry | undefined {
  return RTC_PROVIDER_ACTIVATION_BY_PROVIDER_KEY.get(providerKey);
}

export function getRtcProviderActivation(
  providerKey: string,
): RtcProviderActivationEntry | undefined {
  return getRtcProviderActivationByProviderKey(providerKey);
}
