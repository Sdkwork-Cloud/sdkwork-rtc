use hmac::{Hmac, Mac};
use sdkwork_communication_rtc_service::{
    RtcContractError, RtcProviderQueryKind, RtcProviderQueryRequest,
};
use serde_json::{Map, Number, Value as JsonValue, json};
use sha2::{Digest, Sha256};

use crate::TencentRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TencentRtcOpenApiRequest {
    pub method: String,
    pub endpoint: String,
    pub host: String,
    pub path: String,
    pub action: String,
    pub headers: Vec<(String, String)>,
    pub body: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TencentRtcOpenApiResponse {
    pub status_code: u16,
    pub body: String,
}

pub trait TencentRtcOpenApiExecutor: Send + Sync {
    fn execute(
        &self,
        request: &TencentRtcOpenApiRequest,
    ) -> Result<TencentRtcOpenApiResponse, RtcContractError>;
}

pub fn tencent_action(query_kind: RtcProviderQueryKind) -> &'static str {
    match query_kind {
        RtcProviderQueryKind::RoomOnlineUsers
        | RtcProviderQueryKind::RoomState
        | RtcProviderQueryKind::MediaSessionState => "DescribeRoomInfo",
        RtcProviderQueryKind::RecordingArtifacts => "DescribeCloudRecording",
        RtcProviderQueryKind::QualitySamples => "DescribeTRTCRealTimeQualityData",
    }
}

pub fn build_signed_tencent_request(
    config: &TencentRtcProviderConfig,
    request: &RtcProviderQueryRequest,
    action: &str,
    signed_at: &str,
) -> Result<TencentRtcOpenApiRequest, RtcContractError> {
    let secret_id = required_config(config.secret_id.as_deref(), "SDKWORK_RTC_TENCENT_SECRET_ID")?;
    let secret_key = required_config(
        config.secret_key.as_deref(),
        "SDKWORK_RTC_TENCENT_SECRET_KEY",
    )?;
    let body = request_body(config, request, action)?;
    let (date, timestamp) = tencent_signing_time(signed_at);
    let canonical_headers = format!("content-type:application/json\nhost:{}\n", config.api_host);
    let signed_headers = "content-type;host";
    let canonical_request = format!(
        "POST\n/\n\n{}\n{}\n{}",
        canonical_headers,
        signed_headers,
        sha256_hex(body.as_bytes())
    );
    let credential_scope = format!("{date}/trtc/tc3_request");
    let string_to_sign = format!(
        "TC3-HMAC-SHA256\n{}\n{}\n{}",
        timestamp,
        credential_scope,
        sha256_hex(canonical_request.as_bytes())
    );
    let secret_date = hmac_sha256(format!("TC3{secret_key}").as_bytes(), date.as_bytes())?;
    let secret_service = hmac_sha256(secret_date.as_slice(), b"trtc")?;
    let secret_signing = hmac_sha256(secret_service.as_slice(), b"tc3_request")?;
    let signature_bytes = hmac_sha256(secret_signing.as_slice(), string_to_sign.as_bytes())?;
    let signature = hex_lower(signature_bytes.as_slice());
    let authorization = format!(
        "TC3-HMAC-SHA256 Credential={}/{}, SignedHeaders={}, Signature={}",
        secret_id, credential_scope, signed_headers, signature
    );

    Ok(TencentRtcOpenApiRequest {
        method: "POST".into(),
        endpoint: config.api_endpoint.clone(),
        host: config.api_host.clone(),
        path: "/".into(),
        action: action.into(),
        headers: vec![
            ("Content-Type".into(), "application/json".into()),
            ("Host".into(), config.api_host.clone()),
            ("X-TC-Action".into(), action.into()),
            ("X-TC-Version".into(), config.api_version.clone()),
            ("X-TC-Region".into(), config.region.clone()),
            ("X-TC-Timestamp".into(), timestamp),
            ("Authorization".into(), authorization),
        ],
        body,
    })
}

