#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderCatalogEntry {
    pub providerKey: &'static str,
    pub pluginId: &'static str,
    pub driverId: &'static str,
    pub defaultSelected: bool,
}

pub struct RtcProviderCatalog;

pub const DEFAULT_RTC_PROVIDER_KEY: &str = "volcengine";

pub const OFFICIAL_RTC_PROVIDERS: [RtcProviderCatalogEntry; 10] = [
    RtcProviderCatalogEntry { providerKey: "volcengine", pluginId: "rtc-volcengine", driverId: "sdkwork-rtc-driver-volcengine", defaultSelected: true },
    RtcProviderCatalogEntry { providerKey: "aliyun", pluginId: "rtc-aliyun", driverId: "sdkwork-rtc-driver-aliyun", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "tencent", pluginId: "rtc-tencent", driverId: "sdkwork-rtc-driver-tencent", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "agora", pluginId: "rtc-agora", driverId: "sdkwork-rtc-driver-agora", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "zego", pluginId: "rtc-zego", driverId: "sdkwork-rtc-driver-zego", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "livekit", pluginId: "rtc-livekit", driverId: "sdkwork-rtc-driver-livekit", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "twilio", pluginId: "rtc-twilio", driverId: "sdkwork-rtc-driver-twilio", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "jitsi", pluginId: "rtc-jitsi", driverId: "sdkwork-rtc-driver-jitsi", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "janus", pluginId: "rtc-janus", driverId: "sdkwork-rtc-driver-janus", defaultSelected: false },
    RtcProviderCatalogEntry { providerKey: "mediasoup", pluginId: "rtc-mediasoup", driverId: "sdkwork-rtc-driver-mediasoup", defaultSelected: false },
];

pub fn get_rtc_provider_by_provider_key(
    provider_key: &str,
) -> Option<&'static RtcProviderCatalogEntry> {
    OFFICIAL_RTC_PROVIDERS
        .iter()
        .find(|entry| entry.providerKey == provider_key)
}
