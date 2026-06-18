#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AgoraRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
    pub app_id: Option<String>,
    pub app_certificate: Option<String>,
    pub credential_ttl_seconds: u32,
}

const DEFAULT_ACCESS_ENDPOINT: &str = "wss://rtc.agora.local/session";
const DEFAULT_REGION: &str = "global";

impl Default for AgoraRtcProviderConfig {
    fn default() -> Self {
        Self {
            access_endpoint: std::env::var("SDKWORK_RTC_AGORA_ACCESS_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_ACCESS_ENDPOINT.into()),
            region: std::env::var("SDKWORK_RTC_AGORA_REGION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_REGION.into()),
            app_id: non_empty_env("SDKWORK_RTC_AGORA_APP_ID"),
            app_certificate: non_empty_env("SDKWORK_RTC_AGORA_APP_CERTIFICATE"),
            credential_ttl_seconds: std::env::var("SDKWORK_RTC_AGORA_CREDENTIAL_TTL_SECONDS")
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
