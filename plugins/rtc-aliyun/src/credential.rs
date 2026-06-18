use std::time::{SystemTime, UNIX_EPOCH};

use base64::Engine;
use sdkwork_communication_rtc_service::RtcContractError;
use serde_json::json;
use sha2::{Digest, Sha256};

use crate::config::AliyunRtcProviderConfig;

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
    let token = sha256_hex(&format!(
        "{app_id}{app_key}{channel_id}{user_id}{nonce}{timestamp}"
    ));
    let payload = json!({
        "appid": app_id,
        "channelid": channel_id,
        "userid": user_id,
        "nonce": nonce,
        "timestamp": timestamp,
        "token": token,
    });
    let encoded = base64::engine::general_purpose::STANDARD.encode(payload.to_string());
    Ok((encoded, expire_at))
}

pub fn issued_at_unix_seconds() -> u32 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock is before UNIX epoch")
        .as_secs()
        .try_into()
        .unwrap_or(u32::MAX)
}

pub fn format_unix_seconds_rfc3339(seconds: u32) -> String {
    let seconds = i128::from(seconds);
    let days = seconds.div_euclid(86_400);
    let seconds_of_day = seconds.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.000Z")
}

fn required_config(value: Option<&str>, env_name: &str) -> Result<String, RtcContractError> {
    value
        .filter(|value| !value.trim().is_empty())
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
    let digest = Sha256::digest(value.as_bytes());
    u32::from_be_bytes([digest[0], digest[1], digest[2], digest[3]])
}

fn sha256_hex(value: &str) -> String {
    let digest = Sha256::digest(value.as_bytes());
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn civil_from_days(days: i128) -> (i32, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u32;
    let yoe = (doe - doe / 1_460 + doe / 365 - doe / 1_460) / 365;
    let y = yoe as i32 + era as i32 * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if mp >= 10 { y + 1 } else { y };
    (year, month, day)
}
