use crate::RtcContractError;
use sdkwork_utils_rust::{base64_decode, hex_decode, hmac_sha256, secure_compare};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcProviderWebhookVerifyRequest {
    pub headers: Vec<(String, String)>,
    pub raw_payload: String,
    pub signature_header: Option<String>,
    pub webhook_secret: String,
}

pub fn verify_provider_webhook_signature_hmac(
    request: RtcProviderWebhookVerifyRequest,
) -> Result<(), RtcContractError> {
    let signature = required_signature_header(&request)?;
    verify_hmac_sha256_payload(
        request.webhook_secret.as_str(),
        request.raw_payload.as_str(),
        signature.as_str(),
    )
}

pub fn verify_livekit_webhook_signature(
    request: RtcProviderWebhookVerifyRequest,
) -> Result<(), RtcContractError> {
    let signature = required_signature_header(&request)?;
    let normalized = strip_bearer_prefix(signature.as_str());
    verify_hmac_sha256_payload(
        request.webhook_secret.as_str(),
        request.raw_payload.as_str(),
        normalized,
    )
}

pub fn required_signature_header(
    request: &RtcProviderWebhookVerifyRequest,
) -> Result<String, RtcContractError> {
    request
        .signature_header
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .ok_or_else(|| {
            RtcContractError::Conflict(
                "RTC provider webhook signature header is missing".to_string(),
            )
        })
}

pub fn strip_bearer_prefix(signature: &str) -> &str {
    signature
        .strip_prefix("Bearer ")
        .or_else(|| signature.strip_prefix("bearer "))
        .unwrap_or(signature)
        .trim()
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

const MAX_PROVIDER_WEBHOOK_AGE_MS: i64 = 10 * 60 * 1_000;
const MAX_PROVIDER_WEBHOOK_CLOCK_SKEW_MS: i64 = 60 * 1_000;

use crate::runtime_environment::rtc_requires_provider_webhook_timestamp;

pub fn validate_provider_webhook_freshness(
    occurred_at: Option<&str>,
) -> Result<(), RtcContractError> {
    let Some(occurred_at) = occurred_at.map(str::trim).filter(|value| !value.is_empty()) else {
        if rtc_requires_provider_webhook_timestamp() {
            return Err(RtcContractError::Conflict(
                "RTC provider webhook timestamp is required".to_string(),
            ));
        }
        return Ok(());
    };
    let occurred = sdkwork_utils_rust::parse_datetime(occurred_at, None).ok_or_else(|| {
        RtcContractError::Conflict("RTC provider webhook timestamp is invalid".to_string())
    })?;
    let age_ms = sdkwork_utils_rust::diff_millis(occurred, sdkwork_utils_rust::now());
    if age_ms > MAX_PROVIDER_WEBHOOK_AGE_MS || age_ms < -MAX_PROVIDER_WEBHOOK_CLOCK_SKEW_MS {
        return Err(RtcContractError::Conflict(
            "RTC provider webhook timestamp is outside the allowed replay window".to_string(),
        ));
    }
    Ok(())
}
