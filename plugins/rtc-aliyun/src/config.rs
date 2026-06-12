#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AliyunRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
}

const DEFAULT_ACCESS_ENDPOINT: &str = "wss://rtc.aliyun.local/session";
const DEFAULT_REGION: &str = "cn-shanghai";

impl Default for AliyunRtcProviderConfig {
    fn default() -> Self {
        Self {
            access_endpoint: std::env::var("SDKWORK_RTC_ALIYUN_ACCESS_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_ACCESS_ENDPOINT.into()),
            region: std::env::var("SDKWORK_RTC_ALIYUN_REGION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_REGION.into()),
        }
    }
}
