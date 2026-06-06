/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct RtcProviderZegoPackageContract;

impl RtcProviderZegoPackageContract {
    pub const PROVIDER_KEY: &'static str = "zego";
    pub const PLUGIN_ID: &'static str = "rtc-zego";
    pub const DRIVER_ID: &'static str = "sdkwork-rtc-driver-zego";
    pub const PACKAGE_IDENTITY: &'static str = "rtc-sdk-provider-zego";
    pub const STATUS: &'static str = "future-runtime-bridge-only";
    pub const RUNTIME_BRIDGE_STATUS: &'static str = "reserved";
    pub const ROOT_PUBLIC: bool = false;
}
