use std::io::Write;

use flate2::Compression;
use flate2::write::ZlibEncoder;
use hmac::{Hmac, Mac};
use sdkwork_communication_rtc_service::RtcContractError;
use sdkwork_utils_rust::base64_encode;
use serde_json::json;
use sha2::Sha256;

use crate::TencentRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

pub use sdkwork_communication_rtc_service::{
    format_unix_seconds_rfc3339_u64 as format_unix_seconds_rfc3339,
    issued_at_unix_seconds_u64 as issued_at_unix_seconds,
};

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
    let signature = base64_encode(
        hmac_sha256(sdk_secret_key.as_bytes(), content_to_sign.as_bytes())?.as_slice(),
    );
    let sig_doc = json!({
        "TLS.ver": "2.0",
        "TLS.identifier": user_id,
        "TLS.sdkappid": sdk_app_id.parse::<u64>().unwrap_or_default(),
        "TLS.expire": expire_seconds,
        "TLS.time": issued_at,
        "TLS.sig": signature,
    });
    let compressed = zlib_compress(sig_doc.to_string().as_bytes())?;
    let encoded = base64_encode(compressed.as_slice());
    Ok((
        url_safe_base64(encoded.as_str()),
        issued_at + expire_seconds,
    ))
}

fn required_config(value: Option<&str>, env_name: &str) -> Result<String, RtcContractError> {
    value
        .filter(|value| !sdkwork_utils_rust::is_blank(Some(value)))
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
