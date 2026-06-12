use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    response::{IntoResponse, Response},
};
use sdkwork_communication_rtc_service::{
    RtcMediaArtifact, RtcMediaSession, RtcMediaSessionCompletionRecord, RtcProviderAccount,
    RtcProviderAccountCommand, RtcProviderAccountDisableRequest, RtcProviderApplication,
    RtcProviderApplicationCommand, RtcProviderApplicationDisableRequest, RtcProviderCredential,
    RtcProviderCredentialCommand, RtcProviderCredentialRevokeRequest, RtcProviderProfile,
    RtcProviderProfileCommand, RtcProviderProfileDisableRequest, RtcProviderProfileVerifyRequest,
    RtcProviderProfileVerifyResult, RtcProviderQueryJobRecord, RtcProviderWebhookEventRecord,
    RtcQualitySample, RtcRoom,
};
use sdkwork_rtc_app_context::AppContext;
use serde::{Deserialize, Serialize};
use serde_json::{Value as JsonValue, json};

use crate::service::{
    RtcBackendApiError, RtcBackendApiService, RtcBackendListRequest, RtcCloseMediaSessionRequest,
    RtcListData, RtcMediaArtifactListData, RtcMediaSessionListData,
    RtcProviderQueryJobCreateRequest, RtcProviderQuerySnapshotListData, RtcProviderRoute,
    RtcProviderRouteCommand, RtcProviderRouteListData, RtcProviderWebhookReceiveRequest,
};

#[derive(Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcBackendListQuery {
    pub provider: Option<String>,
    pub status: Option<String>,
    pub cursor: Option<String>,
    pub limit: Option<u32>,
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
    fn from_error(error: &RtcBackendApiError) -> Self {
        Self {
            code: error.code().to_owned(),
            message: error.message().to_owned(),
            request_id: deterministic_request_id(),
            data: json!({}),
        }
    }
}

