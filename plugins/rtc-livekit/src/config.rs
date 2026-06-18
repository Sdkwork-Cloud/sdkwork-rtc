#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LivekitRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
    pub api_endpoint: String,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub credential_ttl_seconds: u32,
}

const DEFAULT_ACCESS_ENDPOINT: &str = "wss://rtc.livekit.local/session";
const DEFAULT_API_ENDPOINT: &str = "https://livekit.local";
const DEFAULT_REGION: &str = "self-hosted";

impl Default for LivekitRtcProviderConfig {
    fn default() -> Self {
        Self {
            access_endpoint: std::env::var("SDKWORK_RTC_LIVEKIT_ACCESS_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_ACCESS_ENDPOINT.into()),
            region: std::env::var("SDKWORK_RTC_LIVEKIT_REGION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_REGION.into()),
            api_endpoint: std::env::var("SDKWORK_RTC_LIVEKIT_API_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_API_ENDPOINT.into()),
            api_key: non_empty_env("SDKWORK_RTC_LIVEKIT_API_KEY"),
            api_secret: non_empty_env("SDKWORK_RTC_LIVEKIT_API_SECRET"),
            credential_ttl_seconds: std::env::var("SDKWORK_RTC_LIVEKIT_CREDENTIAL_TTL_SECONDS")
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
