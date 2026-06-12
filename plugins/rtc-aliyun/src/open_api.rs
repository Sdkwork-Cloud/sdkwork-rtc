use sdkwork_communication_rtc_service::{RtcContractError, RtcProviderQueryRequest};
use serde_json::json;

use crate::config::AliyunRtcProviderConfig;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AliyunRtcOpenApiRequest {
    pub method: String,
    pub endpoint: String,
    pub action: String,
    pub headers: Vec<(String, String)>,
    pub query: Vec<(String, String)>,
    pub body: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AliyunRtcOpenApiResponse {
    pub status_code: u16,
    pub body: String,
}

pub trait AliyunRtcOpenApiExecutor: Send + Sync {
    fn execute(
        &self,
        request: &AliyunRtcOpenApiRequest,
    ) -> Result<AliyunRtcOpenApiResponse, RtcContractError>;
}

pub fn build_aliyun_request(
    config: &AliyunRtcProviderConfig,
    request: &RtcProviderQueryRequest,
    action: &str,
) -> AliyunRtcOpenApiRequest {
    let mut query = vec![
        ("Action".to_string(), action.to_string()),
        ("RegionId".to_string(), config.region.clone()),
    ];
    if let Some(room_id) = request.room_id.as_deref().filter(|value| !value.is_empty()) {
        query.push(("ChannelId".to_string(), room_id.to_string()));
    }
    if let Some(session_id) = request
        .provider_session_id
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        query.push(("SessionId".to_string(), session_id.to_string()));
    }
    if let Some(cursor) = request.cursor.as_deref().filter(|value| !value.is_empty()) {
        query.push(("NextToken".to_string(), cursor.to_string()));
    }
    AliyunRtcOpenApiRequest {
        method: "GET".to_string(),
        endpoint: config.access_endpoint.clone(),
        action: action.to_string(),
        headers: vec![("Accept".to_string(), "application/json".to_string())],
        query,
        body: String::new(),
    }
}

pub fn request_snapshot(
    request: &AliyunRtcOpenApiRequest,
    response: Option<&AliyunRtcOpenApiResponse>,
) -> String {
    let provider_response = response.map(|response| {
        json!({
            "statusCode": response.status_code,
            "body": response.body,
        })
    });
    json!({
        "provider": "aliyun",
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
