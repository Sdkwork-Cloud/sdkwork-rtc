use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

use base64::Engine;
use hmac::{Hmac, Mac};
use sdkwork_communication_rtc_service::RtcContractError;
use sha2::Sha256;

use crate::config::AgoraRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

const VERSION: &str = "006";
const PRIV_JOIN_CHANNEL: u16 = 1;
const PRIV_PUBLISH_AUDIO: u16 = 2;
const PRIV_PUBLISH_VIDEO: u16 = 3;
const PRIV_PUBLISH_DATA: u16 = 4;

pub fn generate_agora_rtc_token(
    config: &AgoraRtcProviderConfig,
    channel_name: &str,
    uid: &str,
    issued_at: u32,
) -> Result<(String, u32), RtcContractError> {
    let app_id = required_config(config.app_id.as_deref(), "SDKWORK_RTC_AGORA_APP_ID")?;
    let app_certificate = required_config(
        config.app_certificate.as_deref(),
        "SDKWORK_RTC_AGORA_APP_CERTIFICATE",
    )?;
    let expire_at = issued_at.saturating_add(config.credential_ttl_seconds);
    let mut privileges = BTreeMap::new();
    privileges.insert(PRIV_JOIN_CHANNEL, expire_at);
    privileges.insert(PRIV_PUBLISH_AUDIO, expire_at);
    privileges.insert(PRIV_PUBLISH_VIDEO, expire_at);
    privileges.insert(PRIV_PUBLISH_DATA, expire_at);
    let salt = stable_salt(app_id.as_str(), channel_name, uid, issued_at);
    let message = pack_message(salt, expire_at, &privileges);
    let content = pack_content(app_id.as_str(), channel_name, uid, message.as_slice());
    let signature = hmac_sha256(app_certificate.as_bytes(), content.as_slice())?;
    let mut signed = content;
    signed.extend_from_slice(signature.as_slice());
    let encoded = base64::engine::general_purpose::STANDARD.encode(signed.as_slice());
    let padded_app_id = pad_app_id(app_id.as_str());
    Ok((format!("{VERSION}{padded_app_id}{encoded}"), expire_at))
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
                "agora participant credential requires {env_name} or provider profile credentials"
            ))
        })
}

fn stable_salt(app_id: &str, channel_name: &str, uid: &str, issued_at: u32) -> u32 {
    let seed = format!("{app_id}:{channel_name}:{uid}:{issued_at}");
    seed.bytes().fold(1_u32, |acc, byte| {
        acc.wrapping_mul(31).wrapping_add(u32::from(byte))
    }) % 99_999_999
        + 1
}

fn pack_message(salt: u32, expire_at: u32, privileges: &BTreeMap<u16, u32>) -> Vec<u8> {
    let mut message = Vec::new();
    message.extend_from_slice(&salt.to_le_bytes());
    message.extend_from_slice(&expire_at.to_le_bytes());
    message.extend_from_slice(&pack_map(privileges));
    message
}

fn pack_map(privileges: &BTreeMap<u16, u32>) -> Vec<u8> {
    let mut buffer = pack_uint16(
        privileges
            .len()
            .try_into()
            .expect("agora privilege map must fit in u16"),
    );
    for (key, value) in privileges {
        buffer.extend_from_slice(&pack_uint16(*key));
        buffer.extend_from_slice(&pack_uint32(*value));
    }
    buffer
}

fn pack_content(app_id: &str, channel_name: &str, uid: &str, message: &[u8]) -> Vec<u8> {
    let mut buffer = Vec::new();
    buffer.extend_from_slice(&pack_string(app_id));
    buffer.extend_from_slice(&pack_string(channel_name));
    buffer.extend_from_slice(&pack_string(uid));
    buffer.extend_from_slice(&pack_bytes(message));
    buffer
}

fn pack_string(value: &str) -> Vec<u8> {
    let mut buffer = pack_uint16(
        value
            .len()
            .try_into()
            .expect("agora token string must fit in u16"),
    );
    buffer.extend_from_slice(value.as_bytes());
    buffer
}

fn pack_bytes(value: &[u8]) -> Vec<u8> {
    let mut buffer = pack_uint16(
        value
            .len()
            .try_into()
            .expect("agora token bytes must fit in u16"),
    );
    buffer.extend_from_slice(value);
    buffer
}

fn pack_uint16(value: u16) -> Vec<u8> {
    value.to_le_bytes().to_vec()
}

fn pack_uint32(value: u32) -> Vec<u8> {
    value.to_le_bytes().to_vec()
}

fn hmac_sha256(key: &[u8], payload: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut mac = HmacSha256::new_from_slice(key).map_err(|error| {
        RtcContractError::Unavailable(format!("agora token hmac key is invalid: {error}"))
    })?;
    mac.update(payload);
    Ok(mac.finalize().into_bytes().to_vec())
}

fn pad_app_id(app_id: &str) -> String {
    if app_id.len() >= 32 {
        app_id.chars().take(32).collect()
    } else {
        format!("{app_id:<32}")
    }
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
