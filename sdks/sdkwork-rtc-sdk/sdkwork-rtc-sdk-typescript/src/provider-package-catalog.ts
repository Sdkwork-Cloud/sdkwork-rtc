import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderPackageCatalogEntry } from './types.js';

export const RTC_PROVIDER_PACKAGE_STATUSES = freezeRtcRuntimeValue(['root_public_reference_boundary', 'package_reference_boundary'] as const);

export const VOLCENGINE_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'volcengine',
  pluginId: 'rtc-volcengine',
  driverId: 'sdkwork-rtc-driver-volcengine',
  packageIdentity: '@sdkwork/rtc-sdk-provider-volcengine',
  manifestPath: 'providers/rtc-sdk-provider-volcengine/package.json',
  readmePath: 'providers/rtc-sdk-provider-volcengine/README.md',
  sourcePath: 'providers/rtc-sdk-provider-volcengine/index.js',
  declarationPath: 'providers/rtc-sdk-provider-volcengine/index.d.ts',
  sourceSymbol: 'VOLCENGINE_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/volcengine.ts',
  driverFactory: 'createVolcengineRtcDriver',
  metadataSymbol: 'VOLCENGINE_RTC_PROVIDER_METADATA',
  moduleSymbol: 'VOLCENGINE_RTC_PROVIDER_MODULE',
  builtin: true,
  rootPublic: true,
  status: 'root_public_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'cloud-mix'] as const),
  extensionKeys: freezeRtcRuntimeValue(['volcengine.native-client'] as const),
});

export const ALIYUN_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'aliyun',
  pluginId: 'rtc-aliyun',
  driverId: 'sdkwork-rtc-driver-aliyun',
  packageIdentity: '@sdkwork/rtc-sdk-provider-aliyun',
  manifestPath: 'providers/rtc-sdk-provider-aliyun/package.json',
  readmePath: 'providers/rtc-sdk-provider-aliyun/README.md',
  sourcePath: 'providers/rtc-sdk-provider-aliyun/index.js',
  declarationPath: 'providers/rtc-sdk-provider-aliyun/index.d.ts',
  sourceSymbol: 'ALIYUN_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/aliyun.ts',
  driverFactory: 'createAliyunRtcDriver',
  metadataSymbol: 'ALIYUN_RTC_PROVIDER_METADATA',
  moduleSymbol: 'ALIYUN_RTC_PROVIDER_MODULE',
  builtin: true,
  rootPublic: true,
  status: 'root_public_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact'] as const),
  extensionKeys: freezeRtcRuntimeValue(['aliyun.native-client'] as const),
});

export const TENCENT_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'tencent',
  pluginId: 'rtc-tencent',
  driverId: 'sdkwork-rtc-driver-tencent',
  packageIdentity: '@sdkwork/rtc-sdk-provider-tencent',
  manifestPath: 'providers/rtc-sdk-provider-tencent/package.json',
  readmePath: 'providers/rtc-sdk-provider-tencent/README.md',
  sourcePath: 'providers/rtc-sdk-provider-tencent/index.js',
  declarationPath: 'providers/rtc-sdk-provider-tencent/index.d.ts',
  sourceSymbol: 'TENCENT_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/tencent.ts',
  driverFactory: 'createTencentRtcDriver',
  metadataSymbol: 'TENCENT_RTC_PROVIDER_METADATA',
  moduleSymbol: 'TENCENT_RTC_PROVIDER_MODULE',
  builtin: true,
  rootPublic: true,
  status: 'root_public_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'cdn-relay'] as const),
  extensionKeys: freezeRtcRuntimeValue(['tencent.native-client'] as const),
});

export const AGORA_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'agora',
  pluginId: 'rtc-agora',
  driverId: 'sdkwork-rtc-driver-agora',
  packageIdentity: '@sdkwork/rtc-sdk-provider-agora',
  manifestPath: 'providers/rtc-sdk-provider-agora/package.json',
  readmePath: 'providers/rtc-sdk-provider-agora/README.md',
  sourcePath: 'providers/rtc-sdk-provider-agora/index.js',
  declarationPath: 'providers/rtc-sdk-provider-agora/index.d.ts',
  sourceSymbol: 'AGORA_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/agora.ts',
  driverFactory: 'createAgoraRtcDriver',
  metadataSymbol: 'AGORA_RTC_PROVIDER_METADATA',
  moduleSymbol: 'AGORA_RTC_PROVIDER_MODULE',
  builtin: true,
  rootPublic: true,
  status: 'root_public_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'cloud-mix', 'data-channel', 'spatial-audio', 'e2ee'] as const),
  extensionKeys: freezeRtcRuntimeValue(['agora.native-client'] as const),
});

