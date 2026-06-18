use std::sync::Arc;

use axum::{
    Router, middleware,
    routing::{get, post},
};

use crate::{handlers, middleware::enforce_app_route_auth, service::RtcAppApiService};

pub fn build_sdkwork_rtc_app_api_router(service: Arc<dyn RtcAppApiService>) -> Router {
    Router::new()
        .route("/app/v3/api/rtc/rooms", get(handlers::list_rooms))
        .route(
            "/app/v3/api/rtc/rooms/{room_id}",
            get(handlers::retrieve_room),
        )
        .route(
            "/app/v3/api/rtc/provider_profiles/active",
            get(handlers::list_active_provider_profiles),
        )
        .route(
            "/app/v3/api/rtc/media_sessions",
            get(handlers::list_media_sessions).post(handlers::create_media_session),
        )
        .route(
            "/app/v3/api/rtc/media_sessions/{media_session_id}",
            get(handlers::retrieve_media_session),
        )
        .route(
            "/app/v3/api/rtc/media_sessions/{media_session_id}/completion_record",
            get(handlers::retrieve_media_session_completion_record),
        )
        .route(
            "/app/v3/api/rtc/media_sessions/{media_session_id}/participants/{participant_id}/credential",
            post(handlers::issue_participant_credential),
        )
        .route(
            "/app/v3/api/rtc/media_sessions/{media_session_id}/recording_artifacts",
            get(handlers::list_recording_artifacts),
        )
        .layer(middleware::from_fn(enforce_app_route_auth))
        .with_state(service)
}

#[cfg(test)]
mod tests {
    use std::{
        collections::BTreeSet,
        sync::{Arc, Mutex},
    };

