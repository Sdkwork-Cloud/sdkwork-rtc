use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Response,
};
use sdkwork_communication_rtc_service::RtcMediaSessionMode;
use sdkwork_rtc_app_context::AppContext;
use sdkwork_web_core::{IDEMPOTENCY_KEY_HEADER, WebRequestContext, X_IDEMPOTENCY_KEY_HEADER};
use serde::Deserialize;
use serde_json::{Value as JsonValue, json};

use crate::responses::{
    api_created, api_item, api_list_payload, list_params_from_app_query,
    map_handler_error, resolved_trace_id, RtcAppHandlerError,
};
use crate::service::{
    RtcAppApiService, RtcAppListQuery, RtcCreateAppMediaSessionRequest, RtcCreateAppRoomRequest,
    RtcIssueParticipantCredentialRequest, RtcListRequest,
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

pub async fn list_rooms(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let params = list_params_from_app_query(&query);
    let result = map_handler_error(
        &trace_id,
        service.list_rooms(list_request(&context, query)).await,
    )?;
    Ok(api_list_payload(
        result.items,
        result.next_cursor,
        &params,
        &trace_id,
    ))
}

pub async fn retrieve_room(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(room_id): Path<String>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let result = map_handler_error(
        &trace_id,
        service
            .retrieve_room(context.tenant_id, context.organization_id, room_id)
            .await,
    )?;
    Ok(api_item(result, &trace_id))
}

pub async fn list_active_provider_profiles(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let params = list_params_from_app_query(&query);
    let result = map_handler_error(
        &trace_id,
        service
            .list_active_provider_profiles(list_request(&context, query))
            .await,
    )?;
    Ok(api_list_payload(
        result.items,
        result.next_cursor,
        &params,
        &trace_id,
    ))
}

pub async fn create_room(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcCreateRoomBody>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let result = map_handler_error(
        &trace_id,
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
    Ok(api_created(result, &trace_id))
}

pub async fn list_media_sessions(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let params = list_params_from_app_query(&query);
    let result = map_handler_error(
        &trace_id,
        service
            .list_media_sessions(list_request(&context, query))
            .await,
    )?;
    Ok(api_list_payload(
        result.items,
        result.next_cursor,
        &params,
        &trace_id,
    ))
}

pub async fn create_media_session(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    headers: HeaderMap,
    Json(body): Json<RtcCreateMediaSessionBody>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let result = map_handler_error(
        &trace_id,
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
    Ok(api_created(result, &trace_id))
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
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let result = map_handler_error(
        &trace_id,
        service
            .retrieve_media_session(context.tenant_id, context.organization_id, media_session_id)
            .await,
    )?;
    Ok(api_item(result, &trace_id))
}

pub async fn retrieve_media_session_completion_record(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let result = map_handler_error(
        &trace_id,
        service
            .retrieve_media_session_completion_record(
                context.tenant_id,
                context.organization_id,
                media_session_id,
            )
            .await,
    )?;
    Ok(api_item(result, &trace_id))
}

pub async fn issue_participant_credential(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    headers: HeaderMap,
    Path((media_session_id, participant_id)): Path<(String, String)>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let result = map_handler_error(
        &trace_id,
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
    Ok(api_item(result, &trace_id))
}

pub async fn list_recording_artifacts(
    State(service): State<Arc<dyn RtcAppApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
    Query(query): Query<RtcAppListQuery>,
) -> Result<Response, RtcAppHandlerError> {
    let trace_id = resolved_trace_id(&web_context);
    let params = list_params_from_app_query(&query);
    let result = map_handler_error(
        &trace_id,
        service
            .list_recording_artifacts(
                context.tenant_id,
                context.organization_id,
                media_session_id,
                query,
            )
            .await,
    )?;
    Ok(api_list_payload(
        result.items,
        result.next_cursor,
        &params,
        &trace_id,
    ))
}

fn list_request(context: &AppContext, query: RtcAppListQuery) -> RtcListRequest {
    RtcListRequest {
        tenant_id: context.tenant_id.clone(),
        organization_id: context.organization_id.clone(),
        status: query.status,
        owner_user_id: query.owner_user_id,
        created_after: query.created_after,
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
