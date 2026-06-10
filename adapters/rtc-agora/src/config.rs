#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AgoraRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
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
        }
    }
}
