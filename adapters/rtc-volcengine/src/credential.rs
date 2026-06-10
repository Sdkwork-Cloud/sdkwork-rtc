use std::time::{SystemTime, UNIX_EPOCH};

use base64::Engine;
use hmac::{Hmac, Mac};
use sdkwork_rtc_core::RtcContractError;
use sha2::Sha256;

use crate::VolcengineRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

const TOKEN_VERSION: &str = "001";
const PRIV_PUBLISH_STREAM: u16 = 0;
const PRIV_PUBLISH_AUDIO_STREAM: u16 = 1;
const PRIV_PUBLISH_VIDEO_STREAM: u16 = 2;
const PRIV_PUBLISH_DATA_STREAM: u16 = 3;
const PRIV_SUBSCRIBE_STREAM: u16 = 4;

pub fn generate_volcengine_rtc_token(
    config: &VolcengineRtcProviderConfig,
    room_id: &str,
    user_id: &str,
    issued_at: u32,
) -> Result<(String, u32), RtcContractError> {
    let app_id = required_config(config.app_id.as_deref(), "SDKWORK_RTC_VOLCENGINE_APP_ID")?;
    let app_key = required_config(config.app_key.as_deref(), "SDKWORK_RTC_VOLCENGINE_APP_KEY")?;
    let expire_at = issued_at.saturating_add(config.credential_ttl_seconds);
    let nonce = stable_nonce(app_id.as_str(), room_id, user_id, issued_at);
    let message = VolcengineTokenBuffer::new()
        .put_u32(nonce)
        .put_u32(issued_at)
        .put_u32(expire_at)
        .put_string(room_id)?
        .put_string(user_id)?
        .put_privileges(expire_at)?
        .pack();
    let signature = hmac_sha256(app_key.as_bytes(), message.as_slice())?;
    let content = VolcengineTokenBuffer::new()
        .put_bytes(message.as_slice())?
        .put_bytes(signature.as_slice())?
        .pack();
    let encoded = base64::engine::general_purpose::STANDARD.encode(content);
    Ok((format!("{TOKEN_VERSION}{app_id}{encoded}"), expire_at))
}

pub fn issued_at_unix_seconds() -> u32 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
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
                "volcengine participant credential requires {env_name} or provider profile credentials"
            ))
        })
}

fn stable_nonce(app_id: &str, room_id: &str, user_id: &str, issued_at: u32) -> u32 {
    let mut hash = 0x811c_9dc5_u32;
    for byte in format!("{app_id}:{room_id}:{user_id}:{issued_at}").bytes() {
        hash ^= u32::from(byte);
        hash = hash.wrapping_mul(16_777_619);
    }
    hash
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut mac = HmacSha256::new_from_slice(key)
        .map_err(|_| RtcContractError::Conflict("invalid volcengine rtc app key".into()))?;
    mac.update(data);
    Ok(mac.finalize().into_bytes().to_vec())
}

struct VolcengineTokenBuffer {
    buffer: Vec<u8>,
}

impl VolcengineTokenBuffer {
    fn new() -> Self {
        Self { buffer: Vec::new() }
    }

    fn put_u16(mut self, value: u16) -> Self {
        self.buffer.extend(value.to_le_bytes());
        self
    }

    fn put_u32(mut self, value: u32) -> Self {
        self.buffer.extend(value.to_le_bytes());
        self
    }

    fn put_bytes(mut self, bytes: &[u8]) -> Result<Self, RtcContractError> {
        let len = bytes.len().try_into().map_err(|_| {
            RtcContractError::Conflict("volcengine token payload is too large".into())
        })?;
        self.buffer.extend(u16::to_le_bytes(len));
        self.buffer.extend(bytes);
        Ok(self)
    }

    fn put_string(self, value: &str) -> Result<Self, RtcContractError> {
        self.put_bytes(value.as_bytes())
    }

    fn put_privileges(mut self, expire_at: u32) -> Result<Self, RtcContractError> {
        let privileges = [
            (PRIV_PUBLISH_STREAM, expire_at),
            (PRIV_PUBLISH_AUDIO_STREAM, expire_at),
            (PRIV_PUBLISH_VIDEO_STREAM, expire_at),
            (PRIV_PUBLISH_DATA_STREAM, expire_at),
            (PRIV_SUBSCRIBE_STREAM, expire_at),
        ];
        let len = privileges.len().try_into().map_err(|_| {
            RtcContractError::Conflict("volcengine token has too many privileges".into())
        })?;
        self = self.put_u16(len);
        for (privilege, privilege_expire_at) in privileges {
            self = self.put_u16(privilege).put_u32(privilege_expire_at);
        }
        Ok(self)
    }

    fn pack(self) -> Vec<u8> {
        self.buffer
    }
}

fn civil_from_days(days: i128) -> (i128, i128, i128) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let year = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = mp + if mp < 10 { 3 } else { -9 };
    let year = year + i128::from(month <= 2);
    (year, month, day)
}