export const ZEGO_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'zego',
  pluginId: 'rtc-zego',
  driverId: 'sdkwork-rtc-driver-zego',
  packageIdentity: '@sdkwork/rtc-sdk-provider-zego',
  manifestPath: 'providers/rtc-sdk-provider-zego/package.json',
  readmePath: 'providers/rtc-sdk-provider-zego/README.md',
  sourcePath: 'providers/rtc-sdk-provider-zego/index.js',
  declarationPath: 'providers/rtc-sdk-provider-zego/index.d.ts',
  sourceSymbol: 'ZEGO_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/zego.ts',
  driverFactory: 'createZegoRtcDriver',
  metadataSymbol: 'ZEGO_RTC_PROVIDER_METADATA',
  moduleSymbol: 'ZEGO_RTC_PROVIDER_MODULE',
  builtin: false,
  rootPublic: false,
  status: 'package_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'cloud-mix', 'beauty'] as const),
  extensionKeys: freezeRtcRuntimeValue(['zego.native-client'] as const),
});

export const LIVEKIT_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'livekit',
  pluginId: 'rtc-livekit',
  driverId: 'sdkwork-rtc-driver-livekit',
  packageIdentity: '@sdkwork/rtc-sdk-provider-livekit',
  manifestPath: 'providers/rtc-sdk-provider-livekit/package.json',
  readmePath: 'providers/rtc-sdk-provider-livekit/README.md',
  sourcePath: 'providers/rtc-sdk-provider-livekit/index.js',
  declarationPath: 'providers/rtc-sdk-provider-livekit/index.d.ts',
  sourceSymbol: 'LIVEKIT_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/livekit.ts',
  driverFactory: 'createLivekitRtcDriver',
  metadataSymbol: 'LIVEKIT_RTC_PROVIDER_METADATA',
  moduleSymbol: 'LIVEKIT_RTC_PROVIDER_MODULE',
  builtin: true,
  rootPublic: true,
  status: 'root_public_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'data-channel', 'transcription', 'e2ee'] as const),
  extensionKeys: freezeRtcRuntimeValue(['livekit.native-client'] as const),
});

export const TWILIO_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'twilio',
  pluginId: 'rtc-twilio',
  driverId: 'sdkwork-rtc-driver-twilio',
  packageIdentity: '@sdkwork/rtc-sdk-provider-twilio',
  manifestPath: 'providers/rtc-sdk-provider-twilio/package.json',
  readmePath: 'providers/rtc-sdk-provider-twilio/README.md',
  sourcePath: 'providers/rtc-sdk-provider-twilio/index.js',
  declarationPath: 'providers/rtc-sdk-provider-twilio/index.d.ts',
  sourceSymbol: 'TWILIO_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/twilio.ts',
  driverFactory: 'createTwilioRtcDriver',
  metadataSymbol: 'TWILIO_RTC_PROVIDER_METADATA',
  moduleSymbol: 'TWILIO_RTC_PROVIDER_MODULE',
  builtin: false,
  rootPublic: false,
  status: 'package_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'data-channel'] as const),
  extensionKeys: freezeRtcRuntimeValue(['twilio.native-client'] as const),
});

export const JITSI_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'jitsi',
  pluginId: 'rtc-jitsi',
  driverId: 'sdkwork-rtc-driver-jitsi',
  packageIdentity: '@sdkwork/rtc-sdk-provider-jitsi',
  manifestPath: 'providers/rtc-sdk-provider-jitsi/package.json',
  readmePath: 'providers/rtc-sdk-provider-jitsi/README.md',
  sourcePath: 'providers/rtc-sdk-provider-jitsi/index.js',
  declarationPath: 'providers/rtc-sdk-provider-jitsi/index.d.ts',
  sourceSymbol: 'JITSI_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/jitsi.ts',
  driverFactory: 'createJitsiRtcDriver',
  metadataSymbol: 'JITSI_RTC_PROVIDER_METADATA',
  moduleSymbol: 'JITSI_RTC_PROVIDER_MODULE',
  builtin: false,
  rootPublic: false,
  status: 'package_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['screen-share', 'recording', 'artifact', 'transcription'] as const),
  extensionKeys: freezeRtcRuntimeValue(['jitsi.native-client'] as const),
});

