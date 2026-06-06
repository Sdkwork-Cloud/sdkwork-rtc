/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
pub struct RtcProviderMediasoupPackageContract;

impl RtcProviderMediasoupPackageContract {
    pub const PROVIDER_KEY: &'static str = "mediasoup";
    pub const PLUGIN_ID: &'static str = "rtc-mediasoup";
    pub const DRIVER_ID: &'static str = "sdkwork-rtc-driver-mediasoup";
    pub const PACKAGE_IDENTITY: &'static str = "rtc-sdk-provider-mediasoup";
    pub const STATUS: &'static str = "future-runtime-bridge-only";
    pub const RUNTIME_BRIDGE_STATUS: &'static str = "reserved";
    pub const ROOT_PUBLIC: bool = false;
}
