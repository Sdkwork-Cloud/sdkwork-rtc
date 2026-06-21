use hmac::{Hmac, Mac};
use sdkwork_communication_rtc_service::RtcContractError;
use sdkwork_utils_rust::base64url_encode;
use serde_json::json;
use sha2::Sha256;

use crate::config::LivekitRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

pub use sdkwork_communication_rtc_service::{format_unix_seconds_rfc3339, issued_at_unix_seconds};

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
    let header = base64url_encode(
        json!({
            "alg": "HS256",
            "typ": "JWT",
        })
        .to_string()
        .as_bytes(),
    );
    let payload = base64url_encode(
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
        base64url_encode(hmac_sha256(api_secret.as_bytes(), signing_input.as_bytes())?.as_slice());
    Ok((format!("{signing_input}.{signature}"), expire_at))
}

fn required_config(value: Option<&str>, env_name: &str) -> Result<String, RtcContractError> {
    value
        .filter(|value| !sdkwork_utils_rust::is_blank(Some(value)))
        .map(str::to_string)
        .ok_or_else(|| {
            RtcContractError::Unavailable(format!(
                "livekit participant credential requires {env_name} or provider profile credentials"
            ))
        })
}

fn hmac_sha256(key: &[u8], payload: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut mac = HmacSha256::new_from_slice(key).map_err(|error| {
        RtcContractError::Unavailable(format!("livekit token hmac key is invalid: {error}"))
    })?;
    mac.update(payload);
    Ok(mac.finalize().into_bytes().to_vec())
}