export const JANUS_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'janus',
  pluginId: 'rtc-janus',
  driverId: 'sdkwork-rtc-driver-janus',
  packageIdentity: '@sdkwork/rtc-sdk-provider-janus',
  manifestPath: 'providers/rtc-sdk-provider-janus/package.json',
  readmePath: 'providers/rtc-sdk-provider-janus/README.md',
  sourcePath: 'providers/rtc-sdk-provider-janus/index.js',
  declarationPath: 'providers/rtc-sdk-provider-janus/index.d.ts',
  sourceSymbol: 'JANUS_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/janus.ts',
  driverFactory: 'createJanusRtcDriver',
  metadataSymbol: 'JANUS_RTC_PROVIDER_METADATA',
  moduleSymbol: 'JANUS_RTC_PROVIDER_MODULE',
  builtin: false,
  rootPublic: false,
  status: 'package_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['data-channel'] as const),
  extensionKeys: freezeRtcRuntimeValue(['janus.native-client'] as const),
});

export const MEDIASOUP_RTC_PROVIDER_PACKAGE_ENTRY: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'mediasoup',
  pluginId: 'rtc-mediasoup',
  driverId: 'sdkwork-rtc-driver-mediasoup',
  packageIdentity: '@sdkwork/rtc-sdk-provider-mediasoup',
  manifestPath: 'providers/rtc-sdk-provider-mediasoup/package.json',
  readmePath: 'providers/rtc-sdk-provider-mediasoup/README.md',
  sourcePath: 'providers/rtc-sdk-provider-mediasoup/index.js',
  declarationPath: 'providers/rtc-sdk-provider-mediasoup/index.d.ts',
  sourceSymbol: 'MEDIASOUP_RTC_PROVIDER_MODULE',
  sourceModule: '../../src/providers/mediasoup.ts',
  driverFactory: 'createMediasoupRtcDriver',
  metadataSymbol: 'MEDIASOUP_RTC_PROVIDER_METADATA',
  moduleSymbol: 'MEDIASOUP_RTC_PROVIDER_MODULE',
  builtin: false,
  rootPublic: false,
  status: 'package_reference_boundary',
  runtimeBridgeStatus: 'reference-baseline',
  requiredCapabilities: freezeRtcRuntimeValue(['session', 'credential', 'callback', 'health', 'call.audio', 'call.video', 'live.broadcast', 'live.audience'] as const),
  optionalCapabilities: freezeRtcRuntimeValue(['data-channel'] as const),
  extensionKeys: freezeRtcRuntimeValue(['mediasoup.native-client'] as const),
});

export const RTC_PROVIDER_PACKAGE_CATALOG: readonly RtcProviderPackageCatalogEntry[] = freezeRtcRuntimeValue([
  VOLCENGINE_RTC_PROVIDER_PACKAGE_ENTRY,
  ALIYUN_RTC_PROVIDER_PACKAGE_ENTRY,
  TENCENT_RTC_PROVIDER_PACKAGE_ENTRY,
  AGORA_RTC_PROVIDER_PACKAGE_ENTRY,
  ZEGO_RTC_PROVIDER_PACKAGE_ENTRY,
  LIVEKIT_RTC_PROVIDER_PACKAGE_ENTRY,
  TWILIO_RTC_PROVIDER_PACKAGE_ENTRY,
  JITSI_RTC_PROVIDER_PACKAGE_ENTRY,
  JANUS_RTC_PROVIDER_PACKAGE_ENTRY,
  MEDIASOUP_RTC_PROVIDER_PACKAGE_ENTRY
]);

const RTC_PROVIDER_PACKAGE_BY_PROVIDER_KEY = new Map<string, RtcProviderPackageCatalogEntry>(
  RTC_PROVIDER_PACKAGE_CATALOG.map((entry) => [entry.providerKey, entry]),
);

const RTC_PROVIDER_PACKAGE_BY_PACKAGE_IDENTITY = new Map<string, RtcProviderPackageCatalogEntry>(
  RTC_PROVIDER_PACKAGE_CATALOG.map((entry) => [entry.packageIdentity, entry]),
);

export function getRtcProviderPackageCatalog(): readonly RtcProviderPackageCatalogEntry[] {
  return RTC_PROVIDER_PACKAGE_CATALOG;
}

export function getRtcProviderPackageByProviderKey(
  providerKey: string,
): RtcProviderPackageCatalogEntry | undefined {
  return RTC_PROVIDER_PACKAGE_BY_PROVIDER_KEY.get(providerKey);
}

export function getRtcProviderPackageByPackageIdentity(
  packageIdentity: string,
): RtcProviderPackageCatalogEntry | undefined {
  return RTC_PROVIDER_PACKAGE_BY_PACKAGE_IDENTITY.get(packageIdentity);
}

export function getRtcProviderPackage(
  providerKey: string,
): RtcProviderPackageCatalogEntry | undefined {
  return getRtcProviderPackageByProviderKey(providerKey);
}
