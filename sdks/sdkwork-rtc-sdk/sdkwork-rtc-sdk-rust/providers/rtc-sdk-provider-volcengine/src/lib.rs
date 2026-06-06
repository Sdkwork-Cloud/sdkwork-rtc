/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct RtcProviderVolcenginePackageContract;

impl RtcProviderVolcenginePackageContract {
    pub const PROVIDER_KEY: &'static str = "volcengine";
    pub const PLUGIN_ID: &'static str = "rtc-volcengine";
    pub const DRIVER_ID: &'static str = "sdkwork-rtc-driver-volcengine";
    pub const PACKAGE_IDENTITY: &'static str = "rtc-sdk-provider-volcengine";
    pub const STATUS: &'static str = "future-runtime-bridge-only";
    pub const RUNTIME_BRIDGE_STATUS: &'static str = "reserved";
    pub const ROOT_PUBLIC: bool = false;
}
