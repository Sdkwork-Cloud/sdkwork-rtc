use hmac::{Hmac, Mac};
use sdkwork_rtc_core::{RtcContractError, RtcProviderQueryKind, RtcProviderQueryRequest};
use serde_json::json;
use sha2::{Digest, Sha256};

use crate::VolcengineRtcProviderConfig;

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VolcengineRtcOpenApiRequest {
    pub method: String,
    pub endpoint: String,
    pub host: String,
    pub path: String,
    pub action: String,
    pub headers: Vec<(String, String)>,
    pub query: Vec<(String, String)>,
    pub body: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VolcengineRtcOpenApiResponse {
    pub status_code: u16,
    pub body: String,
}

pub trait VolcengineRtcOpenApiExecutor: Send + Sync {
    fn execute(
        &self,
        request: &VolcengineRtcOpenApiRequest,
    ) -> Result<VolcengineRtcOpenApiResponse, RtcContractError>;
}

pub fn volcengine_action(query_kind: RtcProviderQueryKind) -> &'static str {
    match query_kind {
        RtcProviderQueryKind::RoomOnlineUsers => "GetRoomOnlineUsers",
        RtcProviderQueryKind::RoomState | RtcProviderQueryKind::MediaSessionState => "GetRoomInfo",
        RtcProviderQueryKind::RecordingArtifacts => "GetRecordTask",
        RtcProviderQueryKind::QualitySamples => "DescribeRealtimeQualityMetric",
    }
}

pub fn build_signed_volcengine_request(
    config: &VolcengineRtcProviderConfig,
    request: &RtcProviderQueryRequest,
    action: &str,
    signed_at: &str,
) -> Result<VolcengineRtcOpenApiRequest, RtcContractError> {
    let access_key_id = required_config(
        config.access_key_id.as_deref(),
        "SDKWORK_RTC_VOLCENGINE_ACCESS_KEY_ID",
    )?;
    let secret_access_key = required_config(
        config.secret_access_key.as_deref(),
        "SDKWORK_RTC_VOLCENGINE_SECRET_ACCESS_KEY",
    )?;
    let body = String::new();
    let payload_hash = sha256_hex(body.as_bytes());
    let mut query = vec![
        ("Action".to_string(), action.to_string()),
        ("Version".to_string(), config.api_version.clone()),
    ];
    if let Some(app_id) = config.app_id.as_deref().filter(|value| !value.is_empty()) {
        query.push(("AppId".to_string(), app_id.to_string()));
    }
    if let Some(room_id) = request.room_id.as_deref().filter(|value| !value.is_empty()) {
        query.push(("RoomId".to_string(), room_id.to_string()));
    }
    if let Some(cursor) = request.cursor.as_deref().filter(|value| !value.is_empty()) {
        query.push(("PageToken".to_string(), cursor.to_string()));
    }
    query.sort_by(|left, right| left.0.cmp(&right.0).then(left.1.cmp(&right.1)));

    let canonical_query = canonical_query(query.as_slice());
    let (short_date, signing_time) = volcengine_signing_time(signed_at);
    let canonical_headers = format!(
        "content-type:application/json\nhost:{}\nx-content-sha256:{}\nx-date:{}\n",
        config.api_host, payload_hash, signing_time
    );
    let signed_headers = "content-type;host;x-content-sha256;x-date";
    let canonical_request = format!(
        "GET\n/\n{}\n{}\n{}\n{}",
        canonical_query, canonical_headers, signed_headers, payload_hash
    );
    let scope = format!("{}/{}/rtc/request", short_date, config.region);
    let string_to_sign = format!(
        "HMAC-SHA256\n{}\n{}\n{}",
        signing_time,
        scope,
        sha256_hex(canonical_request.as_bytes())
    );
    let signing_key = hmac_sha256(secret_access_key.as_bytes(), short_date.as_bytes())?;
    let signing_key = hmac_sha256(signing_key.as_slice(), config.region.as_bytes())?;
    let signing_key = hmac_sha256(signing_key.as_slice(), b"rtc")?;
    let signing_key = hmac_sha256(signing_key.as_slice(), b"request")?;
    let signature_bytes = hmac_sha256(signing_key.as_slice(), string_to_sign.as_bytes())?;
    let signature = hex_lower(signature_bytes.as_slice());
    let authorization = format!(
        "HMAC-SHA256 Credential={}/{}, SignedHeaders={}, Signature={}",
        access_key_id, scope, signed_headers, signature
    );

    Ok(VolcengineRtcOpenApiRequest {
        method: "GET".into(),
        endpoint: config.api_endpoint.clone(),
        host: config.api_host.clone(),
        path: "/".into(),
        action: action.into(),
        headers: vec![
            ("Content-Type".into(), "application/json".into()),
            ("Host".into(), config.api_host.clone()),
            ("X-Date".into(), signing_time),
            ("X-Content-Sha256".into(), payload_hash),
            ("Authorization".into(), authorization),
        ],
        query,
        body,
    })
}

pub fn request_snapshot(
    request: &VolcengineRtcOpenApiRequest,
    response: Option<&VolcengineRtcOpenApiResponse>,
) -> String {
    let provider_request = json!({
        "method": request.method,
        "endpoint": request.endpoint,
        "host": request.host,
        "path": request.path,
        "action": request.action,
        "query": request.query,
        "signedHeaderNames": request.headers.iter().map(|(key, _)| key).collect::<Vec<_>>(),
    });
    let provider_response = response.map(|response| {
        json!({
            "statusCode": response.status_code,
            "body": response.body,
        })
    });
    json!({
        "provider": "volcengine",
        "providerRequest": provider_request,
        "providerResponse": provider_response,
    })
    .to_string()
}

fn required_config(value: Option<&str>, env_name: &str) -> Result<String, RtcContractError> {
    value
        .filter(|value| !value.trim().is_empty())
        .map(str::to_string)
        .ok_or_else(|| {
            RtcContractError::Unavailable(format!(
                "volcengine active query requires {env_name} or provider profile credentials"
            ))
        })
}

fn canonical_query(query: &[(String, String)]) -> String {
    query
        .iter()
        .map(|(key, value)| format!("{}={}", percent_encode(key), percent_encode(value)))
        .collect::<Vec<_>>()
        .join("&")
}

fn percent_encode(value: &str) -> String {
    value
        .bytes()
        .flat_map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                vec![byte as char]
            }
            _ => format!("%{byte:02X}").chars().collect(),
        })
        .collect()
}

fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    hex_lower(digest.as_slice())
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> Result<Vec<u8>, RtcContractError> {
    let mut mac = HmacSha256::new_from_slice(key)
        .map_err(|_| RtcContractError::Conflict("invalid volcengine signing key".into()))?;
    mac.update(data);
    Ok(mac.finalize().into_bytes().to_vec())
}

fn hex_lower(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn volcengine_signing_time(rfc3339_millis: &str) -> (String, String) {
    if rfc3339_millis.len() >= 19 {
        let short_date = format!(
            "{}{}{}",
            &rfc3339_millis[0..4],
            &rfc3339_millis[5..7],
            &rfc3339_millis[8..10]
        );
        let signing_time = format!(
            "{}T{}{}{}Z",
            short_date,
            &rfc3339_millis[11..13],
            &rfc3339_millis[14..16],
            &rfc3339_millis[17..19]
        );
        return (short_date, signing_time);
    }
    ("19700101".into(), "19700101T000000Z".into())
}
