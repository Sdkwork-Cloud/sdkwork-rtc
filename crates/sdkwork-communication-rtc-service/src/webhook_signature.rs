use crate::RtcContractError;
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcProviderWebhookVerifyRequest {
    pub headers: Vec<(String, String)>,
    pub raw_payload: String,
    pub signature_header: Option<String>,
    pub webhook_secret: String,
}

pub fn verify_hmac_sha256_payload(
    secret: &str,
    payload: &str,
    signature: &str,
) -> Result<(), RtcContractError> {
    let signature = signature.trim();
    if signature.is_empty() {
        return Err(RtcContractError::Conflict(
            "RTC provider webhook signature is missing".to_string(),
        ));
    }

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).map_err(|error| {
        RtcContractError::Conflict(format!("invalid RTC webhook signing secret: {error}"))
    })?;
    mac.update(payload.as_bytes());
    let expected = mac.finalize().into_bytes();

    if signature_matches_digest(signature, expected.as_slice()) {
        return Ok(());
    }

    Err(RtcContractError::Conflict(
        "RTC provider webhook signature verification failed".to_string(),
    ))
}

fn signature_matches_digest(signature: &str, digest: &[u8]) -> bool {
    let normalized = signature
        .strip_prefix("sha256=")
        .or_else(|| signature.strip_prefix("SHA256="))
        .unwrap_or(signature)
        .trim();

    if let Ok(provided) = hex::decode(normalized) {
        return constant_time_eq(provided.as_slice(), digest);
    }

    if let Ok(provided) =
        base64::Engine::decode(&base64::engine::general_purpose::STANDARD, normalized)
    {
        return constant_time_eq(provided.as_slice(), digest);
    }

    false
}

fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    if left.len() != right.len() {
        return false;
    }

    let mut diff = 0u8;
    for (left_byte, right_byte) in left.iter().zip(right.iter()) {
        diff |= left_byte ^ right_byte;
    }
    diff == 0
}

pub fn sign_hmac_sha256_payload_hex(secret: &str, payload: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .expect("valid RTC webhook signing secret length");
    mac.update(payload.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}
