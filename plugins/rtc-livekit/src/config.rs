#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LivekitRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
}

const DEFAULT_ACCESS_ENDPOINT: &str = "wss://rtc.livekit.local/session";
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
        }
    }
}
