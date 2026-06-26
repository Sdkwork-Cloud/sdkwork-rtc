use std::future::Future;
use std::pin::Pin;

use sdkwork_communication_rtc_service::{
    ProviderConfigSchema, ProviderPluginDescriptor, RtcMediaArtifact, RtcMediaSession,
    RtcMediaSessionCompletionRecord, RtcProviderAccount, RtcProviderAccountCommand,
    RtcProviderAccountDisableRequest, RtcProviderApplication, RtcProviderApplicationCommand,
    RtcProviderApplicationDisableRequest, RtcProviderCredential, RtcProviderCredentialCommand,
    RtcProviderCredentialRevokeRequest, RtcProviderProfile, RtcProviderProfileCommand,
    RtcProviderProfileDisableRequest, RtcProviderProfileVerifyRequest,
    RtcProviderProfileVerifyResult, RtcProviderQueryJobRecord, RtcProviderQueryKind,
    RtcProviderQuerySnapshotRecord, RtcProviderWebhookEventRecord, RtcQualitySample, RtcRoom,
};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

pub use sdkwork_communication_rtc_service::{
    RtcProviderRoute, RtcProviderRouteCommand, RtcProviderRouteDisableRequest,
    RtcProviderRouteStatus,
};

pub type RtcBackendApiFuture<T> =
    Pin<Box<dyn Future<Output = Result<T, RtcBackendApiError>> + Send>>;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcBackendListRequest {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub provider: Option<String>,
    pub status: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub cursor: Option<String>,
    pub limit: Option<u32>,
    pub q: Option<String>,
    pub sort: Option<String>,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcBackendListQuery {
    pub provider: Option<String>,
    pub status: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub cursor: Option<String>,
    pub limit: Option<u32>,
    pub q: Option<String>,
    pub sort: Option<String>,
}

impl From<&RtcBackendListQuery> for sdkwork_communication_rtc_service::RtcListWindowParams {
    fn from(query: &RtcBackendListQuery) -> Self {
        Self {
            page: query.page,
            page_size: query.page_size,
            cursor: query.cursor.clone(),
            limit: query.limit,
            q: query.q.clone(),
            sort: query.sort.clone(),
        }
    }
}

impl From<&RtcBackendListRequest> for sdkwork_communication_rtc_service::RtcListWindowParams {
    fn from(request: &RtcBackendListRequest) -> Self {
        Self {
            page: request.page,
            page_size: request.page_size,
            cursor: request.cursor.clone(),
            limit: request.limit,
            q: request.q.clone(),
            sort: request.sort.clone(),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcCloseMediaSessionRequest {
    pub reason: Option<String>,
}

/// Legacy wrapped webhook relay payload used by integration tests and internal relays.
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderWebhookReceiveRequest {
    pub provider_profile_id: Option<String>,
    pub external_event_id: Option<String>,
    pub event_type: Option<String>,
    pub received_at: Option<String>,
    pub headers: JsonValue,
    pub payload: JsonValue,
}

/// HTTP-native provider webhook ingress. Signature verification uses `raw_body` bytes and
/// `http_headers` from the inbound request; body-controlled header substitutes are ignored.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcProviderWebhookIngress {
    pub provider_profile_id: Option<String>,
    pub external_event_id: Option<String>,
    pub event_type: Option<String>,
    pub received_at: Option<String>,
    pub http_headers: Vec<(String, String)>,
    pub raw_body: String,
}

impl RtcProviderWebhookIngress {
    pub fn from_http_request(
        headers: &axum::http::HeaderMap,
        body: &[u8],
    ) -> Result<Self, RtcBackendApiError> {
        let raw_body = std::str::from_utf8(body).map_err(|_| {
            RtcBackendApiError::BadRequest("RTC provider webhook body must be valid UTF-8".into())
        })?;
        let http_headers = header_map_to_pairs(headers);
        let metadata = serde_json::from_str::<serde_json::Value>(raw_body).ok();
        let object = metadata.as_ref().and_then(|value| value.as_object());
        Ok(Self {
            provider_profile_id: optional_json_string(
                object,
                &["providerProfileId", "provider_profile_id"],
            ),
            external_event_id: optional_json_string(
                object,
                &["externalEventId", "external_event_id"],
            ),
            event_type: optional_json_string(object, &["eventType", "event_type"]),
            received_at: optional_json_string(object, &["receivedAt", "received_at"]),
            http_headers,
            raw_body: raw_body.to_string(),
        })
    }

    /// Builds ingress for wrapped relay/test payloads. HTTP headers must still be supplied
    /// separately when exercising the HTTP handler; this helper signs the provider payload body.
    pub fn from_wrapped_test_request(request: RtcProviderWebhookReceiveRequest) -> Self {
        let raw_body = serde_json::to_string(&request.payload).unwrap_or_else(|_| "{}".into());
        Self {
            provider_profile_id: request.provider_profile_id,
            external_event_id: request.external_event_id,
            event_type: request.event_type,
            received_at: request.received_at,
            http_headers: json_headers_to_pairs(&request.headers),
            raw_body,
        }
    }

    pub fn provider_parse_payload(&self) -> String {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&self.raw_body) {
            if let Some(payload) = json.get("payload") {
                if payload.is_object() || payload.is_array() {
                    return serde_json::to_string(payload)
                        .unwrap_or_else(|_| self.raw_body.clone());
                }
            }
        }
        self.raw_body.clone()
    }
}

fn optional_json_string(
    object: Option<&serde_json::Map<String, serde_json::Value>>,
    keys: &[&str],
) -> Option<String> {
    let object = object?;
    keys.iter()
        .find_map(|key| object.get(*key))
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

pub fn header_map_to_pairs(headers: &axum::http::HeaderMap) -> Vec<(String, String)> {
    headers
        .iter()
        .map(|(name, value)| {
            (
                name.as_str().to_string(),
                value.to_str().unwrap_or_default().to_string(),
            )
        })
        .collect()
}

pub fn json_headers_to_pairs(headers: &serde_json::Value) -> Vec<(String, String)> {
    headers
        .as_object()
        .map(|object| {
            object
                .iter()
                .map(|(key, value)| {
                    (
                        key.clone(),
                        value
                            .as_str()
                            .map(str::to_string)
                            .unwrap_or_else(|| value.to_string()),
                    )
                })
                .collect()
        })
        .unwrap_or_default()
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderQueryJobCreateRequest {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub query_kind: RtcProviderQueryKind,
    pub room_id: Option<String>,
    pub media_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub cursor: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcListData<T> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
}

pub type RtcRoomListData = RtcListData<RtcRoom>;
pub type RtcMediaSessionListData = RtcListData<RtcMediaSession>;
pub type RtcMediaArtifactListData = RtcListData<RtcMediaArtifact>;
pub type RtcProviderAccountListData = RtcListData<RtcProviderAccount>;
pub type RtcProviderApplicationListData = RtcListData<RtcProviderApplication>;
pub type RtcProviderCredentialListData = RtcListData<RtcProviderCredential>;
pub type RtcProviderProfileListData = RtcListData<RtcProviderProfile>;
pub type RtcProviderRouteListData = RtcListData<RtcProviderRoute>;
pub type RtcQualitySampleListData = RtcListData<RtcQualitySample>;
pub type RtcProviderWebhookEventListData = RtcListData<RtcProviderWebhookEventRecord>;
pub type RtcProviderQuerySnapshotListData = RtcListData<RtcProviderQuerySnapshotRecord>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RtcBackendApiError {
    BadRequest(String),
    Forbidden(String),
    NotFound(String),
    Conflict(String),
    Unavailable(String),
    Internal(String),
}

impl RtcBackendApiError {
    pub fn status_code(&self) -> axum::http::StatusCode {
        match self {
            Self::BadRequest(_) => axum::http::StatusCode::BAD_REQUEST,
            Self::Forbidden(_) => axum::http::StatusCode::FORBIDDEN,
            Self::NotFound(_) => axum::http::StatusCode::NOT_FOUND,
            Self::Conflict(_) => axum::http::StatusCode::CONFLICT,
            Self::Unavailable(_) => axum::http::StatusCode::SERVICE_UNAVAILABLE,
            Self::Internal(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    pub fn code(&self) -> &'static str {
        match self {
            Self::BadRequest(_) => "bad_request",
            Self::Forbidden(_) => "forbidden",
            Self::NotFound(_) => "not_found",
            Self::Conflict(_) => "conflict",
            Self::Unavailable(_) => "unavailable",
            Self::Internal(_) => "internal_error",
        }
    }

    pub fn message(&self) -> &str {
        match self {
            Self::BadRequest(message)
            | Self::Forbidden(message)
            | Self::NotFound(message)
            | Self::Conflict(message)
            | Self::Unavailable(message)
            | Self::Internal(message) => message.as_str(),
        }
    }
}

pub trait RtcBackendApiService: Send + Sync + 'static {
    fn list_rooms(&self, request: RtcBackendListRequest) -> RtcBackendApiFuture<RtcRoomListData>;

    fn retrieve_room(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        room_id: String,
    ) -> RtcBackendApiFuture<RtcRoom>;

    fn list_provider_accounts(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderAccountListData>;

    fn create_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderAccountCommand,
    ) -> RtcBackendApiFuture<RtcProviderAccount>;

    fn retrieve_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_account_id: String,
    ) -> RtcBackendApiFuture<RtcProviderAccount>;

    fn update_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: String,
        request: RtcProviderAccountCommand,
    ) -> RtcBackendApiFuture<RtcProviderAccount>;

    fn disable_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: String,
        request: RtcProviderAccountDisableRequest,
    ) -> RtcBackendApiFuture<RtcProviderAccount>;

    fn list_provider_applications(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_account_id: String,
        query: RtcBackendListQuery,
    ) -> RtcBackendApiFuture<RtcProviderApplicationListData>;

    fn create_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: String,
        request: RtcProviderApplicationCommand,
    ) -> RtcBackendApiFuture<RtcProviderApplication>;

    fn retrieve_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_application_id: String,
    ) -> RtcBackendApiFuture<RtcProviderApplication>;

    fn update_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: String,
        request: RtcProviderApplicationCommand,
    ) -> RtcBackendApiFuture<RtcProviderApplication>;

    fn disable_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: String,
        request: RtcProviderApplicationDisableRequest,
    ) -> RtcBackendApiFuture<RtcProviderApplication>;

    fn list_provider_credentials(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_application_id: String,
        query: RtcBackendListQuery,
    ) -> RtcBackendApiFuture<RtcProviderCredentialListData>;

    fn create_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: String,
        request: RtcProviderCredentialCommand,
    ) -> RtcBackendApiFuture<RtcProviderCredential>;

    fn retrieve_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_credential_id: String,
    ) -> RtcBackendApiFuture<RtcProviderCredential>;

    fn update_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_credential_id: String,
        request: RtcProviderCredentialCommand,
    ) -> RtcBackendApiFuture<RtcProviderCredential>;

    fn revoke_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_credential_id: String,
        request: RtcProviderCredentialRevokeRequest,
    ) -> RtcBackendApiFuture<RtcProviderCredential>;

    fn list_provider_profiles(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderProfileListData>;

    fn create_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderProfileCommand,
    ) -> RtcBackendApiFuture<RtcProviderProfile>;

    fn retrieve_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_profile_id: String,
    ) -> RtcBackendApiFuture<RtcProviderProfile>;

    fn update_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: String,
        request: RtcProviderProfileCommand,
    ) -> RtcBackendApiFuture<RtcProviderProfile>;

    fn disable_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: String,
        request: RtcProviderProfileDisableRequest,
    ) -> RtcBackendApiFuture<RtcProviderProfile>;

    fn verify_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: String,
        request: RtcProviderProfileVerifyRequest,
    ) -> RtcBackendApiFuture<RtcProviderProfileVerifyResult>;

    fn list_provider_routes(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderRouteListData>;

    fn create_provider_route(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderRouteCommand,
    ) -> RtcBackendApiFuture<RtcProviderRoute>;

    fn retrieve_provider_route(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_route_id: String,
    ) -> RtcBackendApiFuture<RtcProviderRoute>;

    fn update_provider_route(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_route_id: String,
        request: RtcProviderRouteCommand,
    ) -> RtcBackendApiFuture<RtcProviderRoute>;

    fn disable_provider_route(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_route_id: String,
        request: RtcProviderRouteDisableRequest,
    ) -> RtcBackendApiFuture<RtcProviderRoute>;

    fn list_media_sessions(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcMediaSessionListData>;

    fn retrieve_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcBackendApiFuture<RtcMediaSession>;

    fn retrieve_media_session_completion_record(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcBackendApiFuture<RtcMediaSessionCompletionRecord>;

    fn close_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        media_session_id: String,
        request: RtcCloseMediaSessionRequest,
    ) -> RtcBackendApiFuture<RtcMediaSession>;

    fn list_media_artifacts(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcMediaArtifactListData>;

    fn retrieve_media_artifact(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_artifact_id: String,
    ) -> RtcBackendApiFuture<RtcMediaArtifact>;

    fn list_quality_samples(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcQualitySampleListData>;

    fn list_provider_webhook_events(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderWebhookEventListData>;

    fn receive_provider_webhook_event(
        &self,
        provider: String,
        ingress: RtcProviderWebhookIngress,
    ) -> RtcBackendApiFuture<RtcProviderWebhookEventRecord>;

    fn create_provider_query_job(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderQueryJobCreateRequest,
    ) -> RtcBackendApiFuture<RtcProviderQueryJobRecord>;

    fn retrieve_provider_query_job(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_query_job_id: String,
    ) -> RtcBackendApiFuture<RtcProviderQueryJobRecord>;

    fn list_provider_query_snapshots(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_query_job_id: String,
        query: RtcBackendListQuery,
    ) -> RtcBackendApiFuture<RtcProviderQuerySnapshotListData>;

    fn list_provider_config_schemas(&self) -> RtcBackendApiFuture<Vec<ProviderConfigSchema>>;

    fn get_provider_config_schema(
        &self,
        provider: String,
    ) -> RtcBackendApiFuture<ProviderConfigSchema>;

    fn list_provider_plugins(&self) -> RtcBackendApiFuture<Vec<ProviderPluginDescriptor>>;

    fn get_provider_plugin(
        &self,
        provider: String,
    ) -> RtcBackendApiFuture<ProviderPluginDescriptor>;

    fn configure_provider_capabilities(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: String,
        request: RtcProviderCapabilityConfig,
    ) -> RtcBackendApiFuture<RtcProviderProfile>;
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderCapabilityConfig {
    pub enabled_capabilities: Vec<String>,
    pub disabled_capabilities: Vec<String>,
}
