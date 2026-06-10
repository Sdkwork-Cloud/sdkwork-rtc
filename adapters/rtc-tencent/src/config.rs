#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TencentRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
    pub api_endpoint: String,
    pub api_host: String,
    pub api_version: String,
    pub sdk_app_id: Option<String>,
    pub sdk_secret_key: Option<String>,
    pub secret_id: Option<String>,
    pub secret_key: Option<String>,
    pub credential_ttl_seconds: u32,
}

const DEFAULT_ACCESS_ENDPOINT: &str = "wss://rtc.tencent.local/session";
const DEFAULT_API_ENDPOINT: &str = "https://trtc.tencentcloudapi.com";
const DEFAULT_API_HOST: &str = "trtc.tencentcloudapi.com";
const DEFAULT_API_VERSION: &str = "2019-07-22";
const DEFAULT_REGION: &str = "ap-guangzhou";

impl Default for TencentRtcProviderConfig {
    fn default() -> Self {
        Self {
            access_endpoint: std::env::var("SDKWORK_RTC_TENCENT_ACCESS_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_ACCESS_ENDPOINT.into()),
            region: std::env::var("SDKWORK_RTC_TENCENT_REGION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_REGION.into()),
            api_endpoint: std::env::var("SDKWORK_RTC_TENCENT_API_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_API_ENDPOINT.into()),
            api_host: std::env::var("SDKWORK_RTC_TENCENT_API_HOST")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_API_HOST.into()),
            api_version: std::env::var("SDKWORK_RTC_TENCENT_API_VERSION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_API_VERSION.into()),
            sdk_app_id: non_empty_env("SDKWORK_RTC_TENCENT_SDK_APP_ID"),
            sdk_secret_key: non_empty_env("SDKWORK_RTC_TENCENT_SDK_SECRET_KEY"),
            secret_id: non_empty_env("SDKWORK_RTC_TENCENT_SECRET_ID"),
            secret_key: non_empty_env("SDKWORK_RTC_TENCENT_SECRET_KEY"),
            credential_ttl_seconds: std::env::var("SDKWORK_RTC_TENCENT_CREDENTIAL_TTL_SECONDS")
                .ok()
                .and_then(|value| value.parse::<u32>().ok())
                .filter(|value| *value > 0)
                .unwrap_or(3_600),
        }
    }
}

fn non_empty_env(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}
