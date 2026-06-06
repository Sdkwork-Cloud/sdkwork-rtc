import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import { REQUIRED_RTC_CAPABILITIES } from './capability-catalog.js';
import type { RtcProviderCatalogEntry } from './types.js';

export const DEFAULT_RTC_PROVIDER_KEY = 'volcengine';
export const DEFAULT_RTC_PROVIDER_PLUGIN_ID = 'rtc-volcengine';
export const DEFAULT_RTC_PROVIDER_DRIVER_ID = 'sdkwork-rtc-driver-volcengine';
export const BUILTIN_RTC_PROVIDER_KEYS = freezeRtcRuntimeValue(['volcengine', 'aliyun', 'tencent', 'agora', 'livekit'] as const);
export const OFFICIAL_RTC_PROVIDER_KEYS = freezeRtcRuntimeValue(['volcengine', 'aliyun', 'tencent', 'agora', 'zego', 'livekit', 'twilio', 'jitsi', 'janus', 'mediasoup'] as const);

export const VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'volcengine',
  pluginId: 'rtc-volcengine',
  driverId: 'sdkwork-rtc-driver-volcengine',
  displayName: 'Volcengine RTC',
  defaultSelected: true,
  urlSchemes: ['rtc:volcengine'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact', 'cloud-mix'] as const,
  extensionKeys: ['volcengine.native-client'] as const,
  tier: 'tier-a',
  builtin: true,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-volcengine',
    sourceModule: '../../src/providers/volcengine.ts',
    driverFactory: 'createVolcengineRtcDriver',
    metadataSymbol: 'VOLCENGINE_RTC_PROVIDER_METADATA',
    moduleSymbol: 'VOLCENGINE_RTC_PROVIDER_MODULE',
    rootPublic: true,
  },
});

export const ALIYUN_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'aliyun',
  pluginId: 'rtc-aliyun',
  driverId: 'sdkwork-rtc-driver-aliyun',
  displayName: 'Aliyun RTC',
  defaultSelected: false,
  urlSchemes: ['rtc:aliyun'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact'] as const,
  extensionKeys: ['aliyun.native-client'] as const,
  tier: 'tier-a',
  builtin: true,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-aliyun',
    sourceModule: '../../src/providers/aliyun.ts',
    driverFactory: 'createAliyunRtcDriver',
    metadataSymbol: 'ALIYUN_RTC_PROVIDER_METADATA',
    moduleSymbol: 'ALIYUN_RTC_PROVIDER_MODULE',
    rootPublic: true,
  },
});

export const TENCENT_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'tencent',
  pluginId: 'rtc-tencent',
  driverId: 'sdkwork-rtc-driver-tencent',
  displayName: 'Tencent RTC',
  defaultSelected: false,
  urlSchemes: ['rtc:tencent'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact', 'cdn-relay'] as const,
  extensionKeys: ['tencent.native-client'] as const,
  tier: 'tier-a',
  builtin: true,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-tencent',
    sourceModule: '../../src/providers/tencent.ts',
    driverFactory: 'createTencentRtcDriver',
    metadataSymbol: 'TENCENT_RTC_PROVIDER_METADATA',
    moduleSymbol: 'TENCENT_RTC_PROVIDER_MODULE',
    rootPublic: true,
  },
});

export const AGORA_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'agora',
  pluginId: 'rtc-agora',
  driverId: 'sdkwork-rtc-driver-agora',
  displayName: 'Agora RTC',
  defaultSelected: false,
  urlSchemes: ['rtc:agora'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact', 'cloud-mix', 'data-channel', 'spatial-audio', 'e2ee'] as const,
  extensionKeys: ['agora.native-client'] as const,
  tier: 'tier-a',
  builtin: true,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-agora',
    sourceModule: '../../src/providers/agora.ts',
    driverFactory: 'createAgoraRtcDriver',
    metadataSymbol: 'AGORA_RTC_PROVIDER_METADATA',
    moduleSymbol: 'AGORA_RTC_PROVIDER_MODULE',
    rootPublic: true,
  },
});

