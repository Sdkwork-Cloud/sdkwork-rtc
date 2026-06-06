/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct RtcProviderAliyunPackageContract;

impl RtcProviderAliyunPackageContract {
    pub const PROVIDER_KEY: &'static str = "aliyun";
    pub const PLUGIN_ID: &'static str = "rtc-aliyun";
    pub const DRIVER_ID: &'static str = "sdkwork-rtc-driver-aliyun";
    pub const PACKAGE_IDENTITY: &'static str = "rtc-sdk-provider-aliyun";
    pub const STATUS: &'static str = "future-runtime-bridge-only";
    pub const RUNTIME_BRIDGE_STATUS: &'static str = "reserved";
    pub const ROOT_PUBLIC: bool = false;
}
