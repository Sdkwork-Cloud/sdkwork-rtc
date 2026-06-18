use std::time::{SystemTime, UNIX_EPOCH};

use base64::Engine;
use hmac::{Hmac, Mac};
use sdkwork_communication_rtc_service::RtcContractError;
use serde_json::json;
use sha2::Sha256;

use crate::config::LivekitRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

pub fn generate_livekit_rtc_token(
    config: &LivekitRtcProviderConfig,
    room_name: &str,
    participant_identity: &str,
    issued_at: u32,
) -> Result<(String, u32), RtcContractError> {
    let api_key = required_config(config.api_key.as_deref(), "SDKWORK_RTC_LIVEKIT_API_KEY")?;
    let api_secret = required_config(
        config.api_secret.as_deref(),
        "SDKWORK_RTC_LIVEKIT_API_SECRET",
    )?;
    let expire_at = issued_at.saturating_add(config.credential_ttl_seconds);
    let header = base64_url_encode(
        json!({
            "alg": "HS256",
            "typ": "JWT",
        })
        .to_string()
        .as_bytes(),
    );
    let payload = base64_url_encode(
        json!({
            "iss": api_key,
            "sub": participant_identity,
            "iat": issued_at,
            "nbf": issued_at,
            "exp": expire_at,
            "video": {
                "roomJoin": true,
                "room": room_name,
                "canPublish": true,
                "canSubscribe": true,
            }
        })
        .to_string()
        .as_bytes(),
    );
    let signing_input = format!("{header}.{payload}");
    let signature =
        base64_url_encode(hmac_sha256(api_secret.as_bytes(), signing_input.as_bytes())?.as_slice());
    Ok((format!("{signing_input}.{signature}"), expire_at))
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
                "livekit participant credential requires {env_name} or provider profile credentials"
            ))
        })
}

fn base64_url_encode(bytes: &[u8]) -> String {
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

fn hmac_sha256(key: &[u8], payload: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut mac = HmacSha256::new_from_slice(key).map_err(|error| {
        RtcContractError::Unavailable(format!("livekit token hmac key is invalid: {error}"))
    })?;
    mac.update(payload);
    Ok(mac.finalize().into_bytes().to_vec())
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