export const ZEGO_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'zego',
  pluginId: 'rtc-zego',
  driverId: 'sdkwork-rtc-driver-zego',
  displayName: 'ZEGO RTC',
  defaultSelected: false,
  urlSchemes: ['rtc:zego'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact', 'cloud-mix', 'beauty'] as const,
  extensionKeys: ['zego.native-client'] as const,
  tier: 'tier-b',
  builtin: false,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-zego',
    sourceModule: '../../src/providers/zego.ts',
    driverFactory: 'createZegoRtcDriver',
    metadataSymbol: 'ZEGO_RTC_PROVIDER_METADATA',
    moduleSymbol: 'ZEGO_RTC_PROVIDER_MODULE',
    rootPublic: false,
  },
});

export const LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'livekit',
  pluginId: 'rtc-livekit',
  driverId: 'sdkwork-rtc-driver-livekit',
  displayName: 'LiveKit RTC',
  defaultSelected: false,
  urlSchemes: ['rtc:livekit'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact', 'data-channel', 'transcription', 'e2ee'] as const,
  extensionKeys: ['livekit.native-client'] as const,
  tier: 'tier-a',
  builtin: true,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-livekit',
    sourceModule: '../../src/providers/livekit.ts',
    driverFactory: 'createLivekitRtcDriver',
    metadataSymbol: 'LIVEKIT_RTC_PROVIDER_METADATA',
    moduleSymbol: 'LIVEKIT_RTC_PROVIDER_MODULE',
    rootPublic: true,
  },
});

export const TWILIO_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'twilio',
  pluginId: 'rtc-twilio',
  driverId: 'sdkwork-rtc-driver-twilio',
  displayName: 'Twilio Video',
  defaultSelected: false,
  urlSchemes: ['rtc:twilio'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact', 'data-channel'] as const,
  extensionKeys: ['twilio.native-client'] as const,
  tier: 'tier-b',
  builtin: false,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-twilio',
    sourceModule: '../../src/providers/twilio.ts',
    driverFactory: 'createTwilioRtcDriver',
    metadataSymbol: 'TWILIO_RTC_PROVIDER_METADATA',
    moduleSymbol: 'TWILIO_RTC_PROVIDER_MODULE',
    rootPublic: false,
  },
});

export const JITSI_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'jitsi',
  pluginId: 'rtc-jitsi',
  driverId: 'sdkwork-rtc-driver-jitsi',
  displayName: 'Jitsi Meet',
  defaultSelected: false,
  urlSchemes: ['rtc:jitsi'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['screen-share', 'recording', 'artifact', 'transcription'] as const,
  extensionKeys: ['jitsi.native-client'] as const,
  tier: 'tier-b',
  builtin: false,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-jitsi',
    sourceModule: '../../src/providers/jitsi.ts',
    driverFactory: 'createJitsiRtcDriver',
    metadataSymbol: 'JITSI_RTC_PROVIDER_METADATA',
    moduleSymbol: 'JITSI_RTC_PROVIDER_MODULE',
    rootPublic: false,
  },
});

export const JANUS_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'janus',
  pluginId: 'rtc-janus',
  driverId: 'sdkwork-rtc-driver-janus',
  displayName: 'Janus RTC',
  defaultSelected: false,
  urlSchemes: ['rtc:janus'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['data-channel'] as const,
  extensionKeys: ['janus.native-client'] as const,
  tier: 'tier-c',
  builtin: false,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-janus',
    sourceModule: '../../src/providers/janus.ts',
    driverFactory: 'createJanusRtcDriver',
    metadataSymbol: 'JANUS_RTC_PROVIDER_METADATA',
    moduleSymbol: 'JANUS_RTC_PROVIDER_MODULE',
    rootPublic: false,
  },
});

