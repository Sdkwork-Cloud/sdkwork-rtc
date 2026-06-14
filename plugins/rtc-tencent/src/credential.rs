use std::io::Write;
use std::time::{SystemTime, UNIX_EPOCH};

use base64::Engine;
use flate2::Compression;
use flate2::write::ZlibEncoder;
use hmac::{Hmac, Mac};
use sdkwork_communication_rtc_service::RtcContractError;
use serde_json::json;
use sha2::Sha256;

use crate::TencentRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

pub fn generate_tencent_user_sig(
    config: &TencentRtcProviderConfig,
    user_id: &str,
    issued_at: u64,
) -> Result<(String, u64), RtcContractError> {
    let sdk_app_id = required_config(
        config.sdk_app_id.as_deref(),
        "SDKWORK_RTC_TENCENT_SDK_APP_ID",
    )?;
    let sdk_secret_key = required_config(
        config.sdk_secret_key.as_deref(),
        "SDKWORK_RTC_TENCENT_SDK_SECRET_KEY",
    )?;
    let expire_seconds = u64::from(config.credential_ttl_seconds);
    let content_to_sign = format!(
        "TLS.identifier:{user_id}\nTLS.sdkappid:{sdk_app_id}\nTLS.time:{issued_at}\nTLS.expire:{expire_seconds}\n"
    );
    let signature = base64::engine::general_purpose::STANDARD.encode(hmac_sha256(
        sdk_secret_key.as_bytes(),
        content_to_sign.as_bytes(),
    )?);
    let sig_doc = json!({
        "TLS.ver": "2.0",
        "TLS.identifier": user_id,
        "TLS.sdkappid": sdk_app_id.parse::<u64>().unwrap_or_default(),
        "TLS.expire": expire_seconds,
        "TLS.time": issued_at,
        "TLS.sig": signature,
    });
    let compressed = zlib_compress(sig_doc.to_string().as_bytes())?;
    let encoded = base64::engine::general_purpose::STANDARD.encode(compressed);
    Ok((
        url_safe_base64(encoded.as_str()),
        issued_at + expire_seconds,
    ))
}

pub fn issued_at_unix_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock is before UNIX epoch")
        .as_secs()
}

pub fn format_unix_seconds_rfc3339(seconds: u64) -> String {
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
                "tencent participant credential requires {env_name} or provider profile credentials"
            ))
        })
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut mac = HmacSha256::new_from_slice(key)
        .map_err(|_| RtcContractError::Conflict("invalid tencent sdk secret key".into()))?;
    mac.update(data);
    Ok(mac.finalize().into_bytes().to_vec())
}

fn zlib_compress(bytes: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(bytes).map_err(|error| {
        RtcContractError::Conflict(format!("failed to compress tencent usersig: {error}"))
    })?;
    encoder.finish().map_err(|error| {
        RtcContractError::Conflict(format!(
            "failed to finish tencent usersig compression: {error}"
        ))
    })
}

fn url_safe_base64(value: &str) -> String {
    value.replace('+', "*").replace('/', "-").replace('=', "_")
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
