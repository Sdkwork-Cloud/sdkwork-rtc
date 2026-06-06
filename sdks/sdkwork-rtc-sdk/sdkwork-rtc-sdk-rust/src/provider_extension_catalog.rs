#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcProviderExtensionCatalogEntry {
    pub extensionKey: &'static str,
    pub providerKey: &'static str,
    pub displayName: &'static str,
    pub surface: &'static str,
    pub access: &'static str,
    pub status: &'static str,
}

pub struct RtcProviderExtensionCatalog;

pub const RTC_PROVIDER_EXTENSION_SURFACES: [&str; 3] = [
    "control-plane",
    "runtime-bridge",
    "cross-surface",
];

pub const RTC_PROVIDER_EXTENSION_ACCESSES: [&str; 2] = [
    "unwrap-only",
    "extension-object",
];

pub const RTC_PROVIDER_EXTENSION_STATUSES: [&str; 2] = [
    "reference-baseline",
    "reserved",
];

pub const RTC_PROVIDER_EXTENSION_CATALOG: [RtcProviderExtensionCatalogEntry; 10] = [
    RtcProviderExtensionCatalogEntry { extensionKey: "volcengine.native-client", providerKey: "volcengine", displayName: "Volcengine Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reference-baseline" },
    RtcProviderExtensionCatalogEntry { extensionKey: "aliyun.native-client", providerKey: "aliyun", displayName: "Aliyun Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reference-baseline" },
    RtcProviderExtensionCatalogEntry { extensionKey: "tencent.native-client", providerKey: "tencent", displayName: "Tencent Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reference-baseline" },
    RtcProviderExtensionCatalogEntry { extensionKey: "agora.native-client", providerKey: "agora", displayName: "Agora Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved" },
    RtcProviderExtensionCatalogEntry { extensionKey: "zego.native-client", providerKey: "zego", displayName: "ZEGO Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved" },
    RtcProviderExtensionCatalogEntry { extensionKey: "livekit.native-client", providerKey: "livekit", displayName: "LiveKit Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved" },
    RtcProviderExtensionCatalogEntry { extensionKey: "twilio.native-client", providerKey: "twilio", displayName: "Twilio Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved" },
    RtcProviderExtensionCatalogEntry { extensionKey: "jitsi.native-client", providerKey: "jitsi", displayName: "Jitsi Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved" },
    RtcProviderExtensionCatalogEntry { extensionKey: "janus.native-client", providerKey: "janus", displayName: "Janus Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved" },
    RtcProviderExtensionCatalogEntry { extensionKey: "mediasoup.native-client", providerKey: "mediasoup", displayName: "mediasoup Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved" },
];

pub fn get_rtc_provider_extension_catalog() -> &'static [RtcProviderExtensionCatalogEntry] {
    &RTC_PROVIDER_EXTENSION_CATALOG
}

pub fn get_rtc_provider_extension_descriptor(
    extension_key: &str,
) -> Option<&'static RtcProviderExtensionCatalogEntry> {
    RTC_PROVIDER_EXTENSION_CATALOG
        .iter()
        .find(|entry| entry.extensionKey == extension_key)
}

pub fn get_rtc_provider_extensions_for_provider(
    provider_key: &str,
) -> Vec<RtcProviderExtensionCatalogEntry> {
    RTC_PROVIDER_EXTENSION_CATALOG
        .iter()
        .filter(|entry| entry.providerKey == provider_key)
        .copied()
        .collect()
}

pub fn get_rtc_provider_extensions(
    extension_keys: &[&str],
) -> Vec<RtcProviderExtensionCatalogEntry> {
    extension_keys
        .iter()
        .filter_map(|extension_key| get_rtc_provider_extension_descriptor(extension_key).copied())
        .collect()
}

pub fn has_rtc_provider_extension(extension_keys: &[&str], extension_key: &str) -> bool {
    extension_keys.iter().any(|value| *value == extension_key)
        && get_rtc_provider_extension_descriptor(extension_key).is_some()
}
