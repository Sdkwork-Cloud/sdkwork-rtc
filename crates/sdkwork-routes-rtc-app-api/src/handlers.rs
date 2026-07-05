use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use sdkwork_communication_rtc_service::RtcMediaSessionMode;
use sdkwork_rtc_app_context::AppContext;
use sdkwork_web_core::{IDEMPOTENCY_KEY_HEADER, WebRequestContext, X_IDEMPOTENCY_KEY_HEADER};
use serde::{Deserialize, Serialize};
use serde_json::{Value as JsonValue, json};

use crate::service::{
    RtcAppApiError, RtcAppApiService, RtcAppListQuery, RtcCreateAppMediaSessionRequest,
    RtcCreateAppRoomRequest, RtcIssueParticipantCredentialRequest, RtcListRequest,
    RtcMediaArtifactListData, RtcMediaSessionListData, RtcRoomListData,
};

#[derive(Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcCreateRoomBody {
    pub title: String,
    pub room_id: Option<String>,
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
    pub fn ok(data: T, request_id: impl Into<String>) -> Self {
        Self {
            code: "ok".to_owned(),
            message: "OK".to_owned(),
            request_id: request_id.into(),
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
    fn from_error(error: &RtcAppApiError, request_id: impl Into<String>) -> Self {
        Self {
            code: error.code().to_owned(),
            message: error.message().to_owned(),
            request_id: request_id.into(),
            data: json!({}),
        }
    }
}

pub async fn list_rooms(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcRoomListData>>, RtcAppHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service.list_rooms(list_request(&context, query)).await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_room(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(room_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<sdkwork_communication_rtc_service::RtcRoom>>, RtcAppHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_room(context.tenant_id, context.organization_id, room_id)
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_active_provider_profiles(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<
    Json<RtcApiEnvelope<crate::service::RtcActiveProviderProfileListData>>,
    RtcAppHandlerError,
> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_active_provider_profiles(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_room(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcCreateRoomBody>,
) -> Result<Json<RtcApiEnvelope<sdkwork_communication_rtc_service::RtcRoom>>, RtcAppHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .create_room(
                context.tenant_id,
                context.organization_id,
                context.user_id,
                RtcCreateAppRoomRequest {
                    title: body.title,
                    room_id: body.room_id,
                },
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_media_sessions(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSessionListData>>, RtcAppHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_media_sessions(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_media_session(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    headers: HeaderMap,
    Json(body): Json<RtcCreateMediaSessionBody>,
) -> Result<
    Json<RtcApiEnvelope<sdkwork_communication_rtc_service::RtcMediaSession>>,
    RtcAppHandlerError,
> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
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
                    idempotency_key: resolve_idempotency_key(&headers),
                },
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

fn resolve_idempotency_key(headers: &HeaderMap) -> Option<String> {
    [IDEMPOTENCY_KEY_HEADER, X_IDEMPOTENCY_KEY_HEADER]
        .iter()
        .find_map(|header_name| {
            headers
                .get(*header_name)
                .and_then(|value| value.to_str().ok())
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_owned)
        })
}

pub async fn retrieve_media_session(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<
    Json<RtcApiEnvelope<sdkwork_communication_rtc_service::RtcMediaSession>>,
    RtcAppHandlerError,
> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_media_session(context.tenant_id, context.organization_id, media_session_id)
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_media_session_completion_record(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<
    Json<RtcApiEnvelope<sdkwork_communication_rtc_service::RtcMediaSessionCompletionRecord>>,
    RtcAppHandlerError,
> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_media_session_completion_record(
                context.tenant_id,
                context.organization_id,
                media_session_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn issue_participant_credential(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    headers: HeaderMap,
    Path((media_session_id, participant_id)): Path<(String, String)>,
) -> Result<
    Json<RtcApiEnvelope<sdkwork_communication_rtc_service::RtcParticipantCredential>>,
    RtcAppHandlerError,
> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .issue_participant_credential(
                context.tenant_id,
                context.organization_id,
                context.user_id,
                RtcIssueParticipantCredentialRequest {
                    media_session_id,
                    participant_id,
                    idempotency_key: resolve_idempotency_key(&headers),
                },
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_recording_artifacts(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaArtifactListData>>, RtcAppHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_recording_artifacts(
                context.tenant_id,
                context.organization_id,
                media_session_id,
                query,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

#[derive(Debug)]
pub struct RtcAppHandlerError {
    error: RtcAppApiError,
    request_id: String,
}

impl RtcAppHandlerError {
    fn from_api_error(error: RtcAppApiError, request_id: String) -> Self {
        Self { error, request_id }
    }
}

impl IntoResponse for RtcAppHandlerError {
    fn into_response(self) -> Response {
        let status = self.error.status_code();
        (
            status,
            Json(RtcProblemEnvelope::from_error(&self.error, self.request_id)),
        )
            .into_response()
    }
}

fn map_handler_error<T>(
    request_id: &str,
    result: Result<T, RtcAppApiError>,
) -> Result<T, RtcAppHandlerError> {
    result.map_err(|error| RtcAppHandlerError::from_api_error(error, request_id.to_owned()))
}

fn envelope_request_id(web_context: &WebRequestContext) -> String {
    web_context.request_id.0.clone()
}

fn list_request(context: &AppContext, query: RtcAppListQuery) -> RtcListRequest {
    RtcListRequest {
        tenant_id: context.tenant_id.clone(),
        organization_id: context.organization_id.clone(),
        page: query.page,
        page_size: query.page_size,
        cursor: query.cursor,
        limit: query.limit,
        q: query.q,
        sort: query.sort,
    }
}

fn empty_json_object() -> JsonValue {
    json!({})
}

pub fn no_content() -> StatusCode {
    StatusCode::NO_CONTENT
}
