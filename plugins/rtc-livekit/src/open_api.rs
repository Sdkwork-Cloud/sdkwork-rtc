use sdkwork_communication_rtc_service::{RtcContractError, RtcProviderQueryRequest};
use serde_json::json;

use crate::config::LivekitRtcProviderConfig;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LivekitRtcOpenApiRequest {
    pub method: String,
    pub endpoint: String,
    pub action: String,
    pub headers: Vec<(String, String)>,
    pub query: Vec<(String, String)>,
    pub body: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LivekitRtcOpenApiResponse {
    pub status_code: u16,
    pub body: String,
}

pub trait LivekitRtcOpenApiExecutor: Send + Sync {
    fn execute(
        &self,
        request: &LivekitRtcOpenApiRequest,
    ) -> Result<LivekitRtcOpenApiResponse, RtcContractError>;
}

pub fn build_livekit_request(
    config: &LivekitRtcProviderConfig,
    request: &RtcProviderQueryRequest,
    action: &str,
) -> LivekitRtcOpenApiRequest {
    let mut query = Vec::new();
    if let Some(room_id) = request.room_id.as_deref().filter(|value| !value.is_empty()) {
        query.push(("roomName".to_string(), room_id.to_string()));
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
    LivekitRtcOpenApiRequest {
        method: "GET".to_string(),
        endpoint: config.access_endpoint.clone(),
        action: action.to_string(),
        headers: vec![("Accept".to_string(), "application/json".to_string())],
        query,
        body: String::new(),
    }
}

pub fn request_snapshot(
    request: &LivekitRtcOpenApiRequest,
    response: Option<&LivekitRtcOpenApiResponse>,
) -> String {
    let provider_response = response.map(|response| {
        json!({
            "statusCode": response.status_code,
            "body": response.body,
        })
    });
    json!({
        "provider": "livekit",
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
