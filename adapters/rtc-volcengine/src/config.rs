#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VolcengineRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
    pub api_endpoint: String,
    pub api_host: String,
    pub api_version: String,
    pub app_id: Option<String>,
    pub app_key: Option<String>,
    pub access_key_id: Option<String>,
    pub secret_access_key: Option<String>,
    pub credential_ttl_seconds: u32,
}

const DEFAULT_ACCESS_ENDPOINT: &str = "wss://rtc.volcengine.local/session";
const DEFAULT_API_ENDPOINT: &str = "https://rtc.volcengineapi.com";
const DEFAULT_API_HOST: &str = "rtc.volcengineapi.com";
const DEFAULT_API_VERSION: &str = "2023-11-01";
const DEFAULT_REGION: &str = "cn-beijing";

impl Default for VolcengineRtcProviderConfig {
    fn default() -> Self {
        Self {
            access_endpoint: std::env::var("SDKWORK_RTC_VOLCENGINE_ACCESS_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_ACCESS_ENDPOINT.into()),
            region: std::env::var("SDKWORK_RTC_VOLCENGINE_REGION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_REGION.into()),
            api_endpoint: std::env::var("SDKWORK_RTC_VOLCENGINE_API_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_API_ENDPOINT.into()),
            api_host: std::env::var("SDKWORK_RTC_VOLCENGINE_API_HOST")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_API_HOST.into()),
            api_version: std::env::var("SDKWORK_RTC_VOLCENGINE_API_VERSION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_API_VERSION.into()),
            app_id: non_empty_env("SDKWORK_RTC_VOLCENGINE_APP_ID"),
            app_key: non_empty_env("SDKWORK_RTC_VOLCENGINE_APP_KEY"),
            access_key_id: non_empty_env("SDKWORK_RTC_VOLCENGINE_ACCESS_KEY_ID"),
            secret_access_key: non_empty_env("SDKWORK_RTC_VOLCENGINE_SECRET_ACCESS_KEY"),
            credential_ttl_seconds: std::env::var("SDKWORK_RTC_VOLCENGINE_CREDENTIAL_TTL_SECONDS")
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
