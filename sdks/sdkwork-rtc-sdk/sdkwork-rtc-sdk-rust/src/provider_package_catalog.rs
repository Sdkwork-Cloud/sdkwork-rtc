#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderPackageCatalogEntry {
    pub providerKey: &'static str,
    pub pluginId: &'static str,
    pub driverId: &'static str,
    pub packageIdentity: &'static str,
    pub manifestPath: &'static str,
    pub readmePath: &'static str,
    pub sourcePath: &'static str,
    pub sourceSymbol: &'static str,
    pub builtin: bool,
    pub rootPublic: bool,
    pub status: &'static str,
    pub runtimeBridgeStatus: &'static str,
}

pub struct RtcProviderPackageCatalog;

pub const OFFICIAL_RTC_PROVIDER_PACKAGES: [RtcProviderPackageCatalogEntry; 10] = [
    RtcProviderPackageCatalogEntry { providerKey: "volcengine", pluginId: "rtc-volcengine", driverId: "sdkwork-rtc-driver-volcengine", packageIdentity: "rtc-sdk-provider-volcengine", manifestPath: "providers/rtc-sdk-provider-volcengine/Cargo.toml", readmePath: "providers/rtc-sdk-provider-volcengine/README.md", sourcePath: "providers/rtc-sdk-provider-volcengine/src/lib.rs", sourceSymbol: "RtcProviderVolcenginePackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "aliyun", pluginId: "rtc-aliyun", driverId: "sdkwork-rtc-driver-aliyun", packageIdentity: "rtc-sdk-provider-aliyun", manifestPath: "providers/rtc-sdk-provider-aliyun/Cargo.toml", readmePath: "providers/rtc-sdk-provider-aliyun/README.md", sourcePath: "providers/rtc-sdk-provider-aliyun/src/lib.rs", sourceSymbol: "RtcProviderAliyunPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "tencent", pluginId: "rtc-tencent", driverId: "sdkwork-rtc-driver-tencent", packageIdentity: "rtc-sdk-provider-tencent", manifestPath: "providers/rtc-sdk-provider-tencent/Cargo.toml", readmePath: "providers/rtc-sdk-provider-tencent/README.md", sourcePath: "providers/rtc-sdk-provider-tencent/src/lib.rs", sourceSymbol: "RtcProviderTencentPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "agora", pluginId: "rtc-agora", driverId: "sdkwork-rtc-driver-agora", packageIdentity: "rtc-sdk-provider-agora", manifestPath: "providers/rtc-sdk-provider-agora/Cargo.toml", readmePath: "providers/rtc-sdk-provider-agora/README.md", sourcePath: "providers/rtc-sdk-provider-agora/src/lib.rs", sourceSymbol: "RtcProviderAgoraPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "zego", pluginId: "rtc-zego", driverId: "sdkwork-rtc-driver-zego", packageIdentity: "rtc-sdk-provider-zego", manifestPath: "providers/rtc-sdk-provider-zego/Cargo.toml", readmePath: "providers/rtc-sdk-provider-zego/README.md", sourcePath: "providers/rtc-sdk-provider-zego/src/lib.rs", sourceSymbol: "RtcProviderZegoPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "livekit", pluginId: "rtc-livekit", driverId: "sdkwork-rtc-driver-livekit", packageIdentity: "rtc-sdk-provider-livekit", manifestPath: "providers/rtc-sdk-provider-livekit/Cargo.toml", readmePath: "providers/rtc-sdk-provider-livekit/README.md", sourcePath: "providers/rtc-sdk-provider-livekit/src/lib.rs", sourceSymbol: "RtcProviderLivekitPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "twilio", pluginId: "rtc-twilio", driverId: "sdkwork-rtc-driver-twilio", packageIdentity: "rtc-sdk-provider-twilio", manifestPath: "providers/rtc-sdk-provider-twilio/Cargo.toml", readmePath: "providers/rtc-sdk-provider-twilio/README.md", sourcePath: "providers/rtc-sdk-provider-twilio/src/lib.rs", sourceSymbol: "RtcProviderTwilioPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "jitsi", pluginId: "rtc-jitsi", driverId: "sdkwork-rtc-driver-jitsi", packageIdentity: "rtc-sdk-provider-jitsi", manifestPath: "providers/rtc-sdk-provider-jitsi/Cargo.toml", readmePath: "providers/rtc-sdk-provider-jitsi/README.md", sourcePath: "providers/rtc-sdk-provider-jitsi/src/lib.rs", sourceSymbol: "RtcProviderJitsiPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "janus", pluginId: "rtc-janus", driverId: "sdkwork-rtc-driver-janus", packageIdentity: "rtc-sdk-provider-janus", manifestPath: "providers/rtc-sdk-provider-janus/Cargo.toml", readmePath: "providers/rtc-sdk-provider-janus/README.md", sourcePath: "providers/rtc-sdk-provider-janus/src/lib.rs", sourceSymbol: "RtcProviderJanusPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
    RtcProviderPackageCatalogEntry { providerKey: "mediasoup", pluginId: "rtc-mediasoup", driverId: "sdkwork-rtc-driver-mediasoup", packageIdentity: "rtc-sdk-provider-mediasoup", manifestPath: "providers/rtc-sdk-provider-mediasoup/Cargo.toml", readmePath: "providers/rtc-sdk-provider-mediasoup/README.md", sourcePath: "providers/rtc-sdk-provider-mediasoup/src/lib.rs", sourceSymbol: "RtcProviderMediasoupPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved" },
];

pub fn get_rtc_provider_package_by_provider_key(
    provider_key: &str,
) -> Option<&'static RtcProviderPackageCatalogEntry> {
    OFFICIAL_RTC_PROVIDER_PACKAGES
        .iter()
        .find(|entry| entry.providerKey == provider_key)
}

pub fn get_rtc_provider_package_by_package_identity(
    package_identity: &str,
) -> Option<&'static RtcProviderPackageCatalogEntry> {
    OFFICIAL_RTC_PROVIDER_PACKAGES
        .iter()
        .find(|entry| entry.packageIdentity == package_identity)
}