pub async fn list_rooms(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcRoom>>>, RtcBackendHandlerError> {
    let result = service.list_rooms(list_request(&context, query)).await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_room(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(room_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcRoom>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_room(context.tenant_id, context.organization_id, room_id)
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_provider_accounts(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderAccount>>>, RtcBackendHandlerError> {
    let result = service
        .list_provider_accounts(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn create_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderAccountCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let result = service
        .create_provider_account(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_provider_account(
            context.tenant_id,
            context.organization_id,
            provider_account_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn update_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Json(body): Json<RtcProviderAccountCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let result = service
        .update_provider_account(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_account_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn disable_provider_account(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Json(body): Json<RtcProviderAccountDisableRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderAccount>>, RtcBackendHandlerError> {
    let result = service
        .disable_provider_account(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_account_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_provider_applications(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderApplication>>>, RtcBackendHandlerError> {
    let result = service
        .list_provider_applications(
            context.tenant_id,
            context.organization_id,
            provider_account_id,
            query.cursor,
            query.limit,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn create_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_account_id): Path<String>,
    Json(body): Json<RtcProviderApplicationCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let result = service
        .create_provider_application(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_account_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_provider_application(
            context.tenant_id,
            context.organization_id,
            provider_application_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn update_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Json(body): Json<RtcProviderApplicationCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let result = service
        .update_provider_application(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_application_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn disable_provider_application(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Json(body): Json<RtcProviderApplicationDisableRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderApplication>>, RtcBackendHandlerError> {
    let result = service
        .disable_provider_application(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_application_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_provider_credentials(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderCredential>>>, RtcBackendHandlerError> {
    let result = service
        .list_provider_credentials(
            context.tenant_id,
            context.organization_id,
            provider_application_id,
            query.cursor,
            query.limit,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn create_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_application_id): Path<String>,
    Json(body): Json<RtcProviderCredentialCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let result = service
        .create_provider_credential(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_application_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_credential_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_provider_credential(
            context.tenant_id,
            context.organization_id,
            provider_credential_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn update_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_credential_id): Path<String>,
    Json(body): Json<RtcProviderCredentialCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let result = service
        .update_provider_credential(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_credential_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn revoke_provider_credential(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_credential_id): Path<String>,
    Json(body): Json<RtcProviderCredentialRevokeRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderCredential>>, RtcBackendHandlerError> {
    let result = service
        .revoke_provider_credential(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_credential_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_provider_profiles(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderProfile>>>, RtcBackendHandlerError> {
    let result = service
        .list_provider_profiles(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn create_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderProfileCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let result = service
        .create_provider_profile(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_provider_profile(
            context.tenant_id,
            context.organization_id,
            provider_profile_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn update_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
    Json(body): Json<RtcProviderProfileCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let result = service
        .update_provider_profile(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_profile_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn disable_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
    Json(body): Json<RtcProviderProfileDisableRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfile>>, RtcBackendHandlerError> {
    let result = service
        .disable_provider_profile(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_profile_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn verify_provider_profile(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_profile_id): Path<String>,
    Json(body): Json<RtcProviderProfileVerifyRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderProfileVerifyResult>>, RtcBackendHandlerError> {
    let result = service
        .verify_provider_profile(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            provider_profile_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_provider_routes(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcProviderRouteListData>>, RtcBackendHandlerError> {
    let result = service
        .list_provider_routes(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn create_provider_route(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderRouteCommand>,
) -> Result<Json<RtcApiEnvelope<RtcProviderRoute>>, RtcBackendHandlerError> {
    let result = service
        .create_provider_route(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_media_sessions(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSessionListData>>, RtcBackendHandlerError> {
    let result = service
        .list_media_sessions(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_media_session(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSession>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_media_session(context.tenant_id, context.organization_id, media_session_id)
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_media_session_completion_record(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSessionCompletionRecord>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_media_session_completion_record(
            context.tenant_id,
            context.organization_id,
            media_session_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn close_media_session(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(media_session_id): Path<String>,
    Json(body): Json<RtcCloseMediaSessionRequest>,
) -> Result<Json<RtcApiEnvelope<RtcMediaSession>>, RtcBackendHandlerError> {
    let result = service
        .close_media_session(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            media_session_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_media_artifacts(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcMediaArtifactListData>>, RtcBackendHandlerError> {
    let result = service
        .list_media_artifacts(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_media_artifact(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(media_artifact_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcMediaArtifact>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_media_artifact(
            context.tenant_id,
            context.organization_id,
            media_artifact_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_quality_samples(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcQualitySample>>>, RtcBackendHandlerError> {
    let result = service
        .list_quality_samples(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_provider_webhook_events(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcListData<RtcProviderWebhookEventRecord>>>, RtcBackendHandlerError>
{
    let result = service
        .list_provider_webhook_events(list_request(&context, query))
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn receive_provider_webhook_event(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Path(provider): Path<String>,
    Json(body): Json<RtcProviderWebhookReceiveRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderWebhookEventRecord>>, RtcBackendHandlerError> {
    let result = service
        .receive_provider_webhook_event(provider, body)
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn create_provider_query_job(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Json(body): Json<RtcProviderQueryJobCreateRequest>,
) -> Result<Json<RtcApiEnvelope<RtcProviderQueryJobRecord>>, RtcBackendHandlerError> {
    let result = service
        .create_provider_query_job(
            context.tenant_id,
            context.organization_id,
            context.actor_id,
            body,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn retrieve_provider_query_job(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_query_job_id): Path<String>,
) -> Result<Json<RtcApiEnvelope<RtcProviderQueryJobRecord>>, RtcBackendHandlerError> {
    let result = service
        .retrieve_provider_query_job(
            context.tenant_id,
            context.organization_id,
            provider_query_job_id,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

pub async fn list_provider_query_snapshots(
    State(service): State<Arc<dyn RtcBackendApiService>>,
    Extension(context): Extension<AppContext>,
    Path(provider_query_job_id): Path<String>,
    Query(query): Query<RtcBackendListQuery>,
) -> Result<Json<RtcApiEnvelope<RtcProviderQuerySnapshotListData>>, RtcBackendHandlerError> {
    let result = service
        .list_provider_query_snapshots(
            context.tenant_id,
            context.organization_id,
            provider_query_job_id,
            query.cursor,
            query.limit,
        )
        .await?;
    Ok(Json(RtcApiEnvelope::ok(result)))
}

#[derive(Debug)]
pub struct RtcBackendHandlerError(RtcBackendApiError);

impl From<RtcBackendApiError> for RtcBackendHandlerError {
    fn from(error: RtcBackendApiError) -> Self {
        Self(error)
    }
}

impl IntoResponse for RtcBackendHandlerError {
    fn into_response(self) -> Response {
        let status = self.0.status_code();
        (status, Json(RtcProblemEnvelope::from_error(&self.0))).into_response()
    }
}

fn list_request(context: &AppContext, query: RtcBackendListQuery) -> RtcBackendListRequest {
    RtcBackendListRequest {
        tenant_id: context.tenant_id.clone(),
        organization_id: context.organization_id.clone(),
        provider: query.provider,
        status: query.status,
        cursor: query.cursor,
        limit: query.limit,
    }
}

fn deterministic_request_id() -> String {
    "00000000-0000-0000-0000-000000000000".to_owned()
}
