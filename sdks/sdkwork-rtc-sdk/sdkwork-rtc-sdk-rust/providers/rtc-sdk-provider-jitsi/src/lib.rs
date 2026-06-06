/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct RtcProviderJitsiPackageContract;

impl RtcProviderJitsiPackageContract {
    pub const PROVIDER_KEY: &'static str = "jitsi";
    pub const PLUGIN_ID: &'static str = "rtc-jitsi";
    pub const DRIVER_ID: &'static str = "sdkwork-rtc-driver-jitsi";
    pub const PACKAGE_IDENTITY: &'static str = "rtc-sdk-provider-jitsi";
    pub const STATUS: &'static str = "future-runtime-bridge-only";
    pub const RUNTIME_BRIDGE_STATUS: &'static str = "reserved";
    pub const ROOT_PUBLIC: bool = false;
}
