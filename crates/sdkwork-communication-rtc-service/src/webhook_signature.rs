use crate::RtcContractError;
use sdkwork_utils_rust::{base64_decode, hex_decode, hmac_sha256, secure_compare};

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

    let expected_hex = hmac_sha256(payload.as_bytes(), secret.as_bytes());

    if signature_matches_digest(signature, expected_hex.as_str()) {
        return Ok(());
    }

    Err(RtcContractError::Conflict(
        "RTC provider webhook signature verification failed".to_string(),
    ))
}

fn signature_matches_digest(signature: &str, expected_hex: &str) -> bool {
    let normalized = signature
        .strip_prefix("sha256=")
        .or_else(|| signature.strip_prefix("SHA256="))
        .unwrap_or(signature)
        .trim();

    if secure_compare(normalized, expected_hex) {
        return true;
    }

    let expected = match hex_decode(expected_hex) {
        Some(bytes) => bytes,
        None => return false,
    };

    if let Some(provided) = hex_decode(normalized) {
        return constant_time_eq(provided.as_slice(), expected.as_slice());
    }

    if let Some(provided) = base64_decode(normalized) {
        return constant_time_eq(provided.as_slice(), expected.as_slice());
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
    hmac_sha256(payload.as_bytes(), secret.as_bytes())
}
