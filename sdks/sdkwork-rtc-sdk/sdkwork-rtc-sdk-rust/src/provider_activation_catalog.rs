#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderActivationCatalogEntry {
    pub providerKey: &'static str,
    pub pluginId: &'static str,
    pub driverId: &'static str,
    pub activationStatus: &'static str,
    pub runtimeBridge: bool,
    pub rootPublic: bool,
    pub packageBoundary: bool,
    pub builtin: bool,
    pub packageIdentity: &'static str,
}

pub struct RtcProviderActivationCatalog;

pub const RTC_PROVIDER_ACTIVATION_STATUSES: [&str; 3] = ["root-public-builtin", "package-boundary", "control-metadata-only"];

pub const OFFICIAL_RTC_PROVIDER_ACTIVATIONS: [RtcProviderActivationCatalogEntry; 10] = [
    RtcProviderActivationCatalogEntry { providerKey: "volcengine", pluginId: "rtc-volcengine", driverId: "sdkwork-rtc-driver-volcengine", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "rtc-sdk-provider-volcengine" },
    RtcProviderActivationCatalogEntry { providerKey: "aliyun", pluginId: "rtc-aliyun", driverId: "sdkwork-rtc-driver-aliyun", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "rtc-sdk-provider-aliyun" },
    RtcProviderActivationCatalogEntry { providerKey: "tencent", pluginId: "rtc-tencent", driverId: "sdkwork-rtc-driver-tencent", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "rtc-sdk-provider-tencent" },
    RtcProviderActivationCatalogEntry { providerKey: "agora", pluginId: "rtc-agora", driverId: "sdkwork-rtc-driver-agora", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "rtc-sdk-provider-agora" },
    RtcProviderActivationCatalogEntry { providerKey: "zego", pluginId: "rtc-zego", driverId: "sdkwork-rtc-driver-zego", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "rtc-sdk-provider-zego" },
    RtcProviderActivationCatalogEntry { providerKey: "livekit", pluginId: "rtc-livekit", driverId: "sdkwork-rtc-driver-livekit", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "rtc-sdk-provider-livekit" },
    RtcProviderActivationCatalogEntry { providerKey: "twilio", pluginId: "rtc-twilio", driverId: "sdkwork-rtc-driver-twilio", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "rtc-sdk-provider-twilio" },
    RtcProviderActivationCatalogEntry { providerKey: "jitsi", pluginId: "rtc-jitsi", driverId: "sdkwork-rtc-driver-jitsi", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "rtc-sdk-provider-jitsi" },
    RtcProviderActivationCatalogEntry { providerKey: "janus", pluginId: "rtc-janus", driverId: "sdkwork-rtc-driver-janus", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "rtc-sdk-provider-janus" },
    RtcProviderActivationCatalogEntry { providerKey: "mediasoup", pluginId: "rtc-mediasoup", driverId: "sdkwork-rtc-driver-mediasoup", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "rtc-sdk-provider-mediasoup" },
];

pub fn get_rtc_provider_activation_by_provider_key(
    provider_key: &str,
) -> Option<&'static RtcProviderActivationCatalogEntry> {
    OFFICIAL_RTC_PROVIDER_ACTIVATIONS
        .iter()
        .find(|entry| entry.providerKey == provider_key)
}
