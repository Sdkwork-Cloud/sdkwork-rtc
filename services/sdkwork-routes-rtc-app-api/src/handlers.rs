use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use sdkwork_rtc_app_context::AppContext;
use sdkwork_rtc_core::RtcMediaSessionMode;
use serde::{Deserialize, Serialize};
use serde_json::{Value as JsonValue, json};

use crate::service::{
    RtcAppApiError, RtcAppApiService, RtcCreateAppMediaSessionRequest,
    RtcIssueParticipantCredentialRequest, RtcListRequest, RtcMediaArtifactListData,
    RtcMediaSessionListData, RtcRoomListData,
};

#[derive(Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcAppListQuery {
    pub cursor: Option<String>,
    pub limit: Option<u32>,
}

#[derive(Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcCreateMediaSessionBody {
    pub room_id: String,
    pub media_mode: RtcMediaSessionMode,
    pub provider_profile_id: Option<String>,
    pub provider: Option<String>,
    pub region: Option<String>,
    #[serde(default)]
    pub recording_requested: bool,
    #[serde(default = "empty_json_object")]
    pub metadata: JsonValue,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcApiEnvelope<T>
where
    T: Serialize,
{
    pub code: String,
    pub message: String,
    pub request_id: String,
    pub data: T,
}

impl<T> RtcApiEnvelope<T>
where
    T: Serialize,
{
    pub fn ok(data: T) -> Self {
        Self {
            code: "ok".to_owned(),
            message: "OK".to_owned(),
            request_id: deterministic_request_id(),
            data,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcProblemEnvelope {
    pub code: String,
    pub message: String,
    pub request_id: String,
    pub data: JsonValue,
}

impl RtcProblemEnvelope {
    fn from_error(error: &RtcAppApiError) -> Self {
        Self {
            code: error.code().to_owned(),
            message: error.message().to_owned(),
            request_id: deterministic_request_id(),
            data: json!({}),
        }
    }
}

pub async fn list_rooms(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcRoomListData>>, RtcAppHandlerError> {
    let result = service.list_rooms(list_request(&context, query)).await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_room(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Path(room_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<sdkwork_rtc_core::RtcRoom>>, RtcAppHandlerError> {
    let result = service
        .retrieve_room(context.tenant_id, context.organization_id, room_id)
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_active_provider_profiles(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<
    Json<RtcApiEnvelope<crate::service::RtcActiveProviderProfileListData>>,
    RtcAppHandlerError,
> {
    let result = service
        .list_active_provider_profiles(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_media_sessions(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSessionListData>>, RtcAppHandlerError> {
    let result = service
        .list_media_sessions(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn create_media_session(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcCreateMediaSessionBody>,
) -> Result<Json<RtcApiEnvelope<sdkwork_rtc_core::RtcMediaSession>>, RtcAppHandlerError> {
    let result = service
        .create_media_session(
            context.tenant_id,
            context.organization_id,
            context.user_id,
            RtcCreateAppMediaSessionRequest {
                room_id: body.room_id,
                media_mode: body.media_mode,
                provider_profile_id: body.provider_profile_id,
                provider: body.provider,
                region: body.region,
                recording_requested: body.recording_requested,
                metadata: body.metadata,
            },
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_media_session(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<sdkwork_rtc_core::RtcMediaSession>>, RtcAppHandlerError> {
    let result = service
        .retrieve_media_session(context.tenant_id, context.organization_id, media_session_id)
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_media_session_completion_record(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<
    Json<RtcApiEnvelope<sdkwork_rtc_core::RtcMediaSessionCompletionRecord>>,
    RtcAppHandlerError,
> {
    let result = service
        .retrieve_media_session_completion_record(
            context.tenant_id,
            context.organization_id,
            media_session_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn issue_participant_credential(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Path((media_session_id, participant_id)): Path<(String, String)>,
) -> Result<Json<RtcApiEnvelope<sdkwork_rtc_core::RtcParticipantCredential>>, RtcAppHandlerError> {
    let result = service
        .issue_participant_credential(
            context.tenant_id,
            context.organization_id,
            context.user_id,
            RtcIssueParticipantCredentialRequest {
                media_session_id,
                participant_id,
            },
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_recording_artifacts(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaArtifactListData>>, RtcAppHandlerError> {
    let result = service
        .list_recording_artifacts(
            context.tenant_id,
            context.organization_id,
            media_session_id,
            query.cursor,
            query.limit,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

#[derive(Debug)]
pub struct RtcAppHandlerError(RtcAppApiError);

impl From<RtcAppApiError> for RtcAppHandlerError {
    fn from(error: RtcAppApiError) -> Self {
        Self(error)
    }
}

impl IntoResponse for RtcAppHandlerError {
    fn into_response(self) -> Response {
        let status = self.0.status_code();
        (status, Json(RtcProblemEnvelope::from_error(&self.0))).into_response()
    }
}

fn list_request(context: &AppContext, query: RtcAppListQuery) -> RtcListRequest {
    RtcListRequest {
        tenant_id: context.tenant_id.clone(),
        organization_id: context.organization_id.clone(),
        cursor: query.cursor,
        limit: query.limit,
    }
}

fn empty_json_object() -> JsonValue {
    json!({})
}

fn deterministic_request_id() -> String {
    "00000000-0000-0000-0000-000000000000".to_owned()
}

pub fn no_content() -> StatusCode {
    StatusCode::NO_CONTENT
}
