use std::future::Future;
use std::pin::Pin;

use sdkwork_communication_rtc_service::RtcListWindowParams;
use sdkwork_communication_rtc_service::{
    RtcActiveProviderProfile, RtcMediaArtifact, RtcMediaSession, RtcMediaSessionCompletionRecord,
    RtcMediaSessionMode, RtcParticipantCredential, RtcRoom,
};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

pub type RtcAppApiFuture<T> = Pin<Box<dyn Future<Output = Result<T, RtcAppApiError>> + Send>>;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcListRequest {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub cursor: Option<String>,
    pub limit: Option<u32>,
    pub q: Option<String>,
    pub sort: Option<String>,
}

impl From<&RtcListRequest> for RtcListWindowParams {
    fn from(request: &RtcListRequest) -> Self {
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

#[derive(Clone, Debug, Default, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcAppListQuery {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub cursor: Option<String>,
    pub limit: Option<u32>,
    pub q: Option<String>,
    pub sort: Option<String>,
}

impl From<&RtcAppListQuery> for RtcListWindowParams {
    fn from(query: &RtcAppListQuery) -> Self {
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

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcCreateAppMediaSessionRequest {
    pub room_id: String,
    pub media_mode: RtcMediaSessionMode,
    pub provider_profile_id: Option<String>,
    pub provider: Option<String>,
    pub region: Option<String>,
    pub recording_requested: bool,
    pub metadata: JsonValue,
    pub idempotency_key: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcIssueParticipantCredentialRequest {
    pub media_session_id: String,
    pub participant_id: String,
    pub idempotency_key: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcRoomListData {
    pub items: Vec<RtcRoom>,
    pub next_cursor: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionListData {
    pub items: Vec<RtcMediaSession>,
    pub next_cursor: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcActiveProviderProfileListData {
    pub items: Vec<RtcActiveProviderProfile>,
    pub next_cursor: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaArtifactListData {
    pub items: Vec<RtcMediaArtifact>,
    pub next_cursor: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RtcAppApiError {
    BadRequest(String),
    Forbidden(String),
    NotFound(String),
    Conflict(String),
    Unavailable(String),
    Internal(String),
}

impl RtcAppApiError {
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

pub trait RtcAppApiService: Send + Sync + 'static {
    fn list_rooms(&self, request: RtcListRequest) -> RtcAppApiFuture<RtcRoomListData>;

    fn retrieve_room(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        room_id: String,
    ) -> RtcAppApiFuture<RtcRoom>;

    fn list_active_provider_profiles(
        &self,
        request: RtcListRequest,
    ) -> RtcAppApiFuture<RtcActiveProviderProfileListData>;

    fn list_media_sessions(
        &self,
        request: RtcListRequest,
    ) -> RtcAppApiFuture<RtcMediaSessionListData>;

    fn create_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        user_id: String,
        request: RtcCreateAppMediaSessionRequest,
    ) -> RtcAppApiFuture<RtcMediaSession>;

    fn retrieve_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcAppApiFuture<RtcMediaSession>;

    fn retrieve_media_session_completion_record(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcAppApiFuture<RtcMediaSessionCompletionRecord>;

    fn issue_participant_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        user_id: String,
        request: RtcIssueParticipantCredentialRequest,
    ) -> RtcAppApiFuture<RtcParticipantCredential>;

    fn list_recording_artifacts(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
        query: RtcAppListQuery,
    ) -> RtcAppApiFuture<RtcMediaArtifactListData>;
}