export const MEDIASOUP_RTC_PROVIDER_CATALOG_ENTRY: RtcProviderCatalogEntry = freezeRtcRuntimeValue({
  providerKey: 'mediasoup',
  pluginId: 'rtc-mediasoup',
  driverId: 'sdkwork-rtc-driver-mediasoup',
  displayName: 'mediasoup RTC',
  defaultSelected: false,
  urlSchemes: ['rtc:mediasoup'] as const,
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ['data-channel'] as const,
  extensionKeys: ['mediasoup.native-client'] as const,
  tier: 'tier-c',
  builtin: false,
  typescriptAdapter: {
    sdkProvisioning: 'consumer-supplied',
    bindingStrategy: 'native-factory',
    bundlePolicy: 'must-not-bundle',
    runtimeBridgeStatus: 'reference-baseline',
    officialVendorSdkRequirement: 'required',
  },
  typescriptPackage: {
    packageName: '@sdkwork/rtc-sdk-provider-mediasoup',
    sourceModule: '../../src/providers/mediasoup.ts',
    driverFactory: 'createMediasoupRtcDriver',
    metadataSymbol: 'MEDIASOUP_RTC_PROVIDER_METADATA',
    moduleSymbol: 'MEDIASOUP_RTC_PROVIDER_MODULE',
    rootPublic: false,
  },
});

export const BUILTIN_RTC_PROVIDER_CATALOG: readonly RtcProviderCatalogEntry[] = freezeRtcRuntimeValue([
  VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY,
  ALIYUN_RTC_PROVIDER_CATALOG_ENTRY,
  TENCENT_RTC_PROVIDER_CATALOG_ENTRY,
  AGORA_RTC_PROVIDER_CATALOG_ENTRY,
  LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY
]);

export const OFFICIAL_RTC_PROVIDER_CATALOG: readonly RtcProviderCatalogEntry[] = freezeRtcRuntimeValue([
  VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY,
  ALIYUN_RTC_PROVIDER_CATALOG_ENTRY,
  TENCENT_RTC_PROVIDER_CATALOG_ENTRY,
  AGORA_RTC_PROVIDER_CATALOG_ENTRY,
  ZEGO_RTC_PROVIDER_CATALOG_ENTRY,
  LIVEKIT_RTC_PROVIDER_CATALOG_ENTRY,
  TWILIO_RTC_PROVIDER_CATALOG_ENTRY,
  JITSI_RTC_PROVIDER_CATALOG_ENTRY,
  JANUS_RTC_PROVIDER_CATALOG_ENTRY,
  MEDIASOUP_RTC_PROVIDER_CATALOG_ENTRY
]);

const BUILTIN_RTC_PROVIDER_BY_KEY = new Map<string, RtcProviderCatalogEntry>(
  BUILTIN_RTC_PROVIDER_CATALOG.map((provider) => [provider.providerKey, provider]),
);

const OFFICIAL_RTC_PROVIDER_BY_KEY = new Map<string, RtcProviderCatalogEntry>(
  OFFICIAL_RTC_PROVIDER_CATALOG.map((provider) => [provider.providerKey, provider]),
);

export function getBuiltinRtcProviderMetadata(): readonly RtcProviderCatalogEntry[] {
  return BUILTIN_RTC_PROVIDER_CATALOG;
}

export function getBuiltinRtcProviderMetadataByKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return BUILTIN_RTC_PROVIDER_BY_KEY.get(providerKey);
}

export function getOfficialRtcProviderMetadata(): readonly RtcProviderCatalogEntry[] {
  return OFFICIAL_RTC_PROVIDER_CATALOG;
}

export function getOfficialRtcProviderMetadataByKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return OFFICIAL_RTC_PROVIDER_BY_KEY.get(providerKey);
}

export function getRtcProviderByProviderKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return getOfficialRtcProviderMetadataByKey(providerKey);
}
