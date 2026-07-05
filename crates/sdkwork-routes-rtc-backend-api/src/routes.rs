use std::sync::Arc;

use axum::{
    Router,
    routing::{get, post, put},
};

use crate::{handlers, service::RtcBackendApiService};

pub fn build_sdkwork_rtc_backend_api_router(service: Arc<dyn RtcBackendApiService>) -> Router {
    Router::new()
        .route(
            "/backend/v3/api/rtc/rooms",
            get(handlers::list_rooms).post(handlers::create_room),
        )
        .route(
            "/backend/v3/api/rtc/rooms/{room_id}",
            get(handlers::retrieve_room),
        )
        .route(
            "/backend/v3/api/rtc/provider_accounts",
            get(handlers::list_provider_accounts).post(handlers::create_provider_account),
        )
        .route(
            "/backend/v3/api/rtc/provider_accounts/{provider_account_id}",
            get(handlers::retrieve_provider_account).patch(handlers::update_provider_account),
        )
        .route(
            "/backend/v3/api/rtc/provider_accounts/{provider_account_id}/disable",
            post(handlers::disable_provider_account),
        )
        .route(
            "/backend/v3/api/rtc/provider_accounts/{provider_account_id}/applications",
            get(handlers::list_provider_applications).post(handlers::create_provider_application),
        )
        .route(
            "/backend/v3/api/rtc/provider_applications/{provider_application_id}",
            get(handlers::retrieve_provider_application)
                .patch(handlers::update_provider_application),
        )
        .route(
            "/backend/v3/api/rtc/provider_applications/{provider_application_id}/disable",
            post(handlers::disable_provider_application),
        )
        .route(
            "/backend/v3/api/rtc/provider_applications/{provider_application_id}/credentials",
            get(handlers::list_provider_credentials).post(handlers::create_provider_credential),
        )
        .route(
            "/backend/v3/api/rtc/provider_credentials/{provider_credential_id}",
            get(handlers::retrieve_provider_credential).patch(handlers::update_provider_credential),
        )
        .route(
            "/backend/v3/api/rtc/provider_credentials/{provider_credential_id}/revoke",
            post(handlers::revoke_provider_credential),
        )
        .route(
            "/backend/v3/api/rtc/provider_profiles",
            get(handlers::list_provider_profiles).post(handlers::create_provider_profile),
        )
        .route(
            "/backend/v3/api/rtc/provider_profiles/{provider_profile_id}",
            get(handlers::retrieve_provider_profile).patch(handlers::update_provider_profile),
        )
        .route(
            "/backend/v3/api/rtc/provider_profiles/{provider_profile_id}/disable",
            post(handlers::disable_provider_profile),
        )
        .route(
            "/backend/v3/api/rtc/provider_profiles/{provider_profile_id}/verify",
            post(handlers::verify_provider_profile),
        )
        .route(
            "/backend/v3/api/rtc/provider_routes",
            get(handlers::list_provider_routes).post(handlers::create_provider_route),
        )
        .route(
            "/backend/v3/api/rtc/provider_routes/{provider_route_id}",
            get(handlers::retrieve_provider_route).patch(handlers::update_provider_route),
        )
        .route(
            "/backend/v3/api/rtc/provider_routes/{provider_route_id}/disable",
            post(handlers::disable_provider_route),
        )
        .route(
            "/backend/v3/api/rtc/media_sessions",
            get(handlers::list_media_sessions),
        )
        .route(
            "/backend/v3/api/rtc/media_sessions/{media_session_id}",
            get(handlers::retrieve_media_session),
        )
        .route(
            "/backend/v3/api/rtc/media_sessions/{media_session_id}/completion_record",
            get(handlers::retrieve_media_session_completion_record),
        )
        .route(
            "/backend/v3/api/rtc/media_sessions/{media_session_id}/close",
            post(handlers::close_media_session),
        )
        .route(
            "/backend/v3/api/rtc/media_artifacts",
            get(handlers::list_media_artifacts),
        )
        .route(
            "/backend/v3/api/rtc/media_artifacts/{media_artifact_id}",
            get(handlers::retrieve_media_artifact),
        )
        .route(
            "/backend/v3/api/rtc/quality_samples",
            get(handlers::list_quality_samples),
        )
        .route(
            "/backend/v3/api/rtc/provider_webhooks/events",
            get(handlers::list_provider_webhook_events),
        )
        .route(
            "/backend/v3/api/rtc/provider_webhooks/{provider}/events",
            post(handlers::receive_provider_webhook_event),
        )
        .route(
            "/backend/v3/api/rtc/provider_query_jobs",
            post(handlers::create_provider_query_job),
        )
        .route(
            "/backend/v3/api/rtc/provider_query_jobs/{provider_query_job_id}",
            get(handlers::retrieve_provider_query_job),
        )
        .route(
            "/backend/v3/api/rtc/provider_query_jobs/{provider_query_job_id}/snapshots",
            get(handlers::list_provider_query_snapshots),
        )
        .route(
            "/backend/v3/api/rtc/provider_schemas",
            get(handlers::list_provider_config_schemas),
        )
        .route(
            "/backend/v3/api/rtc/provider_schemas/{provider}",
            get(handlers::get_provider_config_schema),
        )
        .route(
            "/backend/v3/api/rtc/provider_plugins",
            get(handlers::list_provider_plugins),
        )
        .route(
            "/backend/v3/api/rtc/provider_plugins/{provider}",
            get(handlers::get_provider_plugin),
        )
        .route(
            "/backend/v3/api/rtc/provider_profiles/{provider_profile_id}/capabilities",
            put(handlers::configure_provider_capabilities),
        )
        .with_state(service)
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};

    use axum::{
        Extension,
        body::Body,
        http::{Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use sdkwork_communication_rtc_service::{
        RtcMediaArtifact, RtcMediaSession, RtcMediaSessionCompletionRecord, RtcProviderAccount,
        RtcProviderAccountCommand, RtcProviderAccountDisableRequest, RtcProviderApplication,
        RtcProviderApplicationCommand, RtcProviderApplicationDisableRequest, RtcProviderCredential,
        RtcProviderCredentialCommand, RtcProviderCredentialRevokeRequest, RtcProviderEventKind,
        RtcProviderProfile, RtcProviderProfileCommand, RtcProviderProfileDisableRequest,
        RtcProviderProfileVerifyRequest, RtcProviderProfileVerifyResult, RtcProviderQueryJobRecord,
        RtcProviderQuerySnapshotRecord, RtcProviderWebhookEventRecord, RtcQualitySample, RtcRoom,
    };
    use sdkwork_web_core::{
        ServerRequestId, WebApiSurface, WebAuthMode, WebRequestContext, WebTransportFacts,
    };
    use serde_json::{Value as JsonValue, json};
    use tower::ServiceExt;

    use super::*;
    use crate::service::{
        RtcBackendApiError, RtcBackendApiFuture, RtcBackendApiService, RtcBackendListQuery,
        RtcBackendListRequest, RtcCloseMediaSessionRequest, RtcListData,
        RtcProviderQueryJobCreateRequest, RtcProviderRoute, RtcProviderRouteCommand,
        RtcProviderRouteDisableRequest, RtcProviderWebhookIngress,
    };

    #[tokio::test]
    async fn executable_router_delegates_provider_webhook_receive_to_service() {
        let service = Arc::new(FakeBackendService::default());
        let router =
            build_sdkwork_rtc_backend_api_router(service.clone()).layer(Extension(web_context()));

        let response = router
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/backend/v3/api/rtc/provider_webhooks/volcengine/events")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        json!({
                            "providerProfileId": "profile-volcengine",
                            "eventType": "RoomEnd",
                            "payload": { "EventType": "RoomEnd" },
                            "headers": { "X-Volc-Signature": "signature" }
                        })
                        .to_string(),
                    ))
                    .expect("request should build"),
            )
            .await
            .expect("router should respond");

        assert_eq!(response.status(), StatusCode::OK);
        let body = response
            .into_body()
            .collect()
            .await
            .expect("body should collect")
            .to_bytes();
        let json: JsonValue = serde_json::from_slice(&body).expect("body should be json");

        assert_eq!(json["code"], "ok");
        assert_eq!(json["data"]["provider"], "volcengine");
        assert_eq!(
            service.calls.lock().expect("calls lock").as_slice(),
            &["receive_provider_webhook_event"]
        );
    }

    #[derive(Default)]
    struct FakeBackendService {
        calls: Mutex<Vec<&'static str>>,
    }

    impl FakeBackendService {
        fn record(&self, method: &'static str) {
            self.calls.lock().expect("calls lock").push(method);
        }

        fn unavailable<T>() -> RtcBackendApiFuture<T> {
            Box::pin(async move { Err(RtcBackendApiError::Unavailable("not configured".into())) })
        }
    }

    impl RtcBackendApiService for FakeBackendService {
        fn list_rooms(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcRoom>> {
            self.record("list_rooms");
            Self::unavailable()
        }

        fn retrieve_room(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _room_id: String,
        ) -> RtcBackendApiFuture<RtcRoom> {
            self.record("retrieve_room");
            Self::unavailable()
        }

        fn list_provider_accounts(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcProviderAccount>> {
            self.record("list_provider_accounts");
            Self::unavailable()
        }

        fn create_provider_account(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _request: RtcProviderAccountCommand,
        ) -> RtcBackendApiFuture<RtcProviderAccount> {
            self.record("create_provider_account");
            Self::unavailable()
        }

        fn retrieve_provider_account(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_account_id: String,
        ) -> RtcBackendApiFuture<RtcProviderAccount> {
            self.record("retrieve_provider_account");
            Self::unavailable()
        }

        fn update_provider_account(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_account_id: String,
            _request: RtcProviderAccountCommand,
        ) -> RtcBackendApiFuture<RtcProviderAccount> {
            self.record("update_provider_account");
            Self::unavailable()
        }

        fn disable_provider_account(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_account_id: String,
            _request: RtcProviderAccountDisableRequest,
        ) -> RtcBackendApiFuture<RtcProviderAccount> {
            self.record("disable_provider_account");
            Self::unavailable()
        }

        fn list_provider_applications(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_account_id: String,
            _query: RtcBackendListQuery,
        ) -> RtcBackendApiFuture<RtcListData<RtcProviderApplication>> {
            self.record("list_provider_applications");
            Self::unavailable()
        }

        fn create_provider_application(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_account_id: String,
            _request: RtcProviderApplicationCommand,
        ) -> RtcBackendApiFuture<RtcProviderApplication> {
            self.record("create_provider_application");
            Self::unavailable()
        }

        fn retrieve_provider_application(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_application_id: String,
        ) -> RtcBackendApiFuture<RtcProviderApplication> {
            self.record("retrieve_provider_application");
            Self::unavailable()
        }

        fn update_provider_application(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_application_id: String,
            _request: RtcProviderApplicationCommand,
        ) -> RtcBackendApiFuture<RtcProviderApplication> {
            self.record("update_provider_application");
            Self::unavailable()
        }

        fn disable_provider_application(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_application_id: String,
            _request: RtcProviderApplicationDisableRequest,
        ) -> RtcBackendApiFuture<RtcProviderApplication> {
            self.record("disable_provider_application");
            Self::unavailable()
        }

        fn list_provider_credentials(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_application_id: String,
            _query: RtcBackendListQuery,
        ) -> RtcBackendApiFuture<RtcListData<RtcProviderCredential>> {
            self.record("list_provider_credentials");
            Self::unavailable()
        }

        fn create_provider_credential(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_application_id: String,
            _request: RtcProviderCredentialCommand,
        ) -> RtcBackendApiFuture<RtcProviderCredential> {
            self.record("create_provider_credential");
            Self::unavailable()
        }

        fn retrieve_provider_credential(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_credential_id: String,
        ) -> RtcBackendApiFuture<RtcProviderCredential> {
            self.record("retrieve_provider_credential");
            Self::unavailable()
        }

        fn update_provider_credential(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_credential_id: String,
            _request: RtcProviderCredentialCommand,
        ) -> RtcBackendApiFuture<RtcProviderCredential> {
            self.record("update_provider_credential");
            Self::unavailable()
        }

        fn revoke_provider_credential(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_credential_id: String,
            _request: RtcProviderCredentialRevokeRequest,
        ) -> RtcBackendApiFuture<RtcProviderCredential> {
            self.record("revoke_provider_credential");
            Self::unavailable()
        }

        fn list_provider_profiles(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcProviderProfile>> {
            self.record("list_provider_profiles");
            Self::unavailable()
        }

        fn create_provider_profile(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _request: RtcProviderProfileCommand,
        ) -> RtcBackendApiFuture<RtcProviderProfile> {
            self.record("create_provider_profile");
            Self::unavailable()
        }

        fn retrieve_provider_profile(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_profile_id: String,
        ) -> RtcBackendApiFuture<RtcProviderProfile> {
            self.record("retrieve_provider_profile");
            Self::unavailable()
        }

        fn update_provider_profile(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_profile_id: String,
            _request: RtcProviderProfileCommand,
        ) -> RtcBackendApiFuture<RtcProviderProfile> {
            self.record("update_provider_profile");
            Self::unavailable()
        }

        fn disable_provider_profile(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_profile_id: String,
            _request: RtcProviderProfileDisableRequest,
        ) -> RtcBackendApiFuture<RtcProviderProfile> {
            self.record("disable_provider_profile");
            Self::unavailable()
        }

        fn verify_provider_profile(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_profile_id: String,
            _request: RtcProviderProfileVerifyRequest,
        ) -> RtcBackendApiFuture<RtcProviderProfileVerifyResult> {
            self.record("verify_provider_profile");
            Self::unavailable()
        }

        fn list_provider_routes(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcProviderRoute>> {
            self.record("list_provider_routes");
            Self::unavailable()
        }

        fn create_provider_route(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _request: RtcProviderRouteCommand,
        ) -> RtcBackendApiFuture<RtcProviderRoute> {
            self.record("create_provider_route");
            Self::unavailable()
        }

        fn retrieve_provider_route(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_route_id: String,
        ) -> RtcBackendApiFuture<RtcProviderRoute> {
            self.record("retrieve_provider_route");
            Self::unavailable()
        }

        fn update_provider_route(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_route_id: String,
            _request: RtcProviderRouteCommand,
        ) -> RtcBackendApiFuture<RtcProviderRoute> {
            self.record("update_provider_route");
            Self::unavailable()
        }

        fn disable_provider_route(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_route_id: String,
            _request: RtcProviderRouteDisableRequest,
        ) -> RtcBackendApiFuture<RtcProviderRoute> {
            self.record("disable_provider_route");
            Self::unavailable()
        }

        fn list_media_sessions(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcMediaSession>> {
            self.record("list_media_sessions");
            Self::unavailable()
        }

        fn retrieve_media_session(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _media_session_id: String,
        ) -> RtcBackendApiFuture<RtcMediaSession> {
            self.record("retrieve_media_session");
            Self::unavailable()
        }

        fn retrieve_media_session_completion_record(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _media_session_id: String,
        ) -> RtcBackendApiFuture<RtcMediaSessionCompletionRecord> {
            self.record("retrieve_media_session_completion_record");
            Self::unavailable()
        }

        fn close_media_session(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _media_session_id: String,
            _request: RtcCloseMediaSessionRequest,
        ) -> RtcBackendApiFuture<RtcMediaSession> {
            self.record("close_media_session");
            Self::unavailable()
        }

        fn list_media_artifacts(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcMediaArtifact>> {
            self.record("list_media_artifacts");
            Self::unavailable()
        }

        fn retrieve_media_artifact(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _media_artifact_id: String,
        ) -> RtcBackendApiFuture<RtcMediaArtifact> {
            self.record("retrieve_media_artifact");
            Self::unavailable()
        }

        fn list_quality_samples(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcQualitySample>> {
            self.record("list_quality_samples");
            Self::unavailable()
        }

        fn list_provider_webhook_events(
            &self,
            _request: RtcBackendListRequest,
        ) -> RtcBackendApiFuture<RtcListData<RtcProviderWebhookEventRecord>> {
            self.record("list_provider_webhook_events");
            Self::unavailable()
        }

        fn receive_provider_webhook_event(
            &self,
            provider: String,
            _ingress: RtcProviderWebhookIngress,
        ) -> RtcBackendApiFuture<RtcProviderWebhookEventRecord> {
            self.record("receive_provider_webhook_event");
            Box::pin(async move {
                Ok(RtcProviderWebhookEventRecord {
                    id: "webhook-event-1".into(),
                    tenant_id: "100001".into(),
                    organization_id: "org-1".into(),
                    provider,
                    provider_profile_id: Some("profile-volcengine".into()),
                    external_event_id: Some("event-1".into()),
                    event_type: "RoomEnd".into(),
                    event_kind: RtcProviderEventKind::RoomEnded,
                    room_id: Some("room-1".into()),
                    media_session_id: Some("media-session-1".into()),
                    participant_id: None,
                    recording_id: Some("recording-1".into()),
                    payload_hash: "fnv64:webhook".into(),
                    raw_payload: json!({ "EventType": "RoomEnd" }),
                    normalized_event: json!({ "eventKind": "room_ended" }),
                    signature_header: Some("signature".into()),
                    received_at: "2026-06-10T00:00:00.000Z".into(),
                    processed_at: None,
                    status: "received".into(),
                })
            })
        }

        fn create_provider_query_job(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _request: RtcProviderQueryJobCreateRequest,
        ) -> RtcBackendApiFuture<RtcProviderQueryJobRecord> {
            self.record("create_provider_query_job");
            Self::unavailable()
        }

        fn retrieve_provider_query_job(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_query_job_id: String,
        ) -> RtcBackendApiFuture<RtcProviderQueryJobRecord> {
            self.record("retrieve_provider_query_job");
            Self::unavailable()
        }

        fn list_provider_query_snapshots(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _provider_query_job_id: String,
            _query: RtcBackendListQuery,
        ) -> RtcBackendApiFuture<RtcListData<RtcProviderQuerySnapshotRecord>> {
            self.record("list_provider_query_snapshots");
            Self::unavailable()
        }

        fn list_provider_config_schemas(
            &self,
        ) -> RtcBackendApiFuture<Vec<sdkwork_communication_rtc_service::ProviderConfigSchema>>
        {
            self.record("list_provider_config_schemas");
            Self::unavailable()
        }

        fn get_provider_config_schema(
            &self,
            _provider: String,
        ) -> RtcBackendApiFuture<sdkwork_communication_rtc_service::ProviderConfigSchema> {
            self.record("get_provider_config_schema");
            Self::unavailable()
        }

        fn list_provider_plugins(
            &self,
        ) -> RtcBackendApiFuture<Vec<sdkwork_communication_rtc_service::ProviderPluginDescriptor>>
        {
            self.record("list_provider_plugins");
            Self::unavailable()
        }

        fn get_provider_plugin(
            &self,
            _provider: String,
        ) -> RtcBackendApiFuture<sdkwork_communication_rtc_service::ProviderPluginDescriptor>
        {
            self.record("get_provider_plugin");
            Self::unavailable()
        }

        fn configure_provider_capabilities(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _actor_id: String,
            _provider_profile_id: String,
            _request: crate::service::RtcProviderCapabilityConfig,
        ) -> RtcBackendApiFuture<sdkwork_communication_rtc_service::RtcProviderProfile> {
            self.record("configure_provider_capabilities");
            Self::unavailable()
        }
    }

    fn web_context() -> WebRequestContext {
        WebRequestContext {
            request_id: ServerRequestId("test-request-id".to_owned()),
            api_surface: WebApiSurface::BackendApi,
            auth_mode: WebAuthMode::DualToken,
            transport: WebTransportFacts {
                path: "/backend/v3/api/rtc/provider_webhooks/volcengine/events".to_owned(),
                method: "POST".to_owned(),
                auth_token_present: false,
                access_token_present: false,
                api_key_present: false,
                oauth_bearer_present: false,
                agent_token_present: false,
            },
            principal: None,
            locale: None,
            client_kind: None,
            operation: None,
            trace_id: None,
        }
    }
}