    use axum::{
        Extension,
        body::Body,
        http::{Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use sdkwork_communication_rtc_service::{
        RtcActiveProviderProfile, RtcMediaArtifact, RtcMediaSession,
        RtcMediaSessionCompletionRecord, RtcParticipantCredential, RtcRoom, RtcRoomStatus,
    };
    use sdkwork_rtc_app_context::AppContext;
    use serde_json::Value as JsonValue;
    use tower::ServiceExt;

    use super::*;
    use crate::service::{
        RtcActiveProviderProfileListData, RtcAppApiError, RtcAppApiFuture, RtcAppListQuery,
        RtcCreateAppMediaSessionRequest, RtcIssueParticipantCredentialRequest, RtcListRequest,
        RtcMediaArtifactListData, RtcMediaSessionListData, RtcRoomListData,
    };

    #[tokio::test]
    async fn executable_router_delegates_active_provider_profile_list_to_service() {
        let service = Arc::new(FakeAppService::default());
        let router = build_sdkwork_rtc_app_api_router(service.clone()).layer(Extension(context()));

        let response = router
            .oneshot(
                Request::builder()
                    .uri("/app/v3/api/rtc/provider_profiles/active")
                    .body(Body::empty())
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
        assert_eq!(
            json["data"]["items"][0]["provider"],
            JsonValue::String("volcengine".to_owned())
        );
        assert_eq!(
            service.calls.lock().expect("calls lock").as_slice(),
            &["list_active_provider_profiles"]
        );
    }

    #[derive(Default)]
    struct FakeAppService {
        calls: Mutex<Vec<&'static str>>,
    }

    impl FakeAppService {
        fn record(&self, method: &'static str) {
            self.calls.lock().expect("calls lock").push(method);
        }
    }

    impl RtcAppApiService for FakeAppService {
        fn list_rooms(&self, _request: RtcListRequest) -> RtcAppApiFuture<RtcRoomListData> {
            self.record("list_rooms");
            Box::pin(async move {
                Ok(RtcRoomListData {
                    items: vec![],
                    next_cursor: None,
                })
            })
        }

        fn retrieve_room(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            room_id: String,
        ) -> RtcAppApiFuture<RtcRoom> {
            self.record("retrieve_room");
            Box::pin(async move {
                Ok(RtcRoom {
                    id: room_id,
                    tenant_id: "tenant-1".to_owned(),
                    organization_id: "org-1".to_owned(),
                    owner_user_id: "user-1".to_owned(),
                    title: "Room".to_owned(),
                    status: RtcRoomStatus::Active,
                })
            })
        }

        fn list_active_provider_profiles(
            &self,
            _request: RtcListRequest,
        ) -> RtcAppApiFuture<RtcActiveProviderProfileListData> {
            self.record("list_active_provider_profiles");
            Box::pin(async move {
                Ok(RtcActiveProviderProfileListData {
                    items: vec![RtcActiveProviderProfile {
                        id: "profile-volcengine".to_owned(),
                        provider: "volcengine".to_owned(),
                        code: "default".to_owned(),
                        name: "Volcengine default".to_owned(),
                        is_default: true,
                        priority: 0,
                        environment: "production".to_owned(),
                        region: Some("cn-beijing".to_owned()),
                        provider_app_id: Some("app-id".to_owned()),
                        endpoint: None,
                        capabilities:
                            sdkwork_communication_rtc_service::RtcProviderCapabilitySnapshot::commercial_default(),
                        health_status: sdkwork_communication_rtc_service::RtcProviderHealthStatus::Healthy,
                    }],
                    next_cursor: None,
                })
            })
        }

        fn list_media_sessions(
            &self,
            _request: RtcListRequest,
        ) -> RtcAppApiFuture<RtcMediaSessionListData> {
            self.record("list_media_sessions");
            Box::pin(async move {
                Ok(RtcMediaSessionListData {
                    items: vec![],
                    next_cursor: None,
                })
            })
        }

        fn create_media_session(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _user_id: String,
            _request: RtcCreateAppMediaSessionRequest,
        ) -> RtcAppApiFuture<RtcMediaSession> {
            self.record("create_media_session");
            Box::pin(async move { Err(RtcAppApiError::Unavailable("not configured".to_owned())) })
        }

        fn retrieve_media_session(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _media_session_id: String,
        ) -> RtcAppApiFuture<RtcMediaSession> {
            self.record("retrieve_media_session");
            Box::pin(async move { Err(RtcAppApiError::NotFound("missing".to_owned())) })
        }

        fn retrieve_media_session_completion_record(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _media_session_id: String,
        ) -> RtcAppApiFuture<RtcMediaSessionCompletionRecord> {
            self.record("retrieve_media_session_completion_record");
            Box::pin(async move { Err(RtcAppApiError::NotFound("missing".to_owned())) })
        }

        fn issue_participant_credential(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _user_id: String,
            _request: RtcIssueParticipantCredentialRequest,
        ) -> RtcAppApiFuture<RtcParticipantCredential> {
            self.record("issue_participant_credential");
            Box::pin(async move { Err(RtcAppApiError::Forbidden("forbidden".to_owned())) })
        }

        fn list_recording_artifacts(
            &self,
            _tenant_id: String,
            _organization_id: Option<String>,
            _media_session_id: String,
            _query: RtcAppListQuery,
        ) -> RtcAppApiFuture<RtcMediaArtifactListData> {
            self.record("list_recording_artifacts");
            Box::pin(async move {
                Ok(RtcMediaArtifactListData {
                    items: Vec::<RtcMediaArtifact>::new(),
                    next_cursor: None,
                })
            })
        }
    }

    fn context() -> AppContext {
        AppContext {
            tenant_id: "tenant-1".to_owned(),
            organization_id: Some("org-1".to_owned()),
            user_id: "user-1".to_owned(),
            session_id: Some("session-1".to_owned()),
            app_id: Some("app-1".to_owned()),
            environment: Some("test".to_owned()),
            deployment_mode: Some("local".to_owned()),
            auth_level: Some("user".to_owned()),
            data_scope: BTreeSet::from(["organization".to_owned()]),
            permission_scope: BTreeSet::from(["rtc.*".to_owned()]),
            actor_id: "user-1".to_owned(),
            actor_kind: "user".to_owned(),
            device_id: None,
        }
    }
}
