use sdkwork_communication_rtc_service::{RtcContractError, RtcProviderQueryRequest};
use serde_json::json;

use crate::config::AgoraRtcProviderConfig;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AgoraRtcOpenApiRequest {
    pub method: String,
    pub endpoint: String,
    pub action: String,
    pub headers: Vec<(String, String)>,
    pub query: Vec<(String, String)>,
    pub body: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AgoraRtcOpenApiResponse {
    pub status_code: u16,
    pub body: String,
}

pub trait AgoraRtcOpenApiExecutor: Send + Sync {
    fn execute(
        &self,
        request: &AgoraRtcOpenApiRequest,
    ) -> Result<AgoraRtcOpenApiResponse, RtcContractError>;
}

pub fn build_agora_request(
    config: &AgoraRtcProviderConfig,
    request: &RtcProviderQueryRequest,
    action: &str,
) -> AgoraRtcOpenApiRequest {
    let mut query = Vec::new();
    if let Some(room_id) = request.room_id.as_deref().filter(|value| !value.is_empty()) {
        query.push(("roomId".to_string(), room_id.to_string()));
    }
    if let Some(session_id) = request
        .provider_session_id
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        query.push(("providerSessionId".to_string(), session_id.to_string()));
    }
    if let Some(cursor) = request.cursor.as_deref().filter(|value| !value.is_empty()) {
        query.push(("cursor".to_string(), cursor.to_string()));
    }
    AgoraRtcOpenApiRequest {
        method: "GET".to_string(),
        endpoint: config.access_endpoint.clone(),
        action: action.to_string(),
        headers: vec![("Accept".to_string(), "application/json".to_string())],
        query,
        body: String::new(),
    }
}

pub fn request_snapshot(
    request: &AgoraRtcOpenApiRequest,
    response: Option<&AgoraRtcOpenApiResponse>,
) -> String {
    let provider_response = response.map(|response| {
        json!({
            "statusCode": response.status_code,
            "body": response.body,
        })
    });
    json!({
        "provider": "agora",
        "providerRequest": {
            "method": request.method,
            "endpoint": request.endpoint,
            "action": request.action,
            "headers": request.headers.iter().map(|(key, _)| key).collect::<Vec<_>>(),
            "query": request.query,
        },
        "providerResponse": provider_response,
    })
    .to_string()
}
