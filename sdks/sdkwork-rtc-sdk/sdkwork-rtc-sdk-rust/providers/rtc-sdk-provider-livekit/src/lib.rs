/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct RtcProviderLivekitPackageContract;

impl RtcProviderLivekitPackageContract {
    pub const PROVIDER_KEY: &'static str = "livekit";
    pub const PLUGIN_ID: &'static str = "rtc-livekit";
    pub const DRIVER_ID: &'static str = "sdkwork-rtc-driver-livekit";
    pub const PACKAGE_IDENTITY: &'static str = "rtc-sdk-provider-livekit";
    pub const STATUS: &'static str = "future-runtime-bridge-only";
    pub const RUNTIME_BRIDGE_STATUS: &'static str = "reserved";
    pub const ROOT_PUBLIC: bool = false;
}
