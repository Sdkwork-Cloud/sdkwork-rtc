use std::sync::Arc;

use axum::{
    Extension, Json,
    body::Bytes,
    extract::{Path, Query, State},
    http::HeaderMap,
    response::{IntoResponse, Response},
};
use sdkwork_communication_rtc_service::{
    ProviderConfigSchema, ProviderPluginDescriptor, RtcMediaArtifact, RtcMediaSession,
    RtcMediaSessionCompletionRecord, RtcProviderAccount, RtcProviderAccountCommand,
    RtcProviderAccountDisableRequest, RtcProviderApplication, RtcProviderApplicationCommand,
    RtcProviderApplicationDisableRequest, RtcProviderCredential, RtcProviderCredentialCommand,
    RtcProviderCredentialRevokeRequest, RtcProviderProfile, RtcProviderProfileCommand,
    RtcProviderProfileDisableRequest, RtcProviderProfileVerifyRequest,
    RtcProviderProfileVerifyResult, RtcProviderQueryJobRecord, RtcProviderWebhookEventRecord,
    RtcQualitySample, RtcRoom,
};
use sdkwork_rtc_app_context::AppContext;
use sdkwork_web_core::WebRequestContext;
use serde::Serialize;
use serde_json::{Value as JsonValue, json};

use crate::service::{
    RtcBackendApiError, RtcBackendApiService, RtcBackendListQuery, RtcBackendListRequest,
    RtcCloseMediaSessionRequest, RtcListData, RtcMediaArtifactListData, RtcMediaSessionListData,
    RtcProviderQueryJobCreateRequest, RtcProviderQuerySnapshotListData, RtcProviderRoute,
    RtcProviderRouteCommand, RtcProviderRouteDisableRequest, RtcProviderRouteListData,
    RtcProviderWebhookIngress,
};

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
    fn from_error(error: &RtcBackendApiError, request_id: impl Into<String>) -> Self {
        Self {
            code: error.code().to_owned(),
            message: error.message().to_owned(),
            request_id: request_id.into(),
            data: json!({}),
        }
    }
}

