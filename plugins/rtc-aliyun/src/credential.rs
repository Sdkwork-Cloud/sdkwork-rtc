use sdkwork_communication_rtc_service::RtcContractError;
use sdkwork_utils_rust::{base64_encode, hex_decode, sha256_hash};
use serde_json::json;

use crate::config::AliyunRtcProviderConfig;

pub use sdkwork_communication_rtc_service::{format_unix_seconds_rfc3339, issued_at_unix_seconds};

pub fn generate_aliyun_rtc_token(
    config: &AliyunRtcProviderConfig,
    channel_id: &str,
    user_id: &str,
    issued_at: u32,
) -> Result<(String, u32), RtcContractError> {
    let app_id = required_config(config.app_id.as_deref(), "SDKWORK_RTC_ALIYUN_APP_ID")?;
    let app_key = required_config(config.app_key.as_deref(), "SDKWORK_RTC_ALIYUN_APP_KEY")?;
    let expire_at = issued_at.saturating_add(config.credential_ttl_seconds);
    let nonce = stable_nonce(app_id.as_str(), channel_id, user_id, issued_at);
    let timestamp = i64::from(issued_at);
    let token =
        sha256_hash(format!("{app_id}{app_key}{channel_id}{user_id}{nonce}{timestamp}").as_bytes());
    let payload = json!({
        "appid": app_id,
        "channelid": channel_id,
        "userid": user_id,
        "nonce": nonce,
        "timestamp": timestamp,
        "token": token,
    });
    let encoded = base64_encode(payload.to_string().as_bytes());
    Ok((encoded, expire_at))
}

fn required_config(value: Option<&str>, env_name: &str) -> Result<String, RtcContractError> {
    value
        .filter(|value| !sdkwork_utils_rust::is_blank(Some(value)))
        .map(str::to_string)
        .ok_or_else(|| {
            RtcContractError::Unavailable(format!(
                "aliyun participant credential requires {env_name} or provider profile credentials"
            ))
        })
}

fn stable_nonce(app_id: &str, channel_id: &str, user_id: &str, issued_at: u32) -> String {
    format!(
        "{:08x}",
        sha256_prefix(&format!("{app_id}:{channel_id}:{user_id}:{issued_at}"))
    )
}

fn sha256_prefix(value: &str) -> u32 {
    let digest = sha256_hash(value.as_bytes());
    let bytes = hex_decode(&digest[0..8]).unwrap_or_else(|| vec![0, 0, 0, 0]);
    u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
}