pub fn request_snapshot(
    request: &TencentRtcOpenApiRequest,
    response: Option<&TencentRtcOpenApiResponse>,
    normalized: Option<JsonValue>,
) -> String {
    let provider_request = json!({
        "method": request.method,
        "endpoint": request.endpoint,
        "host": request.host,
        "path": request.path,
        "action": request.action,
        "headers": request.headers.iter().map(|(key, _)| key).collect::<Vec<_>>(),
        "body": request.body,
    });
    let provider_response = response.map(|response| {
        json!({
            "statusCode": response.status_code,
            "body": response.body,
        })
    });
    let mut snapshot = Map::new();
    snapshot.insert("provider".into(), json!("tencent"));
    snapshot.insert("providerRequest".into(), provider_request);
    snapshot.insert("providerResponse".into(), json!(provider_response));
    if let Some(normalized) = normalized {
        snapshot.insert("sdkworkNormalized".into(), normalized);
    }
    JsonValue::Object(snapshot).to_string()
}

fn request_body(
    config: &TencentRtcProviderConfig,
    request: &RtcProviderQueryRequest,
    action: &str,
) -> Result<String, RtcContractError> {
    let mut body = Map::new();
    if let Some(sdk_app_id) = config
        .sdk_app_id
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        body.insert("SdkAppId".into(), parse_sdk_app_id(sdk_app_id)?);
    }
    if let Some(room_id) = request.room_id.as_deref().filter(|value| !value.is_empty()) {
        body.insert("RoomId".into(), JsonValue::String(room_id.into()));
    }
    if let Some(cursor) = request.cursor.as_deref().filter(|value| !value.is_empty()) {
        let cursor_key = if action == "DescribeTRTCRealTimeQualityData" {
            "Next"
        } else {
            "PageNumber"
        };
        body.insert(cursor_key.into(), JsonValue::String(cursor.into()));
    }
    serde_json::to_string(&JsonValue::Object(body)).map_err(|error| {
        RtcContractError::Conflict(format!("failed to encode tencent rtc query body: {error}"))
    })
}

fn parse_sdk_app_id(value: &str) -> Result<JsonValue, RtcContractError> {
    let parsed = value.parse::<u64>().map_err(|error| {
        RtcContractError::Conflict(format!("invalid tencent SDKAppId {value}: {error}"))
    })?;
    Ok(JsonValue::Number(Number::from(parsed)))
}

fn required_config(value: Option<&str>, env_name: &str) -> Result<String, RtcContractError> {
    value
        .filter(|value| !value.trim().is_empty())
        .map(str::to_string)
        .ok_or_else(|| {
            RtcContractError::Unavailable(format!(
                "tencent active query requires {env_name} or provider profile credentials"
            ))
        })
}

fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    hex_lower(digest.as_slice())
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut mac = HmacSha256::new_from_slice(key)
        .map_err(|_| RtcContractError::Conflict("invalid tencent signing key".into()))?;
    mac.update(data);
    Ok(mac.finalize().into_bytes().to_vec())
}

fn hex_lower(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn tencent_signing_time(rfc3339_millis: &str) -> (String, String) {
    if rfc3339_millis.len() >= 19 {
        let date = rfc3339_millis[0..10].to_string();
        let timestamp = rfc3339_to_unix_seconds(rfc3339_millis).unwrap_or(0);
        return (date, timestamp.to_string());
    }
    ("1970-01-01".into(), "0".into())
}

fn rfc3339_to_unix_seconds(value: &str) -> Option<i64> {
    let year = value.get(0..4)?.parse::<i64>().ok()?;
    let month = value.get(5..7)?.parse::<i64>().ok()?;
    let day = value.get(8..10)?.parse::<i64>().ok()?;
    let hour = value.get(11..13)?.parse::<i64>().ok()?;
    let minute = value.get(14..16)?.parse::<i64>().ok()?;
    let second = value.get(17..19)?.parse::<i64>().ok()?;
    Some(days_from_civil(year, month, day) * 86_400 + hour * 3_600 + minute * 60 + second)
}

fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let year = year - i64::from(month <= 2);
    let era = if year >= 0 { year } else { year - 399 } / 400;
    let yoe = year - era * 400;
    let month = month + if month > 2 { -3 } else { 9 };
    let doy = (153 * month + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468
}