pub async fn list_rooms(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcRoom>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service.list_rooms(list_request(&context, query)).await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_room(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(room_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcRoom>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_room(context.tenant_id, context.organization_id, room_id)
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_accounts(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderAccount>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_provider_accounts(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderAccountCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .create_provider_account(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_provider_account(
                context.tenant_id,
                context.organization_id,
                provider_account_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn update_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Json(body): Json<RtcProviderAccountCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .update_provider_account(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_account_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn disable_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Json(body): Json<RtcProviderAccountDisableRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .disable_provider_account(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_account_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_applications(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderApplication>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_provider_applications(
                context.tenant_id,
                context.organization_id,
                provider_account_id,
                query,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Json(body): Json<RtcProviderApplicationCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .create_provider_application(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_account_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_provider_application(
                context.tenant_id,
                context.organization_id,
                provider_application_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn update_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Json(body): Json<RtcProviderApplicationCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .update_provider_application(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_application_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn disable_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Json(body): Json<RtcProviderApplicationDisableRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .disable_provider_application(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_application_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_credentials(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderCredential>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_provider_credentials(
                context.tenant_id,
                context.organization_id,
                provider_application_id,
                query,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Json(body): Json<RtcProviderCredentialCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .create_provider_credential(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_application_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_credential_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_provider_credential(
                context.tenant_id,
                context.organization_id,
                provider_credential_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn update_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_credential_id): Path<String>,
    Json(body): Json<RtcProviderCredentialCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .update_provider_credential(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_credential_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn revoke_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_credential_id): Path<String>,
    Json(body): Json<RtcProviderCredentialRevokeRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .revoke_provider_credential(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_credential_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_profiles(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderProfile>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_provider_profiles(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderProfileCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .create_provider_profile(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_provider_profile(
                context.tenant_id,
                context.organization_id,
                provider_profile_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn update_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
    Json(body): Json<RtcProviderProfileCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .update_provider_profile(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_profile_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn disable_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
    Json(body): Json<RtcProviderProfileDisableRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .disable_provider_profile(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_profile_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn verify_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
    Json(body): Json<RtcProviderProfileVerifyRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfileVerifyResult>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .verify_provider_profile(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_profile_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_routes(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcProviderRouteListData>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_provider_routes(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_provider_route(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderRouteCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderRoute>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .create_provider_route(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_provider_route(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_route_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderRoute>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_provider_route(
                context.tenant_id,
                context.organization_id,
                provider_route_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn update_provider_route(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_route_id): Path<String>,
    Json(body): Json<RtcProviderRouteCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderRoute>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .update_provider_route(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_route_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn disable_provider_route(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_route_id): Path<String>,
    Json(body): Json<RtcProviderRouteDisableRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderRoute>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .disable_provider_route(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_route_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_media_sessions(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSessionListData>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_media_sessions(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_media_session(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSession>>, RtcBackendHandlerError> {
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
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSessionCompletionRecord>>, RtcBackendHandlerError> {
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

pub async fn close_media_session(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
    Json(body): Json<RtcCloseMediaSessionRequest>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSession>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .close_media_session(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                media_session_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_media_artifacts(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaArtifactListData>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_media_artifacts(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_media_artifact(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(media_artifact_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcMediaArtifact>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_media_artifact(
                context.tenant_id,
                context.organization_id,
                media_artifact_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_quality_samples(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcQualitySample>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_quality_samples(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_webhook_events(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderWebhookEventRecord>>>, RtcBackendHandlerError>
{
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_provider_webhook_events(list_request(&context, query))
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn receive_provider_webhook_event(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Path(provider): Path<String>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<RtcApiEnvelope<RtcProviderWebhookEventRecord>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let ingress = RtcProviderWebhookIngress::from_http_request(&headers, body.as_ref())
        .map_err(|error| RtcBackendHandlerError::from_api_error(error, request_id.clone()))?;
    let result = map_handler_error(
        &request_id,
        service.receive_provider_webhook_event(provider, ingress).await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn create_provider_query_job(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderQueryJobCreateRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderQueryJobRecord>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .create_provider_query_job(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn retrieve_provider_query_job(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_query_job_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderQueryJobRecord>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .retrieve_provider_query_job(
                context.tenant_id,
                context.organization_id,
                provider_query_job_id,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_query_snapshots(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_query_job_id): Path<String>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcProviderQuerySnapshotListData>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .list_provider_query_snapshots(
                context.tenant_id,
                context.organization_id,
                provider_query_job_id,
                query,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_config_schemas(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
) -> Result<Json<RtcApiEnvelope<Vec<ProviderConfigSchema>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(&request_id, service.list_provider_config_schemas().await)?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn get_provider_config_schema(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Path(provider): Path<String>,
) -> Result<Json<RtcApiEnvelope<ProviderConfigSchema>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service.get_provider_config_schema(provider).await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn list_provider_plugins(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
) -> Result<Json<RtcApiEnvelope<Vec<ProviderPluginDescriptor>>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(&request_id, service.list_provider_plugins().await)?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn get_provider_plugin(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Path(provider): Path<String>,
) -> Result<Json<RtcApiEnvelope<ProviderPluginDescriptor>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(&request_id, service.get_provider_plugin(provider).await)?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

pub async fn configure_provider_capabilities(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(web_context): Extension<WebRequestContext>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
    Json(body): Json<crate::service::RtcProviderCapabilityConfig>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let request_id = envelope_request_id(&web_context);
    let result = map_handler_error(
        &request_id,
        service
            .configure_provider_capabilities(
                context.tenant_id,
                context.organization_id,
                context.actor_id,
                provider_profile_id,
                body,
            )
            .await,
    )?;
    Ok(Json(RtcApiEnvelope::ok(result, request_id)))
}

#[derive(Debug)]
pub struct RtcBackendHandlerError {
    error: RtcBackendApiError,
    request_id: String,
}

impl RtcBackendHandlerError {
    fn from_api_error(error: RtcBackendApiError, request_id: String) -> Self {
        Self { error, request_id }
    }
}

impl IntoResponse for RtcBackendHandlerError {
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
    result: Result<T, RtcBackendApiError>,
) -> Result<T, RtcBackendHandlerError> {
    result.map_err(|error| RtcBackendHandlerError::from_api_error(error, request_id.to_owned()))
}

fn envelope_request_id(web_context: &WebRequestContext) -> String {
    web_context.request_id.0.clone()
}

fn list_request(context: &AppContext, query: RtcBackendListQuery) -> RtcBackendListRequest {
    RtcBackendListRequest {
        tenant_id: context.tenant_id.clone(),
        organization_id: context.organization_id.clone(),
        provider: query.provider,
        status: query.status,
        page: query.page,
        page_size: query.page_size,
        cursor: query.cursor,
        limit: query.limit,
        q: query.q,
        sort: query.sort,
    }
}
