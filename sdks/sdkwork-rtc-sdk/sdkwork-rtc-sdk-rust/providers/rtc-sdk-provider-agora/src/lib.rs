/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct RtcProviderAgoraPackageContract;

impl RtcProviderAgoraPackageContract {
    pub const PROVIDER_KEY: &'static str = "agora";
    pub const PLUGIN_ID: &'static str = "rtc-agora";
    pub const DRIVER_ID: &'static str = "sdkwork-rtc-driver-agora";
    pub const PACKAGE_IDENTITY: &'static str = "rtc-sdk-provider-agora";
    pub const STATUS: &'static str = "future-runtime-bridge-only";
    pub const RUNTIME_BRIDGE_STATUS: &'static str = "reserved";
    pub const ROOT_PUBLIC: bool = false;
}
