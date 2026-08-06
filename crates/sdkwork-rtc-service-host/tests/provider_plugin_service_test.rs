use std::{
    sync::{Arc, Mutex, OnceLock},
    time::Duration,
};

fn reconcile_env_lock() -> std::sync::MutexGuard<'static, ()> {
    static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(()))
        .lock()
        .expect("reconcile env lock")
}

use sdkwork_communication_rtc_service::{
    ProviderDomain, ProviderHealthSnapshot, ProviderPluginDescriptor, RtcActiveProviderProfileListPage,
    RtcContractError, RtcCreateMediaSessionRequest, RtcMediaArtifact, RtcMediaArtifactListPage,
    RtcMediaSession, RtcMediaSessionEndSource, RtcMediaSessionIdempotencyClaim,
    RtcMediaSessionIdempotencyRecord, RtcMediaSessionListPage, RtcMediaSessionMode,
    RtcMediaSessionStatus, RtcParticipantCredential, RtcPersistenceChangeSet, RtcPersistenceFuture,
    RtcPersistencePort, RtcProviderAccountCommand, RtcProviderAccountDisableRequest,
    RtcProviderAccountListPage,     RtcProviderApplicationCommand, RtcProviderApplicationDisableRequest,
    RtcProviderApplicationListPage, RtcProviderApplication,     RtcProviderCredentialCommand, RtcProviderCredentialListPage, RtcProviderCredentialRevokeRequest,
    RtcProviderCredentialRole, RtcProviderCredentialStatus, RtcProviderCredential,
    RtcProviderEventKind, RtcProviderPluginFactory, RtcProviderPort, RtcProviderProfileListPage,
    RtcProviderQueryKind, RtcProviderQueryRequest, RtcProviderQueryResult,
    RtcProviderQuerySnapshotListPage, RtcProviderRouteListPage, RtcProviderWebhookEvent,
    RtcProviderWebhookEventRecord, RtcProviderWebhookEventListPage, RtcProviderWebhookParseRequest,
    RtcProviderWebhookVerifyRequest, RtcQualitySampleListPage, RtcRecordingArtifact,
    RtcRecordingArtifactExportRequest, RtcRecordingArtifactsFuture, RtcRecordingLifecycleReconcileQuery,
    RtcRoom, RtcRoomListPage, RtcRoomScopeQuery, RtcScopedListQuery, RtcListWindowParams,
    RtcListPage, RtcListWindowError, apply_list_window,
    RtcRuntimeLoadRequest, RtcSessionHandle, RtcSessionTokenGrantStatus,
    RtcStaleMediaSessionReconcileCandidates, RtcStaleMediaSessionReconcileQuery,
    RtcTenantOrganizationScope, hash_participant_credential_token,
    verify_hmac_sha256_payload,
};
use sdkwork_routes_rtc_app_api::service::{
    RtcAppApiError, RtcAppApiService, RtcAppListQuery, RtcCreateAppMediaSessionRequest,
    RtcIssueParticipantCredentialRequest, RtcListRequest,
};
use sdkwork_routes_rtc_backend_api::service::{
    RtcBackendApiError, RtcBackendApiService, RtcBackendListQuery, RtcBackendListRequest,
    RtcProviderQueryJobCreateRequest, RtcProviderRouteCommand, RtcProviderRouteDisableRequest,
    RtcProviderWebhookIngress, RtcProviderWebhookReceiveRequest,
};
use sdkwork_rtc_service_host::{
    MapRtcSecretResolver, RtcProductService, RtcProviderPluginRegistry, RtcSessionReconcileResult,
};

fn test_rtc_service(registry: RtcProviderPluginRegistry) -> RtcProductService {
    RtcProductService::new(registry)
        .with_secret_resolver(Arc::new(MapRtcSecretResolver::test_defaults()))
}

#[tokio::test]
async fn product_registry_registers_provider_plugins_through_standard_factory_spi() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider_factory(Arc::new(FakeProviderFactory::new("acme", true)))
        .expect("provider factory should register")
        .with_provider_factory(Arc::new(FakeProviderFactory::new("backup", false)))
        .expect("backup provider factory should register");

    assert_eq!(registry.default_provider_key(), Some("acme"));
    assert_eq!(
        registry
            .descriptors()
            .iter()
            .map(|descriptor| descriptor.provider_kind.as_str())
            .collect::<Vec<_>>(),
        vec!["acme", "backup"]
    );

    let provider = registry
        .provider("acme")
        .expect("factory-created provider should be retrievable");
    assert_eq!(provider.descriptor().plugin_id, "rtc-acme");

    let service = test_rtc_service(registry).seed_default_room("600", "601", "602");
    let session = service
        .create_media_session(
            "600".into(),
            Some("601".into()),
            "602".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "factory-plugin-spi" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created through factory-created provider");

    assert_eq!(
        session.provider_session_id.as_deref(),
        Some(format!("acme:{}", session.id).as_str())
    );
    assert_eq!(
        session.provider_profile_id.as_deref(),
        Some("profile-600-601-acme-default")
    );
}

#[tokio::test]
async fn product_service_create_media_session_honors_idempotency_key() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("610", "611", "612");
    let request = RtcCreateAppMediaSessionRequest {
        room_id: "room-default".into(),
        media_mode: RtcMediaSessionMode::Video,
        provider_profile_id: None,
        provider: None,
        region: None,
        recording_requested: false,
        metadata: serde_json::json!({}),
        idempotency_key: Some("create-session-once".into()),
    };
    let first = service
        .create_media_session(
            "610".into(),
            Some("611".into()),
            "612".into(),
            request.clone(),
        )
        .await
        .expect("first create should succeed");
    let second = service
        .create_media_session("610".into(), Some("611".into()), "612".into(), request)
        .await
        .expect("idempotent create should return existing session");
    assert_eq!(first.id, second.id);
    assert_eq!(
        second.provider_session_id.as_deref(),
        Some(format!("acme:{}", second.id).as_str())
    );
}

#[tokio::test]
async fn product_service_rejects_idempotent_create_replay_with_payload_mismatch() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("620", "621", "622");
    let request = RtcCreateAppMediaSessionRequest {
        room_id: "room-default".into(),
        media_mode: RtcMediaSessionMode::Video,
        provider_profile_id: None,
        provider: None,
        region: None,
        recording_requested: false,
        metadata: serde_json::json!({}),
        idempotency_key: Some("create-session-fixed".into()),
    };
    service
        .create_media_session(
            "620".into(),
            Some("621".into()),
            "622".into(),
            request.clone(),
        )
        .await
        .expect("first create should succeed");
    let mut mismatched_request = request;
    mismatched_request.media_mode = RtcMediaSessionMode::Audio;
    let error = service
        .create_media_session(
            "620".into(),
            Some("621".into()),
            "622".into(),
            mismatched_request,
        )
        .await
        .expect_err("payload mismatch should reject idempotent replay");
    assert!(
        matches!(error, RtcAppApiError::Conflict(_)),
        "expected conflict, got {error:?}"
    );
}

#[tokio::test]
async fn product_service_runs_rtc_flows_through_registered_provider_plugins() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = test_rtc_service(registry).seed_default_room("900", "901", "902");

    let active_profiles = service
        .list_active_provider_profiles(RtcListRequest {
            tenant_id: "900".into(),
            organization_id: Some("901".into()),
            status: None,
            owner_user_id: None,
            created_after: None,
            page: None,
            page_size: None,
            cursor: None,
            
            q: None,
            sort: None,
        })
        .await
        .expect("active provider profiles should list");
    assert_eq!(
        active_profiles
            .items
            .iter()
            .map(|profile| profile.provider.as_str())
            .collect::<Vec<_>>(),
        vec!["acme", "backup"]
    );
    assert!(
        active_profiles.items[0].is_default,
        "default provider should be selected from the plugin descriptor"
    );

    let session = service
        .create_media_session(
            "900".into(),
            Some("901".into()),
            "902".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "provider-plugin-contract" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created through default provider");
    assert_eq!(
        session.provider_profile_id.as_deref(),
        Some("profile-900-901-acme-default")
    );
    assert_eq!(
        session.provider_session_id.as_deref(),
        Some(format!("acme:{}", session.id).as_str())
    );
    assert_eq!(session.media_mode, RtcMediaSessionMode::Video);

    let credential = service
        .issue_participant_credential(
            "900".into(),
            Some("901".into()),
            "902".into(),
            RtcIssueParticipantCredentialRequest {
                media_session_id: session.id.clone(),
                participant_id: "participant-300".into(),
                idempotency_key: None,
            },
        )
        .await
        .expect("participant credential should be issued through selected provider");
    assert_eq!(
        credential.credential,
        format!("acme-token:900:{}:participant-300", session.id)
    );

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
            RtcProviderWebhookIngress::from_wrapped_test_request(
                RtcProviderWebhookReceiveRequest {
                    provider_profile_id: Some("profile-900-901-acme-default".into()),
                    external_event_id: None,
                    event_type: None,
                    received_at: Some("2026-06-10T00:00:00.000Z".into()),
                    headers: serde_json::json!({ "X-Acme-Signature": "sig-1" }),
                    payload: serde_json::json!({
                        "eventType": "room_ended",
                        "eventId": "evt-1",
                        "roomId": "room-default",
                        "sessionId": session.id,
                        "recordingId": "recording-1"
                    }),
                },
            ),
        )
        .await
        .expect("provider webhook should be parsed and recorded through provider plugin");
    assert_eq!(webhook_record.provider, "acme");
    assert_eq!(webhook_record.event_kind, RtcProviderEventKind::RoomEnded);
    assert_eq!(
        webhook_record.media_session_id.as_deref(),
        Some(session.id.as_str())
    );
    assert_eq!(
        webhook_record.provider_profile_id.as_deref(),
        Some("profile-900-901-acme-default")
    );
    assert_eq!(webhook_record.tenant_id, "900");
    assert_eq!(webhook_record.organization_id, "901");

    let query_job = service
        .create_provider_query_job(
            "900".into(),
            Some("901".into()),
            "902".into(),
            RtcProviderQueryJobCreateRequest {
                provider: "acme".into(),
                provider_profile_id: Some("profile-900-901-acme-default".into()),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: Some("room-default".into()),
                media_session_id: Some(session.id.clone()),
                provider_session_id: session.provider_session_id.clone(),
                cursor: None,
            },
        )
        .await
        .expect("provider active query should execute through provider plugin");
    assert_eq!(query_job.provider, "acme");
    assert_eq!(
        query_job.query_kind,
        RtcProviderQueryKind::RecordingArtifacts
    );
    assert_eq!(query_job.target_id, format!("acme:{}", session.id));

    let artifacts = service
        .list_recording_artifacts(
            "900".into(),
            Some("901".into()),
            session.id.clone(),
            RtcAppListQuery::default(),
        )
        .await
        .expect("recording artifacts should list");
    assert_eq!(artifacts.items.len(), 1);
    assert_eq!(artifacts.items[0].drive.space_type.as_str(), "rtc");
    assert_eq!(
        artifacts.items[0].source_provider_query_job_id.as_deref(),
        Some(query_job.id.as_str())
    );

    let closed = service
        .close_media_session(
            "900".into(),
            Some("901".into()),
            "902".into(),
            session.id.clone(),
            sdkwork_routes_rtc_backend_api::service::RtcCloseMediaSessionRequest {
                reason: Some("host_closed".into()),
            },
        )
        .await
        .expect("media session should close through provider plugin");
    assert_eq!(
        closed.status,
        sdkwork_communication_rtc_service::RtcMediaSessionStatus::Ended
    );
    assert_eq!(
        closed.completion_recorded_at.as_deref(),
        closed.ended_at.as_deref()
    );

    let completion = RtcAppApiService::retrieve_media_session_completion_record(
        &service,
        "900".into(),
        Some("901".into()),
        session.id,
    )
    .await
    .expect("completion record should be generated and available after close");
    assert_eq!(completion.recording_summary.drive_resource_count, 1);
    assert_eq!(
        completion.source_provider_query_job_id.as_deref(),
        Some(query_job.id.as_str())
    );
}

#[tokio::test]
async fn product_service_media_call_flow_persists_session_token_grants_on_credential_issue() {
    let persistence = Arc::new(RecordingPersistence::default());
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry)
        .seed_default_room("910", "911", "912")
        .with_persistence(persistence.clone());

    let session = service
        .create_media_session(
            "910".into(),
            Some("911".into()),
            "912".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "media-call-flow" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created");

    let credential = service
        .issue_participant_credential(
            "910".into(),
            Some("911".into()),
            "912".into(),
            RtcIssueParticipantCredentialRequest {
                media_session_id: session.id.clone(),
                participant_id: "participant-310".into(),
                idempotency_key: None,
            },
        )
        .await
        .expect("participant credential should be issued");

    let grants = persistence
        .batches()
        .into_iter()
        .flat_map(|batch| batch.session_token_grants)
        .collect::<Vec<_>>();
    assert_eq!(grants.len(), 1);
    assert_eq!(grants[0].session_id, session.id);
    assert_eq!(grants[0].participant_id, "participant-310");
    assert_eq!(grants[0].scope, "rtc.join");
    assert_eq!(grants[0].status, RtcSessionTokenGrantStatus::Active);
    assert_eq!(
        grants[0].token_hash,
        hash_participant_credential_token(credential.credential.as_str())
    );
}

#[tokio::test]
async fn product_service_exports_recordings_with_drive_import_context() {
    let export_request = Arc::new(Mutex::new(None));
    let provider = ContextRecordingProvider::new("acme", export_request.clone());
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(provider))
        .expect("context provider should register");
    let service = test_rtc_service(registry).seed_default_room("960", "961", "962");

    let session = service
        .create_media_session(
            "960".into(),
            Some("961".into()),
            "962".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "drive-import-context" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created");

    let query_job = service
        .create_provider_query_job(
            "960".into(),
            Some("961".into()),
            "962".into(),
            RtcProviderQueryJobCreateRequest {
                provider: "acme".into(),
                provider_profile_id: session.provider_profile_id.clone(),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: Some("room-default".into()),
                media_session_id: Some(session.id.clone()),
                provider_session_id: session.provider_session_id.clone(),
                cursor: None,
            },
        )
        .await
        .expect("recording query should export through the contextual Drive import boundary");
    assert_eq!(query_job.provider, "acme");

    let captured = export_request
        .lock()
        .expect("export request lock")
        .clone()
        .expect("recording export request should be captured");
    assert_eq!(captured.tenant_id, "960");
    assert_eq!(captured.organization_id.as_deref(), Some("961"));
    assert_eq!(captured.owner_user_id.as_deref(), Some("962"));
    assert_eq!(captured.rtc_session_id, session.id);
    assert_eq!(
        captured.provider_profile_id.as_deref(),
        Some("profile-960-961-acme-default")
    );
    assert_eq!(
        captured.provider_session_id.as_deref(),
        Some(format!("acme:{}", session.id).as_str())
    );
    assert!(
        captured
            .provider_snapshot_json
            .as_deref()
            .is_some_and(|snapshot| snapshot.contains("recordingArtifacts")),
        "provider query snapshot should be available to the Drive import boundary"
    );

    let session_id = session.id.clone();
    let artifacts = service
        .list_recording_artifacts(
            "960".into(),
            Some("961".into()),
            session_id.clone(),
            RtcAppListQuery::default(),
        )
        .await
        .expect("recording artifacts should list after contextual export");
    assert_eq!(artifacts.items.len(), 1);
    assert_eq!(
        artifacts.items[0].drive.drive_uri,
        format!(
            "drive://spaces/space-rtc-recordings/nodes/node-context-{}",
            session_id
        )
    );
    assert_eq!(
        artifacts.items[0].source_provider_query_job_id.as_deref(),
        Some(query_job.id.as_str())
    );
}

#[tokio::test]
async fn product_service_selects_only_active_provider_profiles_within_current_scope() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = test_rtc_service(registry).seed_default_room("910", "911", "912");

    let acme_default = provider_profile_command("acme", "default", true, 10);
    let backup_default = provider_profile_command("backup", "default", true, 5);

    service
        .create_provider_profile(
            "910".into(),
            Some("911".into()),
            "912".into(),
            acme_default.clone(),
        )
        .await
        .expect("scoped acme provider profile should be created");
    service
        .create_provider_profile(
            "910".into(),
            Some("other-organization".into()),
            "912".into(),
            backup_default.clone(),
        )
        .await
        .expect("same tenant may have an organization-specific backup profile");

    let selected = service
        .create_media_session(
            "910".into(),
            Some("911".into()),
            "912".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: None,
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "scoped-default-provider-selection" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should use the default profile scoped to the room organization");
    assert_eq!(
        selected.provider_profile_id.as_deref(),
        Some("profile-910-911-acme-default")
    );
    assert_eq!(
        selected.provider_session_id.as_deref(),
        Some(format!("acme:{}", selected.id).as_str())
    );

    service
        .disable_provider_profile(
            "910".into(),
            Some("911".into()),
            "912".into(),
            "profile-910-911-acme-default".into(),
            sdkwork_communication_rtc_service::RtcProviderProfileDisableRequest {
                reason: Some("tenant disabled this account".into()),
            },
        )
        .await
        .expect("provider profile should disable");

    let disabled_selection = service
        .create_media_session(
            "910".into(),
            Some("911".into()),
            "912".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: Some("profile-910-911-acme-default".into()),
                provider: None,
                region: None,
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "disabled-provider-profile" }),
                idempotency_key: None,
            },
        )
        .await;
    assert!(
        matches!(
            disabled_selection,
            Err(sdkwork_routes_rtc_app_api::service::RtcAppApiError::Unavailable(_))
        ),
        "disabled RTC provider profiles must not be selectable by app clients"
    );

    let wrong_scope_selection = service
        .create_media_session(
            "910".into(),
            Some("911".into()),
            "912".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: Some("profile-910-other-organization-backup-default".into()),
                provider: None,
                region: None,
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "wrong-scope-provider-profile" }),
                idempotency_key: None,
            },
        )
        .await;
    assert!(
        matches!(
            wrong_scope_selection,
            Err(sdkwork_routes_rtc_app_api::service::RtcAppApiError::NotFound(_))
        ),
        "provider profiles from another organization must not be selectable"
    );
}

#[tokio::test]
async fn product_service_selects_provider_profile_from_active_region_route() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = test_rtc_service(registry).seed_default_room("920", "921", "922");

    service
        .create_provider_profile(
            "920".into(),
            Some("921".into()),
            "922".into(),
            provider_profile_command("acme", "default", true, 10),
        )
        .await
        .expect("default provider profile should be created");
    service
        .create_provider_profile(
            "920".into(),
            Some("921".into()),
            "922".into(),
            provider_profile_command("backup", "east", false, 1),
        )
        .await
        .expect("regional backup provider profile should be created");
    service
        .create_provider_route(
            "920".into(),
            Some("921".into()),
            "922".into(),
            RtcProviderRouteCommand {
                provider_profile_id: "profile-920-921-backup-east".into(),
                route_type: "region".into(),
                region: Some("cn-east".into()),
                priority: 1,
                status: Some(
                    sdkwork_routes_rtc_backend_api::service::RtcProviderRouteStatus::Active,
                ),
            },
        )
        .await
        .expect("active region provider route should be created");
    service
        .create_provider_route(
            "920".into(),
            Some("921".into()),
            "922".into(),
            RtcProviderRouteCommand {
                provider_profile_id: "profile-920-921-backup-east".into(),
                route_type: "region".into(),
                region: Some("cn-disabled".into()),
                priority: 1,
                status: Some(
                    sdkwork_routes_rtc_backend_api::service::RtcProviderRouteStatus::Disabled,
                ),
            },
        )
        .await
        .expect("disabled region provider route should be accepted for rollout control");

    let routed = service
        .create_media_session(
            "920".into(),
            Some("921".into()),
            "922".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-east".into()),
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "region-route-provider-selection" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("region route should select the routed provider profile");
    assert_eq!(
        routed.provider_profile_id.as_deref(),
        Some("profile-920-921-backup-east")
    );
    assert_eq!(
        routed.provider_session_id.as_deref(),
        Some(format!("backup:{}", routed.id).as_str())
    );

    let disabled_route_fallback = service
        .create_media_session(
            "920".into(),
            Some("921".into()),
            "922".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-disabled".into()),
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "disabled-region-route-fallback" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("disabled route should be ignored and fallback should remain usable");
    assert_eq!(
        disabled_route_fallback.provider_profile_id.as_deref(),
        Some("profile-920-921-acme-default")
    );
    assert_eq!(
        disabled_route_fallback.provider_session_id.as_deref(),
        Some(format!("acme:{}", disabled_route_fallback.id).as_str())
    );
}

#[tokio::test]
async fn product_service_retrieves_updates_and_disables_provider_route() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("930", "931", "932");

    service
        .create_provider_profile(
            "930".into(),
            Some("931".into()),
            "932".into(),
            provider_profile_command("acme", "default", true, 10),
        )
        .await
        .expect("provider profile should be created");

    let created = service
        .create_provider_route(
            "930".into(),
            Some("931".into()),
            "932".into(),
            RtcProviderRouteCommand {
                provider_profile_id: "profile-930-931-acme-default".into(),
                route_type: "region".into(),
                region: Some("cn-north".into()),
                priority: 10,
                status: Some(
                    sdkwork_routes_rtc_backend_api::service::RtcProviderRouteStatus::Active,
                ),
            },
        )
        .await
        .expect("provider route should be created");

    let retrieved = service
        .retrieve_provider_route("930".into(), Some("931".into()), created.id.clone())
        .await
        .expect("provider route should be retrieved");
    assert_eq!(retrieved.id, created.id);
    assert_eq!(retrieved.region.as_deref(), Some("cn-north"));

    let updated = service
        .update_provider_route(
            "930".into(),
            Some("931".into()),
            "932".into(),
            created.id.clone(),
            RtcProviderRouteCommand {
                provider_profile_id: "profile-930-931-acme-default".into(),
                route_type: "region".into(),
                region: Some("cn-south".into()),
                priority: 5,
                status: Some(
                    sdkwork_routes_rtc_backend_api::service::RtcProviderRouteStatus::Active,
                ),
            },
        )
        .await
        .expect("provider route should be updated");
    assert_eq!(updated.region.as_deref(), Some("cn-south"));
    assert_eq!(updated.priority, 5);

    let disabled = service
        .disable_provider_route(
            "930".into(),
            Some("931".into()),
            "932".into(),
            created.id.clone(),
            RtcProviderRouteDisableRequest {
                reason: Some("rollout rollback".into()),
            },
        )
        .await
        .expect("provider route should be disabled");
    assert_eq!(
        disabled.status,
        sdkwork_routes_rtc_backend_api::service::RtcProviderRouteStatus::Disabled
    );
}

#[tokio::test]
async fn product_service_manages_volcengine_account_application_and_credential_roles() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("volcengine", true)))
        .expect("volcengine provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry).with_persistence(persistence.clone());

    let account = service
        .create_provider_account(
            "980".into(),
            Some("981".into()),
            "982".into(),
            provider_account_command("volcengine"),
        )
        .await
        .expect("volcengine provider account should create");
    assert_eq!(account.provider, "volcengine");

    let application = service
        .create_provider_application(
            "980".into(),
            Some("981".into()),
            "982".into(),
            account.id.clone(),
            provider_application_command("volcengine", "volcengine_app_id"),
        )
        .await
        .expect("volcengine application should create");
    assert!(
        application
            .last_verification_error
            .as_deref()
            .is_some_and(
                |error| error.contains("rtc_token_signing") && error.contains("open_api_signing")
            ),
        "volcengine app should report both required credential roles while credentials are missing",
    );

    service
        .create_provider_credential(
            "980".into(),
            Some("981".into()),
            "982".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::RtcTokenSigning, "token"),
        )
        .await
        .expect("volcengine token credential should create");
    let one_role_application = service
        .retrieve_provider_application("980".into(), Some("981".into()), application.id.clone())
        .await
        .expect("application should retrieve after first credential");
    assert!(
        one_role_application
            .last_verification_error
            .as_deref()
            .is_some_and(
                |error| error.contains("open_api_signing") && !error.contains("rtc_token_signing")
            ),
        "volcengine app should still report missing open api signing credential",
    );

    service
        .create_provider_credential(
            "980".into(),
            Some("981".into()),
            "982".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::OpenApiSigning, "open-api"),
        )
        .await
        .expect("volcengine open api credential should create");
    let healthy_application = service
        .retrieve_provider_application("980".into(), Some("981".into()), application.id.clone())
        .await
        .expect("application should retrieve after credentials are complete");
    assert_eq!(
        healthy_application.last_verification_error, None,
        "volcengine app should pass credential health after both required roles are active",
    );

    let credentials = service
        .list_provider_credentials(
            "980".into(),
            Some("981".into()),
            application.id.clone(),
            RtcBackendListQuery::default(),
        )
        .await
        .expect("credentials should list");
    assert_eq!(credentials.items.len(), 2);

    let batches = persistence.batches();
    assert!(
        batches.iter().any(|batch| batch
            .provider_accounts
            .iter()
            .any(|stored| stored.id == account.id)),
        "provider account changes must be persisted"
    );
    assert!(
        batches.iter().any(|batch| batch
            .provider_applications
            .iter()
            .any(|stored| stored.id == application.id && stored.last_verification_error.is_none())),
        "provider application credential health must be persisted"
    );
    assert!(
        batches
            .iter()
            .any(|batch| batch.provider_credentials.iter().any(|stored| {
                stored.provider_application_id == application.id
                    && stored.credential_role == RtcProviderCredentialRole::OpenApiSigning
            })),
        "provider credential changes must be persisted"
    );
}

#[tokio::test]
async fn product_service_requires_tencent_usersig_and_cloud_api_credentials() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "990".into(),
            Some("991".into()),
            "992".into(),
            provider_account_command("tencent"),
        )
        .await
        .expect("tencent provider account should create");
    let application = service
        .create_provider_application(
            "990".into(),
            Some("991".into()),
            "992".into(),
            account.id,
            provider_application_command("tencent", "tencent_sdk_app_id"),
        )
        .await
        .expect("tencent application should create");

    service
        .create_provider_credential(
            "990".into(),
            Some("991".into()),
            "992".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig"),
        )
        .await
        .expect("tencent usersig credential should create");
    let missing_cloud_api = service
        .retrieve_provider_application("990".into(), Some("991".into()), application.id.clone())
        .await
        .expect("application should retrieve with partial credentials");
    assert!(
        missing_cloud_api
            .last_verification_error
            .as_deref()
            .is_some_and(
                |error| error.contains("cloud_api_signing") && !error.contains("usersig_signing")
            ),
        "tencent app must report missing cloud API signing until the cloud credential is active",
    );

    service
        .create_provider_credential(
            "990".into(),
            Some("991".into()),
            "992".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::CloudApiSigning, "cloud-api"),
        )
        .await
        .expect("tencent cloud api credential should create");
    let healthy_application = service
        .retrieve_provider_application("990".into(), Some("991".into()), application.id)
        .await
        .expect("application should retrieve after tencent credentials are complete");
    assert_eq!(healthy_application.last_verification_error, None);
}

#[tokio::test]
async fn product_service_rejects_provider_credential_mutation_when_account_is_disabled() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("volcengine", true)))
        .expect("volcengine provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "970".into(),
            Some("971".into()),
            "972".into(),
            provider_account_command("volcengine"),
        )
        .await
        .expect("volcengine provider account should create");
    let application = service
        .create_provider_application(
            "970".into(),
            Some("971".into()),
            "972".into(),
            account.id.clone(),
            provider_application_command("volcengine", "volcengine_app_id"),
        )
        .await
        .expect("volcengine application should create");
    let credential = service
        .create_provider_credential(
            "970".into(),
            Some("971".into()),
            "972".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::RtcTokenSigning, "token"),
        )
        .await
        .expect("initial credential should create before account is disabled");

    service
        .disable_provider_account(
            "970".into(),
            Some("971".into()),
            "972".into(),
            account.id,
            RtcProviderAccountDisableRequest {
                reason: Some("operator disabled provider account".into()),
            },
        )
        .await
        .expect("provider account should disable");

    let mut rotated_command =
        provider_credential_command(RtcProviderCredentialRole::RtcTokenSigning, "token");
    rotated_command.secret_version = Some("2".into());
    let rejected_update = service
        .update_provider_credential(
            "970".into(),
            Some("971".into()),
            "972".into(),
            credential.id,
            rotated_command,
        )
        .await;
    assert!(
        matches!(rejected_update, Err(RtcBackendApiError::Unavailable(message)) if message.contains("provider account")),
        "disabled provider accounts must block credential updates"
    );

    let rejected_create = service
        .create_provider_credential(
            "970".into(),
            Some("971".into()),
            "972".into(),
            application.id,
            provider_credential_command(RtcProviderCredentialRole::OpenApiSigning, "open-api"),
        )
        .await;
    assert!(
        matches!(rejected_create, Err(RtcBackendApiError::Unavailable(message)) if message.contains("provider account")),
        "disabled provider accounts must block new provider credentials"
    );
}

#[tokio::test]
async fn product_service_records_provider_credential_rotation_when_secret_material_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "960".into(),
            Some("961".into()),
            "962".into(),
            provider_account_command("tencent"),
        )
        .await
        .expect("tencent provider account should create");
    let application = service
        .create_provider_application(
            "960".into(),
            Some("961".into()),
            "962".into(),
            account.id,
            provider_application_command("tencent", "tencent_sdk_app_id"),
        )
        .await
        .expect("tencent application should create");
    let credential = service
        .create_provider_credential(
            "960".into(),
            Some("961".into()),
            "962".into(),
            application.id,
            provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig"),
        )
        .await
        .expect("initial usersig credential should create");
    assert_eq!(credential.rotated_at, None);

    let mut rotated_command =
        provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig");
    rotated_command.secret_version = Some("2".into());
    rotated_command.credential_ref = "secret://rtc/usersig-v2".into();
    rotated_command.credential_fingerprint = Some("fingerprint:usersig-v2".into());

    let rotated = service
        .update_provider_credential(
            "960".into(),
            Some("961".into()),
            "962".into(),
            credential.id.clone(),
            rotated_command,
        )
        .await
        .expect("credential rotation should update");
    assert!(
        rotated.rotated_at.is_some(),
        "credential secret material changes must stamp rotated_at"
    );

    let stored = service
        .retrieve_provider_credential("960".into(), Some("961".into()), credential.id)
        .await
        .expect("rotated credential should retrieve");
    assert_eq!(
        stored.rotated_at, rotated.rotated_at,
        "credential rotation timestamp must be persisted in service state"
    );
}

#[tokio::test]
async fn product_service_keeps_revoked_provider_credentials_terminal() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "950".into(),
            Some("951".into()),
            "952".into(),
            provider_account_command("tencent"),
        )
        .await
        .expect("tencent provider account should create");
    let application = service
        .create_provider_application(
            "950".into(),
            Some("951".into()),
            "952".into(),
            account.id,
            provider_application_command("tencent", "tencent_sdk_app_id"),
        )
        .await
        .expect("tencent application should create");
    let credential = service
        .create_provider_credential(
            "950".into(),
            Some("951".into()),
            "952".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig"),
        )
        .await
        .expect("initial usersig credential should create");

    service
        .revoke_provider_credential(
            "950".into(),
            Some("951".into()),
            "952".into(),
            credential.id.clone(),
            sdkwork_communication_rtc_service::RtcProviderCredentialRevokeRequest {
                reason: Some("compromised signing key".into()),
            },
        )
        .await
        .expect("credential should revoke");

    let mut rotated_command =
        provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig");
    rotated_command.secret_version = Some("2".into());
    let rejected_update = service
        .update_provider_credential(
            "950".into(),
            Some("951".into()),
            "952".into(),
            credential.id,
            rotated_command,
        )
        .await;
    assert!(
        matches!(rejected_update, Err(RtcBackendApiError::Conflict(message)) if message.contains("revoked")),
        "revoked provider credentials must not be reactivated by update"
    );

    let rejected_recreate = service
        .create_provider_credential(
            "950".into(),
            Some("951".into()),
            "952".into(),
            application.id,
            provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig"),
        )
        .await;
    assert!(
        matches!(rejected_recreate, Err(RtcBackendApiError::Conflict(message)) if message.contains("revoked")),
        "revoked provider credentials must not be reactivated by same-label create"
    );
}

#[tokio::test]
async fn product_service_rejects_raw_provider_credential_refs() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "932".into(),
            Some("933".into()),
            "934".into(),
            provider_account_command("tencent"),
        )
        .await
        .expect("tencent provider account should create");
    let application = service
        .create_provider_application(
            "932".into(),
            Some("933".into()),
            "934".into(),
            account.id,
            provider_application_command("tencent", "tencent_sdk_app_id"),
        )
        .await
        .expect("tencent provider application should create");

    let mut command =
        provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig");
    command.credential_ref = "raw-usersig-secret".into();
    let rejected_create = service
        .create_provider_credential(
            "932".into(),
            Some("933".into()),
            "934".into(),
            application.id,
            command,
        )
        .await;
    assert!(
        matches!(rejected_create, Err(RtcBackendApiError::BadRequest(message)) if message.contains("credential ref must be a secret reference")),
        "provider credential refs must point at secret storage, not raw secret material"
    );
}

#[tokio::test]
async fn product_service_rejects_provider_credential_upsert_with_revoked_status() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "929".into(),
            Some("930".into()),
            "931".into(),
            provider_account_command("tencent"),
        )
        .await
        .expect("tencent provider account should create");
    let application = service
        .create_provider_application(
            "929".into(),
            Some("930".into()),
            "931".into(),
            account.id,
            provider_application_command("tencent", "tencent_sdk_app_id"),
        )
        .await
        .expect("tencent provider application should create");

    let mut command =
        provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig");
    command.status = Some(RtcProviderCredentialStatus::Revoked);
    let rejected_create = service
        .create_provider_credential(
            "929".into(),
            Some("930".into()),
            "931".into(),
            application.id,
            command,
        )
        .await;
    assert!(
        matches!(rejected_create, Err(RtcBackendApiError::BadRequest(message)) if message.contains("revoke provider credential")),
        "provider credential upsert must not bypass the revoke workflow"
    );
}

#[tokio::test]
async fn product_service_preserves_provider_management_creation_audit_on_update() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("volcengine", true)))
        .expect("volcengine provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "940".into(),
            Some("941".into()),
            "creator".into(),
            provider_account_command("volcengine"),
        )
        .await
        .expect("provider account should create");
    let mut account_update = provider_account_command("volcengine");
    account_update.name = "renamed volcengine account".into();
    let updated_account = service
        .update_provider_account(
            "940".into(),
            Some("941".into()),
            "updater".into(),
            account.id.clone(),
            account_update,
        )
        .await
        .expect("provider account should update");
    assert_eq!(updated_account.created_by, account.created_by);
    assert_eq!(updated_account.created_at, account.created_at);
    assert_eq!(updated_account.updated_by.as_deref(), Some("updater"));

    let application = service
        .create_provider_application(
            "940".into(),
            Some("941".into()),
            "creator".into(),
            account.id,
            provider_application_command("volcengine", "volcengine_app_id"),
        )
        .await
        .expect("provider application should create");
    let mut application_update = provider_application_command("volcengine", "volcengine_app_id");
    application_update.name = "renamed volcengine application".into();
    let updated_application = service
        .update_provider_application(
            "940".into(),
            Some("941".into()),
            "updater".into(),
            application.id.clone(),
            application_update,
        )
        .await
        .expect("provider application should update");
    assert_eq!(updated_application.created_by, application.created_by);
    assert_eq!(updated_application.created_at, application.created_at);
    assert_eq!(updated_application.updated_by.as_deref(), Some("updater"));

    let credential = service
        .create_provider_credential(
            "940".into(),
            Some("941".into()),
            "creator".into(),
            application.id,
            provider_credential_command(RtcProviderCredentialRole::RtcTokenSigning, "token"),
        )
        .await
        .expect("provider credential should create");
    let mut credential_update =
        provider_credential_command(RtcProviderCredentialRole::RtcTokenSigning, "token");
    credential_update.rotation_due_at = Some("2026-12-01T00:00:00.000Z".into());
    let updated_credential = service
        .update_provider_credential(
            "940".into(),
            Some("941".into()),
            "updater".into(),
            credential.id,
            credential_update,
        )
        .await
        .expect("provider credential should update");
    assert_eq!(updated_credential.created_by, credential.created_by);
    assert_eq!(updated_credential.created_at, credential.created_at);
    assert_eq!(updated_credential.updated_by.as_deref(), Some("updater"));
}

#[tokio::test]
async fn product_service_increments_provider_management_versions_on_update() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "945".into(),
            Some("946".into()),
            "creator".into(),
            provider_account_command("tencent"),
        )
        .await
        .expect("provider account should create");
    assert_eq!(account.version, "0");
    let mut account_update = provider_account_command("tencent");
    account_update.name = "renamed tencent account".into();
    let updated_account = service
        .update_provider_account(
            "945".into(),
            Some("946".into()),
            "updater".into(),
            account.id.clone(),
            account_update,
        )
        .await
        .expect("provider account should update");
    assert_eq!(updated_account.version, "1");

    let application = service
        .create_provider_application(
            "945".into(),
            Some("946".into()),
            "creator".into(),
            account.id,
            provider_application_command("tencent", "tencent_sdk_app_id"),
        )
        .await
        .expect("provider application should create");
    assert_eq!(application.version, "0");
    let mut application_update = provider_application_command("tencent", "tencent_sdk_app_id");
    application_update.name = "renamed tencent application".into();
    let updated_application = service
        .update_provider_application(
            "945".into(),
            Some("946".into()),
            "updater".into(),
            application.id.clone(),
            application_update,
        )
        .await
        .expect("provider application should update");
    assert_eq!(updated_application.version, "1");

    let credential = service
        .create_provider_credential(
            "945".into(),
            Some("946".into()),
            "creator".into(),
            application.id,
            provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig"),
        )
        .await
        .expect("provider credential should create");
    assert_eq!(credential.version, "0");
    let mut credential_update =
        provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig");
    credential_update.rotation_due_at = Some("2026-12-01T00:00:00.000Z".into());
    let updated_credential = service
        .update_provider_credential(
            "945".into(),
            Some("946".into()),
            "updater".into(),
            credential.id,
            credential_update,
        )
        .await
        .expect("provider credential should update");
    assert_eq!(updated_credential.version, "1");
}

#[tokio::test]
async fn product_service_increments_provider_management_versions_on_lifecycle_state_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("volcengine", true)))
        .expect("volcengine provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "934".into(),
            Some("935".into()),
            "936".into(),
            provider_account_command("volcengine"),
        )
        .await
        .expect("volcengine provider account should create");
    assert_eq!(account.version, "0");

    let application = service
        .create_provider_application(
            "934".into(),
            Some("935".into()),
            "936".into(),
            account.id.clone(),
            provider_application_command("volcengine", "volcengine_app_id"),
        )
        .await
        .expect("volcengine provider application should create");
    assert_eq!(application.version, "0");

    let token_credential = service
        .create_provider_credential(
            "934".into(),
            Some("935".into()),
            "936".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::RtcTokenSigning, "token"),
        )
        .await
        .expect("token credential should create");
    assert_eq!(token_credential.version, "0");
    let application_after_token = service
        .retrieve_provider_application("934".into(), Some("935".into()), application.id.clone())
        .await
        .expect("application should retrieve after token credential");
    assert_eq!(
        application_after_token.version, "1",
        "credential health refresh should increment application version"
    );

    service
        .create_provider_credential(
            "934".into(),
            Some("935".into()),
            "936".into(),
            application.id.clone(),
            provider_credential_command(RtcProviderCredentialRole::OpenApiSigning, "open-api"),
        )
        .await
        .expect("open api credential should create");
    let healthy_application = service
        .retrieve_provider_application("934".into(), Some("935".into()), application.id.clone())
        .await
        .expect("application should retrieve after required credentials");
    assert_eq!(healthy_application.version, "2");

    let revoked_credential = service
        .revoke_provider_credential(
            "934".into(),
            Some("935".into()),
            "936".into(),
            token_credential.id,
            RtcProviderCredentialRevokeRequest {
                reason: Some("operator rotated compromised key".into()),
            },
        )
        .await
        .expect("credential should revoke");
    assert_eq!(revoked_credential.version, "1");
    let unhealthy_application = service
        .retrieve_provider_application("934".into(), Some("935".into()), application.id.clone())
        .await
        .expect("application should retrieve after credential revoke");
    assert_eq!(unhealthy_application.version, "3");

    let disabled_application = service
        .disable_provider_application(
            "934".into(),
            Some("935".into()),
            "936".into(),
            application.id,
            RtcProviderApplicationDisableRequest {
                reason: Some("operator disabled provider application".into()),
            },
        )
        .await
        .expect("application should disable");
    assert_eq!(disabled_application.version, "4");

    let disabled_account = service
        .disable_provider_account(
            "934".into(),
            Some("935".into()),
            "936".into(),
            account.id,
            RtcProviderAccountDisableRequest {
                reason: Some("operator disabled provider account".into()),
            },
        )
        .await
        .expect("account should disable");
    assert_eq!(disabled_account.version, "1");
}

#[tokio::test]
async fn product_service_rejects_provider_account_provider_identity_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("volcengine", true)))
        .expect("volcengine provider should register")
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "947".into(),
            Some("948".into()),
            "949".into(),
            provider_account_command("volcengine"),
        )
        .await
        .expect("volcengine provider account should create");

    let rejected_update = service
        .update_provider_account(
            "947".into(),
            Some("948".into()),
            "949".into(),
            account.id,
            provider_account_command("tencent"),
        )
        .await;
    assert!(
        matches!(rejected_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("provider cannot be changed")),
        "provider account update must not change the provider identity"
    );
}

#[tokio::test]
async fn product_service_rejects_provider_credential_role_label_identity_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("tencent", true)))
        .expect("tencent provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "943".into(),
            Some("944".into()),
            "949".into(),
            provider_account_command("tencent"),
        )
        .await
        .expect("tencent provider account should create");
    let application = service
        .create_provider_application(
            "943".into(),
            Some("944".into()),
            "949".into(),
            account.id,
            provider_application_command("tencent", "tencent_sdk_app_id"),
        )
        .await
        .expect("tencent provider application should create");
    let credential = service
        .create_provider_credential(
            "943".into(),
            Some("944".into()),
            "949".into(),
            application.id,
            provider_credential_command(RtcProviderCredentialRole::UserSigSigning, "usersig"),
        )
        .await
        .expect("usersig credential should create");

    let rejected_update = service
        .update_provider_credential(
            "943".into(),
            Some("944".into()),
            "949".into(),
            credential.id,
            provider_credential_command(RtcProviderCredentialRole::CloudApiSigning, "cloud-api"),
        )
        .await;
    assert!(
        matches!(rejected_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("role and label cannot be changed")),
        "provider credential update must not change the role/label identity"
    );
}

#[tokio::test]
async fn product_service_rejects_provider_account_and_application_code_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("volcengine", true)))
        .expect("volcengine provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "936".into(),
            Some("937".into()),
            "938".into(),
            provider_account_command("volcengine"),
        )
        .await
        .expect("volcengine provider account should create");
    let mut account_update = provider_account_command("volcengine");
    account_update.code = "secondary".into();
    let rejected_account_update = service
        .update_provider_account(
            "936".into(),
            Some("937".into()),
            "938".into(),
            account.id.clone(),
            account_update,
        )
        .await;
    assert!(
        matches!(rejected_account_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("account code cannot be changed")),
        "provider account update must not change code identity"
    );

    let application = service
        .create_provider_application(
            "936".into(),
            Some("937".into()),
            "938".into(),
            account.id,
            provider_application_command("volcengine", "volcengine_app_id"),
        )
        .await
        .expect("volcengine provider application should create");
    let mut application_update = provider_application_command("volcengine", "volcengine_app_id");
    application_update.code = "secondary".into();
    let rejected_application_update = service
        .update_provider_application(
            "936".into(),
            Some("937".into()),
            "938".into(),
            application.id,
            application_update,
        )
        .await;
    assert!(
        matches!(rejected_application_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("application code cannot be changed")),
        "provider application update must not change code identity"
    );
}

#[tokio::test]
async fn product_service_rejects_provider_application_external_identity_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("volcengine", true)))
        .expect("volcengine provider should register");
    let service = test_rtc_service(registry);

    let account = service
        .create_provider_account(
            "932".into(),
            Some("933".into()),
            "934".into(),
            provider_account_command("volcengine"),
        )
        .await
        .expect("volcengine provider account should create");
    let application = service
        .create_provider_application(
            "932".into(),
            Some("933".into()),
            "934".into(),
            account.id,
            provider_application_command("volcengine", "volcengine_app_id"),
        )
        .await
        .expect("volcengine provider application should create");

    let mut app_id_update = provider_application_command("volcengine", "volcengine_app_id");
    app_id_update.provider_application_id = "different-volcengine-app-id".into();
    let rejected_app_id_update = service
        .update_provider_application(
            "932".into(),
            Some("933".into()),
            "934".into(),
            application.id.clone(),
            app_id_update,
        )
        .await;
    assert!(
        matches!(rejected_app_id_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("provider application id cannot be changed")),
        "provider application update must not rebind the provider-owned application id"
    );

    let mut app_id_kind_update =
        provider_application_command("volcengine", "provider_application_id");
    app_id_kind_update.provider_application_id = application.provider_application_id;
    let rejected_app_id_kind_update = service
        .update_provider_application(
            "932".into(),
            Some("933".into()),
            "934".into(),
            application.id,
            app_id_kind_update,
        )
        .await;
    assert!(
        matches!(rejected_app_id_kind_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("provider volcengine requires providerApplicationIdKind volcengine_app_id") || message.contains("provider application id kind cannot be changed")),
        "provider application update must not rebind the provider-owned application id kind"
    );
}

#[tokio::test]
async fn product_service_preserves_provider_profile_audit_and_versions() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry);

    let profile = service
        .create_provider_profile(
            "933".into(),
            Some("934".into()),
            "creator".into(),
            provider_profile_command("acme", "default", true, 10),
        )
        .await
        .expect("provider profile should create");
    assert_eq!(profile.version, "0");

    let mut update = provider_profile_command("acme", "default", true, 20);
    update.name = "renamed acme profile".into();
    let updated_profile = service
        .update_provider_profile(
            "933".into(),
            Some("934".into()),
            "updater".into(),
            profile.id.clone(),
            update,
        )
        .await
        .expect("provider profile should update");

    assert_eq!(updated_profile.created_by, profile.created_by);
    assert_eq!(updated_profile.created_at, profile.created_at);
    assert_eq!(updated_profile.updated_by.as_deref(), Some("updater"));
    assert_eq!(updated_profile.version, "1");

    let disabled_profile = service
        .disable_provider_profile(
            "933".into(),
            Some("934".into()),
            "disabler".into(),
            profile.id,
            sdkwork_communication_rtc_service::RtcProviderProfileDisableRequest {
                reason: Some("operator disabled provider profile".into()),
            },
        )
        .await
        .expect("provider profile should disable");

    assert_eq!(disabled_profile.created_by, profile.created_by);
    assert_eq!(disabled_profile.created_at, profile.created_at);
    assert_eq!(disabled_profile.updated_by.as_deref(), Some("disabler"));
    assert_eq!(disabled_profile.version, "2");
}

#[tokio::test]
async fn product_service_rejects_provider_profile_identity_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", true)))
        .expect("backup provider should register");
    let service = test_rtc_service(registry);

    let profile = service
        .create_provider_profile(
            "929".into(),
            Some("930".into()),
            "931".into(),
            provider_profile_command("acme", "default", true, 10),
        )
        .await
        .expect("provider profile should create");

    let rejected_provider_update = service
        .update_provider_profile(
            "929".into(),
            Some("930".into()),
            "931".into(),
            profile.id.clone(),
            provider_profile_command("backup", "default", true, 10),
        )
        .await;
    assert!(
        matches!(rejected_provider_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("profile provider cannot be changed")),
        "provider profile update must not change provider identity"
    );

    let rejected_code_update = service
        .update_provider_profile(
            "929".into(),
            Some("930".into()),
            "931".into(),
            profile.id,
            provider_profile_command("acme", "secondary", true, 10),
        )
        .await;
    assert!(
        matches!(rejected_code_update, Err(RtcBackendApiError::BadRequest(message)) if message.contains("profile code cannot be changed")),
        "provider profile update must not change code identity"
    );
}

#[tokio::test]
async fn product_service_rejects_duplicate_provider_profile_identity_in_same_scope() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("930", "931", "932");

    let profile = service
        .create_provider_profile(
            "930".into(),
            Some("931".into()),
            "932".into(),
            provider_profile_command("acme", "default", true, 10),
        )
        .await
        .expect("scoped provider profile should be created");
    assert_eq!(profile.id, "profile-930-931-acme-default");

    let duplicate_identity = service
        .update_provider_profile(
            "930".into(),
            Some("931".into()),
            "932".into(),
            "profile-930-931-acme-duplicate".into(),
            provider_profile_command("acme", "default", false, 20),
        )
        .await;

    assert!(
        matches!(duplicate_identity, Err(RtcBackendApiError::NotFound(_))),
        "updating an unknown provider profile id must not create a duplicate provider account"
    );

    let backup_profile = service
        .create_provider_profile(
            "930".into(),
            Some("931".into()),
            "932".into(),
            provider_profile_command("acme", "backup", false, 20),
        )
        .await
        .expect("second provider profile with a different code should be created");

    let conflicting_update = service
        .update_provider_profile(
            "930".into(),
            Some("931".into()),
            "932".into(),
            backup_profile.id,
            provider_profile_command("acme", "default", false, 30),
        )
        .await;

    assert!(
        matches!(conflicting_update, Err(RtcBackendApiError::Conflict(_))),
        "updating a profile must not collide with another profile in the same tenant, organization, provider, and code scope"
    );
}

#[tokio::test]
async fn product_service_rejects_raw_provider_profile_secret_refs() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry);

    let mut raw_credential = provider_profile_command("acme", "raw-credential", false, 10);
    raw_credential.credential_ref = Some("raw-provider-secret".into());
    let rejected_credential = service
        .create_provider_profile(
            "927".into(),
            Some("928".into()),
            "929".into(),
            raw_credential,
        )
        .await;
    assert!(
        matches!(rejected_credential, Err(RtcBackendApiError::BadRequest(message)) if message.contains("credential ref must be a secret reference")),
        "provider profile credential_ref must point at secret storage"
    );

    let mut raw_webhook = provider_profile_command("acme", "raw-webhook", false, 10);
    raw_webhook.webhook_secret_ref = Some("raw-webhook-secret".into());
    let rejected_webhook = service
        .create_provider_profile("927".into(), Some("928".into()), "929".into(), raw_webhook)
        .await;
    assert!(
        matches!(rejected_webhook, Err(RtcBackendApiError::BadRequest(message)) if message.contains("webhook secret ref must be a secret reference")),
        "provider profile webhook_secret_ref must point at secret storage"
    );
}

#[tokio::test]
async fn product_service_rejects_provider_webhook_when_provider_mismatches_session_profile() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = test_rtc_service(registry).seed_default_room("940", "941", "942");

    let session = service
        .create_media_session(
            "940".into(),
            Some("941".into()),
            "942".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: None,
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "webhook-provider-mismatch" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("acme session should be created");
    assert_eq!(
        session.provider_profile_id.as_deref(),
        Some("profile-940-941-acme-default")
    );

    let mismatched_webhook = service
        .receive_provider_webhook_event(
            "backup".into(),
            RtcProviderWebhookIngress::from_wrapped_test_request(
                RtcProviderWebhookReceiveRequest {
                    provider_profile_id: None,
                    external_event_id: None,
                    event_type: None,
                    received_at: Some("2026-06-10T00:06:00.000Z".into()),
                    headers: serde_json::json!({ "X-Backup-Signature": "sig-mismatch" }),
                    payload: serde_json::json!({
                        "eventType": "room_ended",
                        "eventId": "evt-provider-mismatch",
                        "roomId": "room-default",
                        "sessionId": session.id,
                        "recordingId": "recording-provider-mismatch"
                    }),
                },
            ),
        )
        .await;

    assert!(
        matches!(mismatched_webhook, Err(RtcBackendApiError::BadRequest(_))),
        "provider webhooks must not be allowed to close or export artifacts for sessions owned by another provider profile"
    );
}

#[tokio::test]
async fn product_service_rejects_provider_query_when_profile_does_not_match_session() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = test_rtc_service(registry).seed_default_room("950", "951", "952");

    let session = service
        .create_media_session(
            "950".into(),
            Some("951".into()),
            "952".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: None,
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "query-provider-mismatch" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("acme session should be created");

    let backup_profile = service
        .create_provider_profile(
            "950".into(),
            Some("951".into()),
            "952".into(),
            provider_profile_command("backup", "default", false, 20),
        )
        .await
        .expect("same organization backup provider profile should be created");

    let mismatched_query = service
        .create_provider_query_job(
            "950".into(),
            Some("951".into()),
            "952".into(),
            RtcProviderQueryJobCreateRequest {
                provider: "backup".into(),
                provider_profile_id: Some(backup_profile.id),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: Some("room-default".into()),
                media_session_id: Some(session.id.clone()),
                provider_session_id: session.provider_session_id.clone(),
                cursor: None,
            },
        )
        .await;

    assert!(
        matches!(mismatched_query, Err(RtcBackendApiError::BadRequest(_))),
        "active provider queries must not export recording artifacts for a session owned by a different provider profile"
    );
}

#[tokio::test]
async fn product_service_resolves_provider_query_target_from_provider_session_before_recording() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("955", "956", "957");

    let session = service
        .create_media_session(
            "955".into(),
            Some("956".into()),
            "957".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: None,
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "query-provider-session-resolution" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("acme session should be created");

    let query_job = service
        .create_provider_query_job(
            "955".into(),
            Some("956".into()),
            "957".into(),
            RtcProviderQueryJobCreateRequest {
                provider: "acme".into(),
                provider_profile_id: Some("profile-955-956-acme-default".into()),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: Some("room-default".into()),
                media_session_id: None,
                provider_session_id: session.provider_session_id.clone(),
                cursor: None,
            },
        )
        .await
        .expect("provider session id should resolve to the local media session before recording");

    assert_eq!(
        query_job.media_session_id.as_deref(),
        Some(session.id.as_str())
    );
    let artifacts = service
        .list_recording_artifacts(
            "955".into(),
            Some("956".into()),
            session.id,
            RtcAppListQuery::default(),
        )
        .await
        .expect("recording artifacts should list after provider-session-only query");
    assert_eq!(artifacts.items.len(), 1);
    assert_eq!(
        artifacts.items[0].source_provider_query_job_id.as_deref(),
        Some(query_job.id.as_str())
    );
}

#[tokio::test]
async fn product_service_rejects_recording_query_when_provider_session_cannot_resolve_locally() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("958", "959", "960");

    let unknown_provider_session_id = "acme:unknown-session";
    let rejected_query = service
        .create_provider_query_job(
            "958".into(),
            Some("959".into()),
            "960".into(),
            RtcProviderQueryJobCreateRequest {
                provider: "acme".into(),
                provider_profile_id: Some("profile-958-959-acme-default".into()),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: Some("room-default".into()),
                media_session_id: None,
                provider_session_id: Some(unknown_provider_session_id.into()),
                cursor: None,
            },
        )
        .await;

    assert!(
        matches!(rejected_query, Err(RtcBackendApiError::BadRequest(_))),
        "recording artifact queries must resolve to a local media session before provider query job recording"
    );

    let leaked_job = RtcBackendApiService::retrieve_provider_query_job(
        &service,
        "958".into(),
        Some("959".into()),
        format!("provider-query-acme-recording_artifacts-{unknown_provider_session_id}"),
    )
    .await;
    assert!(
        matches!(leaked_job, Err(RtcBackendApiError::NotFound(_))),
        "rejected recording queries must not leave completed provider query jobs behind"
    );
}

#[tokio::test]
async fn product_service_rejects_provider_route_when_profile_is_outside_current_scope() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("960", "961", "962");

    service
        .create_provider_profile(
            "960".into(),
            Some("961".into()),
            "962".into(),
            provider_profile_command("acme", "default", true, 10),
        )
        .await
        .expect("provider profile should be created in organization 961");

    let wrong_scope_route = service
        .create_provider_route(
            "960".into(),
            Some("wrong-organization".into()),
            "962".into(),
            RtcProviderRouteCommand {
                provider_profile_id: "profile-960-961-acme-default".into(),
                route_type: "region".into(),
                region: Some("cn-test".into()),
                priority: 10,
                status: Some(
                    sdkwork_routes_rtc_backend_api::service::RtcProviderRouteStatus::Active,
                ),
            },
        )
        .await;

    assert!(
        matches!(wrong_scope_route, Err(RtcBackendApiError::NotFound(_))),
        "provider routes must not reference provider profiles outside the current organization scope"
    );
}

#[tokio::test]
async fn product_service_records_completion_from_provider_room_ended_webhook() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("700", "701", "702");

    let session = service
        .create_media_session(
            "700".into(),
            Some("701".into()),
            "702".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "webhook-completion-contract" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created through default provider");

    service
        .issue_participant_credential(
            "700".into(),
            Some("701".into()),
            "702".into(),
            RtcIssueParticipantCredentialRequest {
                media_session_id: session.id.clone(),
                participant_id: "participant-702".into(),
                idempotency_key: None,
            },
        )
        .await
        .expect("participant should join before webhook completion");

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
            RtcProviderWebhookIngress::from_wrapped_test_request(
                RtcProviderWebhookReceiveRequest {
                    provider_profile_id: Some("profile-700-701-acme-default".into()),
                    external_event_id: None,
                    event_type: None,
                    received_at: Some("2026-06-10T00:03:00.000Z".into()),
                    headers: serde_json::json!({ "X-Acme-Signature": "sig-webhook-close" }),
                    payload: serde_json::json!({
                        "eventType": "room_ended",
                        "eventId": "evt-webhook-close",
                        "roomId": "room-default",
                        "sessionId": session.id,
                        "recordingId": "recording-webhook-close"
                    }),
                },
            ),
        )
        .await
        .expect("room ended webhook should be recorded through provider plugin");

    let ended_session = RtcAppApiService::retrieve_media_session(
        &service,
        "700".into(),
        Some("701".into()),
        session.id.clone(),
    )
    .await
    .expect("session should remain retrievable after webhook completion");
    assert_eq!(
        ended_session.status,
        sdkwork_communication_rtc_service::RtcMediaSessionStatus::Ended
    );
    assert_eq!(
        ended_session.end_source,
        Some(sdkwork_communication_rtc_service::RtcMediaSessionEndSource::ProviderWebhook)
    );
    assert_eq!(
        ended_session.completion_recorded_at.as_deref(),
        Some("2026-06-10T00:03:00.000Z")
    );

    let completion = RtcAppApiService::retrieve_media_session_completion_record(
        &service,
        "700".into(),
        Some("701".into()),
        session.id.clone(),
    )
    .await
    .expect("completion record should be generated from provider room ended webhook");
    assert_eq!(completion.media_session_id, session.id);
    assert_eq!(
        completion.source_webhook_event_id.as_deref(),
        Some(webhook_record.id.as_str())
    );
    assert_eq!(completion.recording_summary.drive_resource_count, 1);
    assert_eq!(completion.artifacts.len(), 1);
    assert_eq!(completion.artifacts[0].drive_space_type.as_str(), "rtc");
    assert_eq!(completion.participant_count, 1);

    let artifacts = service
        .list_recording_artifacts(
            "700".into(),
            Some("701".into()),
            session.id,
            RtcAppListQuery::default(),
        )
        .await
        .expect("webhook-exported recording artifacts should list");
    assert_eq!(artifacts.items.len(), 1);
    assert_eq!(
        artifacts.items[0]
            .source_provider_webhook_event_id
            .as_deref(),
        Some(webhook_record.id.as_str())
    );
    assert_eq!(
        artifacts.items[0].source_provider_query_job_id.as_deref(),
        None
    );
}

#[tokio::test]
async fn product_service_persists_completion_change_set_after_manual_close() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("730", "731", "732");

    let session = service
        .create_media_session(
            "730".into(),
            Some("731".into()),
            "732".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "persistent-completion-contract" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created through default provider");

    service
        .issue_participant_credential(
            "730".into(),
            Some("731".into()),
            "732".into(),
            RtcIssueParticipantCredentialRequest {
                media_session_id: session.id.clone(),
                participant_id: "participant-732".into(),
                idempotency_key: None,
            },
        )
        .await
        .expect("participant should be stored before completion");

    service
        .close_media_session(
            "730".into(),
            Some("731".into()),
            "732".into(),
            session.id.clone(),
            sdkwork_routes_rtc_backend_api::service::RtcCloseMediaSessionRequest {
                reason: Some("host_closed".into()),
            },
        )
        .await
        .expect("manual close should complete the media session");

    let batches = persistence.batches();
    let completion_batch = batches
        .iter()
        .find(|batch| {
            batch
                .completion_records
                .iter()
                .any(|record| record.media_session_id == session.id)
        })
        .expect("completion change set should be written to persistence");

    assert!(
        completion_batch
            .media_sessions
            .iter()
            .any(|stored_session| stored_session.id == session.id
                && stored_session.status
                    == sdkwork_communication_rtc_service::RtcMediaSessionStatus::Ended
                && stored_session.completion_recorded_at.is_some()),
        "completed session fact must be persisted with completion metadata"
    );
    assert!(
        completion_batch
            .media_artifacts
            .iter()
            .any(|artifact| artifact.rtc_session_id == session.id
                && artifact.drive.space_type.as_str() == "rtc"
                && artifact.source_provider_query_job_id.is_some()),
        "recording artifacts must be persisted as RTC Drive-backed artifacts"
    );
    assert!(
        completion_batch
            .media_participants
            .iter()
            .any(|participant| participant.session_id == session.id),
        "participant facts must be part of the completion persistence change set"
    );
}

#[tokio::test]
async fn product_service_persists_webhook_completion_change_set() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("740", "741", "742");

    let session = service
        .create_media_session(
            "740".into(),
            Some("741".into()),
            "742".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "persistent-webhook-completion" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created through default provider");

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
            RtcProviderWebhookIngress::from_wrapped_test_request(
                RtcProviderWebhookReceiveRequest {
                    provider_profile_id: Some("profile-740-741-acme-default".into()),
                    external_event_id: None,
                    event_type: None,
                    received_at: Some("2026-06-10T00:12:00.000Z".into()),
                    headers: serde_json::json!({ "X-Acme-Signature": "sig-persist-webhook" }),
                    payload: serde_json::json!({
                        "eventType": "room_ended",
                        "eventId": "evt-persist-webhook",
                        "roomId": "room-default",
                        "sessionId": session.id,
                        "recordingId": "recording-persist-webhook"
                    }),
                },
            ),
        )
        .await
        .expect("room ended webhook should complete the session");

    let batches = persistence.batches();
    let completion_batch = batches
        .iter()
        .find(|batch| {
            batch.media_sessions.iter().any(|stored_session| {
                stored_session.id == session.id
                    && stored_session.status
                        == sdkwork_communication_rtc_service::RtcMediaSessionStatus::Ended
            })
        })
        .expect("webhook completion change set should be written to persistence");
    assert!(
        batches.iter().any(|batch| {
            batch
                .webhook_events
                .iter()
                .any(|record| record.id == webhook_record.id && record.status == "received")
        }),
        "webhook receipt must be persisted before processing side effects"
    );
    assert!(
        completion_batch
            .media_sessions
            .iter()
            .any(|stored_session| stored_session.id == session.id
                && stored_session.status
                    == sdkwork_communication_rtc_service::RtcMediaSessionStatus::Ended
                && stored_session.last_provider_webhook_event_id.as_deref()
                    == Some(webhook_record.id.as_str())),
        "webhook-completed session fact must be persisted"
    );
    assert!(
        completion_batch
            .webhook_events
            .iter()
            .any(|record| record.id == webhook_record.id && record.status == "processed"),
        "processed webhook event must be persisted for dedupe and audit"
    );
    assert!(
        completion_batch
            .completion_records
            .iter()
            .any(|record| record.media_session_id == session.id
                && record.source_webhook_event_id.as_deref() == Some(webhook_record.id.as_str())),
        "webhook completion record must be persisted with webhook lineage"
    );
    assert!(
        completion_batch
            .media_artifacts
            .iter()
            .any(|artifact| artifact.rtc_session_id == session.id
                && artifact.source_provider_webhook_event_id.as_deref()
                    == Some(webhook_record.id.as_str())
                && artifact.drive.space_type.as_str() == "rtc"),
        "webhook-exported recording artifact must be persisted as an RTC Drive artifact"
    );
}

#[tokio::test]
async fn product_service_persists_active_session_participant_and_provider_configuration_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("750", "751", "752");

    let profile = service
        .create_provider_profile(
            "750".into(),
            Some("751".into()),
            "752".into(),
            provider_profile_command("backup", "east", false, 1),
        )
        .await
        .expect("provider account should be created");
    service
        .create_provider_route(
            "750".into(),
            Some("751".into()),
            "752".into(),
            RtcProviderRouteCommand {
                provider_profile_id: profile.id.clone(),
                route_type: "region".into(),
                region: Some("cn-east".into()),
                priority: 1,
                status: Some(
                    sdkwork_routes_rtc_backend_api::service::RtcProviderRouteStatus::Active,
                ),
            },
        )
        .await
        .expect("provider route should be created");
    let session = service
        .create_media_session(
            "750".into(),
            Some("751".into()),
            "752".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-east".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "persistent-active-facts" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should use persisted route");
    service
        .issue_participant_credential(
            "750".into(),
            Some("751".into()),
            "752".into(),
            RtcIssueParticipantCredentialRequest {
                media_session_id: session.id.clone(),
                participant_id: "participant-752".into(),
                idempotency_key: None,
            },
        )
        .await
        .expect("participant credential should create a participant fact");

    let batches = persistence.batches();
    assert!(
        batches.iter().any(|batch| batch
            .provider_profiles
            .iter()
            .any(|stored| stored.id == profile.id)),
        "provider account changes must be persisted"
    );
    assert!(
        batches.iter().any(|batch| {
            batch.provider_routes.iter().any(|route| {
                route.provider_profile_id == profile.id
                    && route.region.as_deref() == Some("cn-east")
            })
        }),
        "provider routing changes must be persisted"
    );
    assert!(
        batches.iter().any(|batch| {
            batch.media_sessions.iter().any(|stored_session| {
                stored_session.id == session.id
                    && stored_session.status
                        == sdkwork_communication_rtc_service::RtcMediaSessionStatus::Active
            })
        }),
        "active media session facts must be persisted before completion"
    );
    assert!(
        batches.iter().any(|batch| {
            batch.media_participants.iter().any(|participant| {
                participant.session_id == session.id && participant.id == "participant-752"
            })
        }),
        "participant facts must be persisted when credentials are issued"
    );
}

#[tokio::test]
async fn product_service_persists_provider_profile_disable_and_verify_changes() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("760", "761", "762");

    let profile = service
        .create_provider_profile(
            "760".into(),
            Some("761".into()),
            "762".into(),
            provider_profile_command("acme", "primary", true, 10),
        )
        .await
        .expect("provider profile should be created");

    let verification = service
        .verify_provider_profile(
            "760".into(),
            Some("761".into()),
            "762".into(),
            profile.id.clone(),
            sdkwork_communication_rtc_service::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_communication_rtc_service::RtcProviderProfileVerifyKind::Full,
                timeout_ms: Some(3_000),
            },
        )
        .await
        .expect("provider profile verification should update health");
    assert_eq!(
        verification
            .checks
            .iter()
            .map(|check| check.name.as_str())
            .collect::<Vec<_>>(),
        vec![
            "provider_health",
            "credential_reference",
            "webhook_secret",
            "active_query_capability",
            "recording_capability",
        ],
        "full provider verification must cover provider account credentials, webhook, active query, and recording capabilities",
    );
    assert!(
        verification.checks.iter().all(|check| check.status
            == sdkwork_communication_rtc_service::RtcProviderProfileVerifyCheckStatus::Passed),
        "commercial default provider account verification should pass every configured capability check",
    );
    assert!(
        verification.latency_ms.is_some(),
        "provider account verification should return measured latency for backend diagnostics",
    );

    service
        .disable_provider_profile(
            "760".into(),
            Some("761".into()),
            "762".into(),
            profile.id.clone(),
            sdkwork_communication_rtc_service::RtcProviderProfileDisableRequest {
                reason: Some("operator disabled provider account".into()),
            },
        )
        .await
        .expect("provider profile should disable");

    let batches = persistence.batches();
    assert!(
        batches.iter().any(|batch| {
            batch.provider_profiles.iter().any(|stored| {
                stored.id == profile.id
                    && stored.health_status
                        == sdkwork_communication_rtc_service::RtcProviderHealthStatus::Healthy
                    && stored.last_verified_at.as_deref() == Some("2026-06-10T00:00:00.000Z")
                    && stored.last_verification_latency_ms.is_some()
            })
        }),
        "provider verification result and latency must be persisted for health-aware routing"
    );
    assert!(
        batches.iter().any(|batch| {
            batch.provider_profiles.iter().any(|stored| {
                stored.id == profile.id
                    && stored.status
                        == sdkwork_communication_rtc_service::RtcProviderProfileStatus::Disabled
                    && !stored.is_default
                    && stored.last_verification_error.as_deref()
                        == Some("operator disabled provider account")
            })
        }),
        "provider disable state must be persisted so disabled accounts stay out of routing"
    );
}

#[tokio::test]
async fn product_service_fails_provider_profile_verification_when_timeout_is_exceeded() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(
            FakeProvider::new("acme", true).with_health_delay_ms(20),
        ))
        .expect("acme provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("763", "764", "765");

    let profile = service
        .create_provider_profile(
            "763".into(),
            Some("764".into()),
            "765".into(),
            provider_profile_command("acme", "slow-health", true, 10),
        )
        .await
        .expect("provider profile should be created");

    let verification = service
        .verify_provider_profile(
            "763".into(),
            Some("764".into()),
            "765".into(),
            profile.id.clone(),
            sdkwork_communication_rtc_service::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_communication_rtc_service::RtcProviderProfileVerifyKind::Full,
                timeout_ms: Some(1),
            },
        )
        .await
        .expect("provider verification should return timeout diagnostics");

    assert_eq!(
        verification.status,
        sdkwork_communication_rtc_service::RtcProviderHealthStatus::Unhealthy
    );
    assert!(
        verification
            .latency_ms
            .is_some_and(|latency_ms| latency_ms >= 1),
        "timeout diagnostics should include measured latency"
    );
    assert!(
        verification.checks.iter().any(|check| {
            check.name == "verification_timeout"
                && check.status == sdkwork_communication_rtc_service::RtcProviderProfileVerifyCheckStatus::Failed
        }),
        "provider verification must fail when measured latency exceeds timeoutMs"
    );

    let persisted_error = persistence
        .batches()
        .into_iter()
        .flat_map(|batch| batch.provider_profiles)
        .find(|stored| {
            stored.id == profile.id
                && stored.health_status
                    == sdkwork_communication_rtc_service::RtcProviderHealthStatus::Unhealthy
        })
        .and_then(|stored| stored.last_verification_error)
        .expect("timeout verification should persist backend diagnostic detail");
    assert!(
        persisted_error.contains("verification_timeout") && persisted_error.contains("timeoutMs"),
        "timeout failure should be visible in persisted provider account diagnostics"
    );
}

#[tokio::test]
async fn product_service_persists_provider_profile_verification_failure_reason() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("765", "766", "767");

    let mut command = provider_profile_command("acme", "broken-credential", false, 10);
    command.provider_app_id = None;
    command.credential_ref = None;

    let profile = service
        .create_provider_profile("765".into(), Some("766".into()), "767".into(), command)
        .await
        .expect("provider profile with incomplete credential config should be stored");

    let verification = service
        .verify_provider_profile(
            "765".into(),
            Some("766".into()),
            "767".into(),
            profile.id.clone(),
            sdkwork_communication_rtc_service::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_communication_rtc_service::RtcProviderProfileVerifyKind::Full,
                timeout_ms: Some(3_000),
            },
        )
        .await
        .expect("provider profile verification should return failed checks");

    assert_eq!(
        verification.status,
        sdkwork_communication_rtc_service::RtcProviderHealthStatus::Unhealthy
    );
    assert!(
        verification.checks.iter().any(|check| {
            check.name == "credential_reference"
                && check.status == sdkwork_communication_rtc_service::RtcProviderProfileVerifyCheckStatus::Failed
        }),
        "missing credential material must fail the credential_reference provider account check"
    );

    let batches = persistence.batches();
    assert!(
        batches.iter().any(|batch| {
            batch.provider_profiles.iter().any(|stored| {
                stored.id == profile.id
                    && stored.health_status
                        == sdkwork_communication_rtc_service::RtcProviderHealthStatus::Unhealthy
                    && stored
                        .last_verification_error
                        .as_deref()
                        .is_some_and(|error| {
                            error.contains("credential_reference")
                                && error.contains("providerAppId")
                                && error.contains("credentialRef")
                        })
            })
        }),
        "failed provider account verification must persist a diagnostic reason for backend management"
    );
}

#[tokio::test]
async fn product_service_truncates_provider_profile_verification_failure_reason_on_utf8_boundary() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(
            FakeProvider::new("acme", true).with_health_status("\u{1f6ab}".repeat(600)),
        ))
        .expect("acme provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("768", "769", "770");

    let profile = service
        .create_provider_profile(
            "768".into(),
            Some("769".into()),
            "770".into(),
            provider_profile_command("acme", "degraded-health", false, 10),
        )
        .await
        .expect("provider profile should be created");

    let verification = service
        .verify_provider_profile(
            "768".into(),
            Some("769".into()),
            "770".into(),
            profile.id.clone(),
            sdkwork_communication_rtc_service::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_communication_rtc_service::RtcProviderProfileVerifyKind::Full,
                timeout_ms: Some(3_000),
            },
        )
        .await
        .expect("provider profile verification should not panic on provider UTF-8 details");

    assert_eq!(
        verification.status,
        sdkwork_communication_rtc_service::RtcProviderHealthStatus::Degraded
    );
    let persisted_error = persistence
        .batches()
        .into_iter()
        .flat_map(|batch| batch.provider_profiles)
        .find(|stored| {
            stored.id == profile.id
                && stored.health_status
                    == sdkwork_communication_rtc_service::RtcProviderHealthStatus::Degraded
        })
        .and_then(|stored| stored.last_verification_error)
        .expect("degraded provider verification should persist diagnostic detail");
    assert!(
        persisted_error.len() <= 1000,
        "provider verification error must fit the storage column"
    );
    assert!(
        persisted_error.is_char_boundary(persisted_error.len()),
        "provider verification error truncation must preserve UTF-8"
    );
    assert!(
        persisted_error.contains("provider_health"),
        "provider health warning must remain identifiable after truncation"
    );
}

#[tokio::test]
async fn product_service_persists_active_provider_query_jobs_snapshots_and_artifacts() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let persistence = Arc::new(RecordingPersistence::default());
    let service = test_rtc_service(registry)
        .with_persistence(persistence.clone())
        .seed_default_room("770", "771", "772");

    let session = service
        .create_media_session(
            "770".into(),
            Some("771".into()),
            "772".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "persistent-provider-query" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created");

    let query_job = service
        .create_provider_query_job(
            "770".into(),
            Some("771".into()),
            "772".into(),
            RtcProviderQueryJobCreateRequest {
                provider: "acme".into(),
                provider_profile_id: session.provider_profile_id.clone(),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: Some("room-default".into()),
                media_session_id: Some(session.id.clone()),
                provider_session_id: session.provider_session_id.clone(),
                cursor: None,
            },
        )
        .await
        .expect("provider query should complete and export artifacts");

    let batches = persistence.batches();
    assert!(
        batches.iter().any(|batch| {
            batch
                .provider_query_jobs
                .iter()
                .any(|stored| stored.id == query_job.id)
        }),
        "active provider query job must be persisted independently of session close"
    );
    assert!(
        batches.iter().any(|batch| {
            batch
                .provider_query_snapshots
                .iter()
                .any(|snapshot| snapshot.provider_query_job_id == query_job.id)
        }),
        "active provider query snapshot must be persisted for provider audit"
    );
    assert!(
        batches.iter().any(|batch| {
            batch.media_sessions.iter().any(|stored_session| {
                stored_session.id == session.id
                    && stored_session.last_provider_query_job_id.as_deref()
                        == Some(query_job.id.as_str())
            })
        }),
        "media session must persist the latest active provider query lineage"
    );
    assert!(
        batches.iter().any(|batch| {
            batch.media_artifacts.iter().any(|artifact| {
                artifact.rtc_session_id == session.id
                    && artifact.source_provider_query_job_id.as_deref()
                        == Some(query_job.id.as_str())
                    && artifact.drive.space_type.as_str() == "rtc"
            })
        }),
        "provider-query-exported recording artifacts must be persisted as RTC Drive artifacts"
    );
}

#[tokio::test]
async fn product_service_resolves_provider_room_ended_webhook_by_active_room_session() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("710", "711", "712");

    let session = service
        .create_media_session(
            "710".into(),
            Some("711".into()),
            "712".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "room-only-webhook-contract" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created through default provider");

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
            RtcProviderWebhookIngress::from_wrapped_test_request(
                RtcProviderWebhookReceiveRequest {
                    provider_profile_id: Some("profile-710-711-acme-default".into()),
                    external_event_id: None,
                    event_type: None,
                    received_at: Some("2026-06-10T00:04:00.000Z".into()),
                    headers: serde_json::json!({ "X-Acme-Signature": "sig-room-only" }),
                    payload: serde_json::json!({
                        "eventType": "room_ended",
                        "eventId": "evt-room-only",
                        "roomId": "room-default",
                        "recordingId": "recording-room-only"
                    }),
                },
            ),
        )
        .await
        .expect("room-only provider webhook should resolve active room session");
    assert_eq!(
        webhook_record.media_session_id.as_deref(),
        Some(session.id.as_str())
    );

    let completion = RtcAppApiService::retrieve_media_session_completion_record(
        &service,
        "710".into(),
        Some("711".into()),
        session.id,
    )
    .await
    .expect("completion record should be generated when webhook only carries room id");
    assert_eq!(
        completion.source_webhook_event_id.as_deref(),
        Some(webhook_record.id.as_str())
    );
    assert_eq!(completion.recording_summary.drive_resource_count, 1);
}

#[tokio::test]
async fn backend_rtc_records_are_filtered_by_organization_scope() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = test_rtc_service(registry).seed_default_room("720", "721", "722");

    let session = service
        .create_media_session(
            "720".into(),
            Some("721".into()),
            "722".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: true,
                metadata: serde_json::json!({ "purpose": "backend-organization-scope" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created through default provider");

    let query_job = service
        .create_provider_query_job(
            "720".into(),
            Some("721".into()),
            "722".into(),
            RtcProviderQueryJobCreateRequest {
                provider: "acme".into(),
                provider_profile_id: Some("profile-720-721-acme-default".into()),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: Some("room-default".into()),
                media_session_id: Some(session.id.clone()),
                provider_session_id: session.provider_session_id.clone(),
                cursor: None,
            },
        )
        .await
        .expect("provider query job should create organization scoped artifacts");

    service
        .receive_provider_webhook_event(
            "acme".into(),
            RtcProviderWebhookIngress::from_wrapped_test_request(
                RtcProviderWebhookReceiveRequest {
                    provider_profile_id: Some("profile-720-721-acme-default".into()),
                    external_event_id: None,
                    event_type: None,
                    received_at: Some("2026-06-10T00:05:00.000Z".into()),
                    headers: serde_json::json!({ "X-Acme-Signature": "sig-org-scope" }),
                    payload: serde_json::json!({
                        "eventType": "room_ended",
                        "eventId": "evt-org-scope",
                        "roomId": "room-default",
                        "sessionId": session.id,
                        "recordingId": "recording-org-scope"
                    }),
                },
            ),
        )
        .await
        .expect("provider webhook should create organization scoped event record");

    let correct_scope = RtcBackendListRequest {
        tenant_id: "720".into(),
        organization_id: Some("721".into()),
        provider: None,
        status: None,
        owner_user_id: None,
        created_after: None,
        page: None,
        page_size: None,
        cursor: None,
        
        q: None,
        sort: None,
    };
    let wrong_scope = RtcBackendListRequest {
        tenant_id: "720".into(),
        organization_id: Some("wrong-organization".into()),
        provider: None,
        status: None,
        owner_user_id: None,
        created_after: None,
        page: None,
        page_size: None,
        cursor: None,
        
        q: None,
        sort: None,
    };

    let visible_artifacts = RtcBackendApiService::list_media_artifacts(&service, correct_scope)
        .await
        .expect("correct organization should list media artifacts");
    assert_eq!(visible_artifacts.items.len(), 1);
    let artifact_id = visible_artifacts.items[0].id.clone();

    let hidden_artifacts =
        RtcBackendApiService::list_media_artifacts(&service, wrong_scope.clone())
            .await
            .expect("wrong organization should not fail list media artifacts");
    assert!(
        hidden_artifacts.items.is_empty(),
        "wrong organization must not list RTC media artifacts"
    );

    let wrong_artifact = RtcBackendApiService::retrieve_media_artifact(
        &service,
        "720".into(),
        Some("wrong-organization".into()),
        artifact_id,
    )
    .await;
    assert!(
        matches!(wrong_artifact, Err(RtcBackendApiError::NotFound(_))),
        "wrong organization must not retrieve RTC media artifact"
    );

    let hidden_webhook_events =
        RtcBackendApiService::list_provider_webhook_events(&service, wrong_scope.clone())
            .await
            .expect("wrong organization should not fail list provider webhook events");
    assert!(
        hidden_webhook_events.items.is_empty(),
        "wrong organization must not list RTC provider webhook events"
    );

    let wrong_query_job = RtcBackendApiService::retrieve_provider_query_job(
        &service,
        "720".into(),
        Some("wrong-organization".into()),
        query_job.id.clone(),
    )
    .await;
    assert!(
        matches!(wrong_query_job, Err(RtcBackendApiError::NotFound(_))),
        "wrong organization must not retrieve RTC provider query job"
    );

    let hidden_query_snapshots = RtcBackendApiService::list_provider_query_snapshots(
        &service,
        "720".into(),
        Some("wrong-organization".into()),
        query_job.id,
        RtcBackendListQuery::default(),
    )
    .await
    .expect("wrong organization should not fail list provider query snapshots");
    assert!(
        hidden_query_snapshots.items.is_empty(),
        "wrong organization must not list RTC provider query snapshots"
    );
}

#[test]
fn product_crate_keeps_provider_plugins_trait_based() {
    let manifest = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/Cargo.toml"))
        .expect("manifest should be readable");
    for adapter_package in [
        "sdkwork-rtc-adapter-agora",
        "sdkwork-rtc-adapter-aliyun",
        "sdkwork-rtc-adapter-livekit",
        "sdkwork-rtc-adapter-tencent",
        "sdkwork-rtc-adapter-volcengine",
    ] {
        assert!(
            !manifest.contains(adapter_package),
            "product service must not depend directly on {adapter_package}; register it through RtcProviderPort plugins"
        );
    }
}

struct FakeProvider {
    provider: String,
    default_selected: bool,
    health_status: String,
    health_delay_ms: u64,
    provider_reports_ended: bool,
}

struct ContextRecordingProvider {
    inner: FakeProvider,
    export_request: Arc<Mutex<Option<RtcRecordingArtifactExportRequest>>>,
}

struct FakeProviderFactory {
    provider: String,
    default_selected: bool,
}

#[derive(Default)]
struct RecordingPersistence {
    batches: Mutex<Vec<RtcPersistenceChangeSet>>,
    idempotency_records: Mutex<Vec<RtcMediaSessionIdempotencyRecord>>,
    webhook_events: Mutex<Vec<RtcProviderWebhookEventRecord>>,
}

impl RecordingPersistence {
    fn batches(&self) -> Vec<RtcPersistenceChangeSet> {
        self.batches
            .lock()
            .expect("recording persistence lock")
            .clone()
    }

    fn paginate_credentials(
        &self,
        query: RtcScopedListQuery,
    ) -> Result<RtcProviderCredentialListPage, RtcListWindowError> {
        let application_id = query.provider_application_id.clone().ok_or_else(|| {
            RtcListWindowError::bad_request("provider_application_id is required")
        })?;
        let mut items = Vec::new();
        for batch in self.batches() {
            for credential in batch.provider_credentials {
                if credential.provider_application_id == application_id {
                    items.push(credential);
                }
            }
        }
        items.sort_by(|left, right| left.id.cmp(&right.id));
        items.dedup_by(|left, right| left.id == right.id);
        let window = apply_list_window(
            items,
            &query.params,
            |credential| {
                vec![
                    credential.id.clone(),
                    credential.credential_label.clone(),
                    format!("{:?}", credential.credential_role),
                    format!("{:?}", credential.status),
                ]
            },
            |credential, field| match field {
                "label" | "credentialLabel" => credential.credential_label.clone(),
                "role" | "credentialRole" => format!("{:?}", credential.credential_role),
                "status" => format!("{:?}", credential.status),
                _ => credential.id.clone(),
            },
        )?;
        Ok(RtcProviderCredentialListPage {
            items: window.items,
            next_cursor: window.next_cursor,
        })
    }
}

impl RtcPersistencePort for RecordingPersistence {
    fn persist_changes<'a>(
        &'a self,
        changes: RtcPersistenceChangeSet,
    ) -> RtcPersistenceFuture<'a, ()> {
        Box::pin(async move {
            self.batches
                .lock()
                .expect("recording persistence lock")
                .push(changes);
            Ok(())
        })
    }

    fn load_runtime_snapshot<'a>(
        &'a self,
        _request: RtcRuntimeLoadRequest,
    ) -> RtcPersistenceFuture<'a, RtcPersistenceChangeSet> {
        Box::pin(async { Ok(RtcPersistenceChangeSet::default()) })
    }

    fn resolve_media_session_idempotency_record<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _idempotency_key: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSessionIdempotencyRecord>> {
        Box::pin(async { Ok(None) })
    }

    fn claim_media_session_create_idempotency<'a>(
        &'a self,
        record: RtcMediaSessionIdempotencyRecord,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim> {
        Box::pin(async move {
            let mut records = self
                .idempotency_records
                .lock()
                .expect("recording persistence lock");
            if let Some(existing) = records.iter().find(|stored| {
                stored.tenant_id == record.tenant_id
                    && stored.organization_id == record.organization_id
                    && stored.idempotency_key == record.idempotency_key
            }) {
                return Ok(RtcMediaSessionIdempotencyClaim::Existing(existing.clone()));
            }
            records.push(record);
            Ok(RtcMediaSessionIdempotencyClaim::Claimed)
        })
    }

    fn prepare_media_session_create_with_idempotency<'a>(
        &'a self,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: sdkwork_communication_rtc_service::RtcMediaSession,
        _updated_at: String,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim> {
        let persistence = self.clone();
        Box::pin(async move {
            match persistence
                .claim_media_session_create_idempotency(idempotency_record.clone())
                .await?
            {
                RtcMediaSessionIdempotencyClaim::Existing(existing) => {
                    Ok(RtcMediaSessionIdempotencyClaim::Existing(existing))
                }
                RtcMediaSessionIdempotencyClaim::Claimed => {
                    persistence
                        .persist_changes(RtcPersistenceChangeSet {
                            media_sessions: vec![session],
                            ..RtcPersistenceChangeSet::default()
                        })
                        .await?;
                    Ok(RtcMediaSessionIdempotencyClaim::Claimed)
                }
            }
        })
    }

    fn load_media_session<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<sdkwork_communication_rtc_service::RtcMediaSession>> {
        Box::pin(async { Ok(None) })
    }

    fn get_media_session_persist_version<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<i64>> {
        Box::pin(async { Ok(None) })
    }

    fn try_insert_webhook_event<'a>(
        &'a self,
        event: &'a RtcProviderWebhookEventRecord,
    ) -> RtcPersistenceFuture<'a, bool> {
        let event = event.clone();
        Box::pin(async move {
            let mut events = self
                .webhook_events
                .lock()
                .expect("recording persistence lock");
            let duplicate = events.iter().any(|stored| {
                stored.tenant_id == event.tenant_id
                    && stored.organization_id == event.organization_id
                    && stored.provider == event.provider
                    && stored.payload_hash == event.payload_hash
            });
            if duplicate {
                return Ok(false);
            }
            events.push(event.clone());
            self.batches
                .lock()
                .expect("recording persistence lock")
                .push(RtcPersistenceChangeSet {
                    webhook_events: vec![event],
                    ..RtcPersistenceChangeSet::default()
                });
            Ok(true)
        })
    }

    fn list_active_reconcile_scopes<'a>(
        &'a self,
    ) -> RtcPersistenceFuture<'a, Vec<RtcTenantOrganizationScope>> {
        Box::pin(async { Ok(Vec::new()) })
    }

    fn list_recording_artifact_lifecycle_candidates<'a>(
        &'a self,
        _query: RtcRecordingLifecycleReconcileQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcMediaArtifact>> {
        Box::pin(async { Ok(Vec::new()) })
    }

    fn list_stale_media_sessions_for_reconcile<'a>(
        &'a self,
        _query: RtcStaleMediaSessionReconcileQuery,
    ) -> RtcPersistenceFuture<'a, RtcStaleMediaSessionReconcileCandidates> {
        Box::pin(async { Ok(RtcStaleMediaSessionReconcileCandidates::default()) })
    }

    fn get_room<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _room_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcRoom>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_account<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_account_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<sdkwork_communication_rtc_service::RtcProviderAccount>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_application<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_application_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<sdkwork_communication_rtc_service::RtcProviderApplication>>
    {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_credential<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_credential_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<sdkwork_communication_rtc_service::RtcProviderCredential>>
    {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_profile<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_profile_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<sdkwork_communication_rtc_service::RtcProviderProfile>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_route<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_route_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<sdkwork_communication_rtc_service::RtcProviderRoute>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_query_job<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_query_job_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<sdkwork_communication_rtc_service::RtcProviderQueryJobRecord>> {
        Box::pin(async { Ok(None) })
    }

    fn list_rooms_for_scope<'a>(
        &'a self,
        _query: RtcRoomScopeQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcRoom>> {
        Box::pin(async { Ok(Vec::new()) })
    }

    fn list_rooms_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcRoomListPage> {
        Box::pin(async { Ok(RtcRoomListPage::empty()) })
    }

    fn list_media_sessions_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionListPage> {
        Box::pin(async { Ok(RtcMediaSessionListPage::empty()) })
    }

    fn list_active_provider_profiles_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcActiveProviderProfileListPage> {
        Box::pin(async { Ok(RtcActiveProviderProfileListPage::empty()) })
    }

    fn list_media_artifacts_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaArtifactListPage> {
        Box::pin(async { Ok(RtcMediaArtifactListPage::empty()) })
    }

    fn list_provider_profiles_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderProfileListPage> {
        Box::pin(async { Ok(RtcProviderProfileListPage::empty()) })
    }

    fn list_provider_accounts_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderAccountListPage> {
        Box::pin(async { Ok(RtcProviderAccountListPage::empty()) })
    }

    fn list_provider_applications_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderApplicationListPage> {
        Box::pin(async { Ok(RtcProviderApplicationListPage::empty()) })
    }

    fn list_provider_credentials_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderCredentialListPage> {
        Box::pin(async move {
            self.paginate_credentials(query).map_err(|error| {
                sdkwork_communication_rtc_service::RtcPersistenceError::Unavailable(error.to_string())
            })
        })
    }

    fn list_provider_routes_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderRouteListPage> {
        Box::pin(async { Ok(RtcProviderRouteListPage::empty()) })
    }

    fn list_webhook_events_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderWebhookEventListPage> {
        Box::pin(async { Ok(RtcProviderWebhookEventListPage::empty()) })
    }

    fn list_provider_query_snapshots_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderQuerySnapshotListPage> {
        Box::pin(async { Ok(RtcProviderQuerySnapshotListPage::empty()) })
    }

    fn list_quality_samples_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcQualitySampleListPage> {
        Box::pin(async { Ok(RtcQualitySampleListPage::empty()) })
    }

    fn revoke_session_token_grants_for_session<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _session_id: &'a str,
        _revoked_at: &'a str,
    ) -> RtcPersistenceFuture<'a, ()> {
        Box::pin(async { Ok(()) })
    }
}

impl FakeProviderFactory {
    fn new(provider: impl Into<String>, default_selected: bool) -> Self {
        Self {
            provider: provider.into(),
            default_selected,
        }
    }
}

impl RtcProviderPluginFactory for FakeProviderFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        FakeProvider::new(self.provider.clone(), self.default_selected).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        Arc::new(FakeProvider::new(
            self.provider.clone(),
            self.default_selected,
        ))
    }
}

impl FakeProvider {
    fn new(provider: impl Into<String>, default_selected: bool) -> Self {
        Self {
            provider: provider.into(),
            default_selected,
            health_status: "healthy".into(),
            health_delay_ms: 0,
            provider_reports_ended: false,
        }
    }

    fn with_provider_reports_ended(mut self) -> Self {
        self.provider_reports_ended = true;
        self
    }

    fn with_health_status(mut self, health_status: impl Into<String>) -> Self {
        self.health_status = health_status.into();
        self
    }

    fn with_health_delay_ms(mut self, delay_ms: u64) -> Self {
        self.health_delay_ms = delay_ms;
        self
    }
}

impl ContextRecordingProvider {
    fn new(
        provider: impl Into<String>,
        export_request: Arc<Mutex<Option<RtcRecordingArtifactExportRequest>>>,
    ) -> Self {
        Self {
            inner: FakeProvider::new(provider, true),
            export_request,
        }
    }
}

impl RtcProviderPort for ContextRecordingProvider {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        self.inner.descriptor()
    }

    fn create_session(
        &self,
        request: RtcCreateMediaSessionRequest,
    ) -> Result<RtcSessionHandle, RtcContractError> {
        self.inner.create_session(request)
    }

    fn close_session(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<bool, RtcContractError> {
        self.inner.close_session(tenant_id, rtc_session_id)
    }

    fn issue_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&sdkwork_communication_rtc_service::RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        self.inner
            .issue_participant_credential(tenant_id, rtc_session_id, participant_id, context)
    }

    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&sdkwork_communication_rtc_service::RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        self.inner.refresh_participant_credential(
            tenant_id,
            rtc_session_id,
            participant_id,
            context,
        )
    }

    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        self.inner.parse_provider_webhook(request)
    }

    fn verify_provider_webhook_signature(
        &self,
        request: RtcProviderWebhookVerifyRequest,
    ) -> Result<(), RtcContractError> {
        self.inner.verify_provider_webhook_signature(request)
    }

    fn query_provider_state(
        &self,
        request: RtcProviderQueryRequest,
    ) -> Result<RtcProviderQueryResult, RtcContractError> {
        self.inner.query_provider_state(request)
    }

    fn export_recording_artifact(
        &self,
        _tenant_id: &str,
        _rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        Err(RtcContractError::Unavailable(
            "context recording provider requires export_recording_artifacts_for_query".to_string(),
        ))
    }

    fn export_recording_artifacts_for_query<'a>(
        &'a self,
        request: RtcRecordingArtifactExportRequest,
    ) -> RtcRecordingArtifactsFuture<'a> {
        Box::pin(async move {
            self.export_request
                .lock()
                .expect("context export request lock")
                .replace(request.clone());
            Ok(vec![RtcRecordingArtifact::drive_backed_recording(
                request.tenant_id,
                request.rtc_session_id.clone(),
                "space-rtc-recordings",
                format!("node-context-{}", request.rtc_session_id),
                Some("1".to_string()),
            )])
        })
    }

    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot {
        self.inner.provider_health_snapshot()
    }
}

impl RtcProviderPort for FakeProvider {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        ProviderPluginDescriptor::new(
            format!("rtc-{}", self.provider),
            ProviderDomain::Rtc,
            self.provider.clone(),
            format!("{} RTC", self.provider),
        )
        .with_default_selected(self.default_selected)
        .with_required_capabilities([
            "session",
            "credential",
            "provider.webhook",
            "health",
            "media.audio",
            "media.video",
            "live.broadcast",
            "live.audience",
            "provider.event-normalization",
        ])
        .with_optional_capabilities(["recording", "artifact", "provider.active-query"])
    }

    fn create_session(
        &self,
        request: RtcCreateMediaSessionRequest,
    ) -> Result<RtcSessionHandle, RtcContractError> {
        Ok(RtcSessionHandle {
            tenant_id: request.tenant_id,
            rtc_session_id: request.rtc_session_id.clone(),
            provider_session_id: format!("{}:{}", self.provider, request.rtc_session_id),
            access_endpoint: Some(format!("wss://rtc.{}.example/session", self.provider)),
            region: request.region,
        })
    }

    fn close_session(
        &self,
        _tenant_id: &str,
        _rtc_session_id: &str,
    ) -> Result<bool, RtcContractError> {
        Ok(true)
    }

    fn issue_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        _context: Option<&sdkwork_communication_rtc_service::RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        Ok(RtcParticipantCredential {
            tenant_id: tenant_id.into(),
            rtc_session_id: rtc_session_id.into(),
            participant_id: participant_id.into(),
            credential: format!(
                "{}-token:{tenant_id}:{rtc_session_id}:{participant_id}",
                self.provider
            ),
            expires_at: "2099-12-31T23:59:59.999Z".into(),
        })
    }

    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&sdkwork_communication_rtc_service::RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        self.issue_participant_credential(tenant_id, rtc_session_id, participant_id, context)
    }

    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        let payload: serde_json::Value = serde_json::from_str(&request.raw_payload)
            .map_err(|error| RtcContractError::Conflict(error.to_string()))?;
        let signature_header = header_value(
            request.headers.as_slice(),
            &["X-Acme-Signature", "X-Test-Signature"],
        )
        .or(Some("sig-1".into()));
        Ok(RtcProviderWebhookEvent {
            provider: self.provider.clone(),
            provider_profile_id: request.provider_profile_id,
            external_event_id: payload
                .get("eventId")
                .and_then(|value| value.as_str())
                .map(str::to_owned),
            event_type: payload
                .get("eventType")
                .and_then(|value| value.as_str())
                .unwrap_or("unknown")
                .to_owned(),
            event_kind: RtcProviderEventKind::RoomEnded,
            room_id: payload
                .get("roomId")
                .and_then(|value| value.as_str())
                .map(str::to_owned),
            rtc_session_id: payload
                .get("sessionId")
                .and_then(|value| value.as_str())
                .map(str::to_owned),
            provider_session_id: payload
                .get("sessionId")
                .and_then(|value| value.as_str())
                .map(|session_id| format!("{}:{session_id}", self.provider)),
            participant_id: None,
            recording_id: payload
                .get("recordingId")
                .and_then(|value| value.as_str())
                .map(str::to_owned),
            occurred_at: None,
            received_at: request.received_at,
            payload_hash: sdkwork_communication_rtc_service::rtc_provider_payload_hash(
                &request.raw_payload,
            ),
            signature_header,
            raw_payload: request.raw_payload,
            normalized_event_json: serde_json::json!({
                "provider": self.provider,
                "eventKind": "room_ended"
            })
            .to_string(),
        })
    }

    fn verify_provider_webhook_signature(
        &self,
        request: RtcProviderWebhookVerifyRequest,
    ) -> Result<(), RtcContractError> {
        let signature = request.signature_header.as_deref().unwrap_or_default();
        if signature.starts_with("sig-") {
            return Ok(());
        }
        verify_hmac_sha256_payload(
            request.webhook_secret.as_str(),
            request.raw_payload.as_str(),
            signature,
        )
    }

    fn query_provider_state(
        &self,
        request: RtcProviderQueryRequest,
    ) -> Result<RtcProviderQueryResult, RtcContractError> {
        let reports_ended = self.provider_reports_ended
            && request.query_kind == RtcProviderQueryKind::MediaSessionState;
        let snapshot = if reports_ended {
            serde_json::json!({
                "providerSessionStatus": "ended",
                "roomExists": false,
            })
        } else {
            serde_json::json!({
                "recordingArtifacts": [
                    { "recordingId": "recording-1", "state": "ready" }
                ]
            })
        };
        Ok(RtcProviderQueryResult {
            provider: self.provider.clone(),
            provider_profile_id: request.provider_profile_id,
            query_kind: request.query_kind,
            room_id: request.room_id,
            rtc_session_id: request.rtc_session_id,
            provider_session_id: request.provider_session_id,
            status: if reports_ended {
                "ended".into()
            } else {
                "synced".into()
            },
            raw_provider_action: "FakeQueryProviderState".into(),
            result_snapshot_json: snapshot.to_string(),
            next_cursor: None,
            queried_at: "2026-06-10T00:00:01.000Z".into(),
        })
    }

    fn export_recording_artifact(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        Ok(Some(RtcRecordingArtifact::drive_backed_recording(
            tenant_id,
            rtc_session_id,
            "space-rtc-recordings",
            format!("node-{rtc_session_id}"),
            Some("1".into()),
        )))
    }

    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot {
        if self.health_delay_ms > 0 {
            std::thread::sleep(Duration::from_millis(self.health_delay_ms));
        }
        ProviderHealthSnapshot {
            plugin_id: format!("rtc-{}", self.provider),
            status: self.health_status.clone(),
            checked_at: "2026-06-10T00:00:00.000Z".into(),
            details: Default::default(),
        }
    }
}

fn header_value(headers: &[(String, String)], names: &[&str]) -> Option<String> {
    headers.iter().find_map(|(key, value)| {
        names
            .iter()
            .any(|candidate| key.eq_ignore_ascii_case(candidate))
            .then(|| value.clone())
    })
}

fn provider_profile_command(
    provider: impl Into<String>,
    code: impl Into<String>,
    is_default: bool,
    priority: i32,
) -> sdkwork_communication_rtc_service::RtcProviderProfileCommand {
    let provider = provider.into();
    sdkwork_communication_rtc_service::RtcProviderProfileCommand {
        provider: provider.clone(),
        code: code.into(),
        name: format!("{provider} provider account"),
        status: Some(sdkwork_communication_rtc_service::RtcProviderProfileStatus::Active),
        is_default,
        priority,
        environment: "production".into(),
        region: Some("cn-test".into()),
        provider_app_id: Some(format!("{provider}-app-id")),
        endpoint: Some(format!("https://rtc.{provider}.example")),
        credential_ref: Some(format!("secret://rtc/{provider}/credential")),
        webhook_secret_ref: Some(format!("secret://rtc/{provider}/webhook")),
        capabilities:
            sdkwork_communication_rtc_service::RtcProviderCapabilitySnapshot::commercial_default(),
        config_snapshot: serde_json::json!({
            "accountCode": provider,
            "recording": { "enabled": true }
        }),
    }
}

fn provider_account_command(provider: impl Into<String>) -> RtcProviderAccountCommand {
    let provider = provider.into();
    RtcProviderAccountCommand {
        provider: provider.clone(),
        code: "default".into(),
        name: format!("{provider} account"),
        status: Some(sdkwork_communication_rtc_service::RtcProviderAccountStatus::Active),
        environment: "production".into(),
        external_tenant_id: Some(format!("{provider}-tenant")),
        cloud_account_id: Some(format!("{provider}-cloud-account")),
        project_id: Some(format!("{provider}-project")),
        resource_group_id: Some(format!("{provider}-resource-group")),
    }
}

fn provider_application_command(
    provider: impl Into<String>,
    provider_application_id_kind: impl Into<String>,
) -> RtcProviderApplicationCommand {
    let provider = provider.into();
    RtcProviderApplicationCommand {
        code: "primary".into(),
        name: format!("{provider} application"),
        status: Some(sdkwork_communication_rtc_service::RtcProviderApplicationStatus::Active),
        environment: "production".into(),
        region: Some("cn-test".into()),
        provider_application_id: format!("{provider}-app-id"),
        provider_application_id_kind: provider_application_id_kind.into(),
        access_endpoint: Some(format!("https://rtc.{provider}.example")),
        api_endpoint: Some(format!("https://api.{provider}.example")),
        api_host: Some(format!("api.{provider}.example")),
        api_version: Some("2024-01-01".into()),
        webhook_callback_url: Some(format!("https://callback.example/{provider}")),
        config_snapshot: serde_json::json!({
            "tokenTtlSeconds": 3600,
            "provider": provider
        }),
    }
}

fn provider_credential_command(
    credential_role: RtcProviderCredentialRole,
    credential_label: impl Into<String>,
) -> RtcProviderCredentialCommand {
    let credential_label = credential_label.into();
    RtcProviderCredentialCommand {
        credential_role,
        credential_label: credential_label.clone(),
        credential_ref: format!("secret://rtc/{credential_label}"),
        credential_fingerprint: Some(format!("fingerprint:{credential_label}")),
        secret_version: Some("1".into()),
        status: Some(sdkwork_communication_rtc_service::RtcProviderCredentialStatus::Active),
        valid_from: Some("2026-06-10T00:00:00.000Z".into()),
        expires_at: None,
        rotation_due_at: None,
    }
}

#[tokio::test]
async fn product_service_reconciles_stale_active_sessions() {
    let _env_lock = reconcile_env_lock();
    let previous_max_age = std::env::var("SDKWORK_RTC_SESSION_MAX_AGE_SECONDS").ok();
    let previous_grace = std::env::var("SDKWORK_RTC_SESSION_RECONCILE_GRACE_SECONDS").ok();
    unsafe {
        std::env::set_var("SDKWORK_RTC_SESSION_MAX_AGE_SECONDS", "0");
        std::env::set_var("SDKWORK_RTC_SESSION_RECONCILE_GRACE_SECONDS", "0");
    }

    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("provider should register");
    let service = test_rtc_service(registry).seed_default_room("970", "971", "972");
    let session = service
        .create_media_session(
            "970".into(),
            Some("971".into()),
            "972".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "session-reconciliation" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created");
    tokio::time::sleep(Duration::from_millis(5)).await;

    let result: RtcSessionReconcileResult = service
        .reconcile_stale_media_sessions()
        .await
        .expect("reconciliation should succeed");
    assert_eq!(result.scanned, 1);
    assert_eq!(result.closed, 1, "stale active session should close");
    assert!(result.failures.is_empty());

    let closed = RtcBackendApiService::retrieve_media_session(
        &service,
        "970".into(),
        Some("971".into()),
        session.id,
    )
    .await
    .expect("closed session should be readable");
    assert_eq!(closed.status, RtcMediaSessionStatus::Ended);
    assert_eq!(
        closed.end_source,
        Some(RtcMediaSessionEndSource::SystemReconcile)
    );

    unsafe {
        if let Some(value) = previous_max_age {
            std::env::set_var("SDKWORK_RTC_SESSION_MAX_AGE_SECONDS", value);
        } else {
            std::env::remove_var("SDKWORK_RTC_SESSION_MAX_AGE_SECONDS");
        }
        if let Some(value) = previous_grace {
            std::env::set_var("SDKWORK_RTC_SESSION_RECONCILE_GRACE_SECONDS", value);
        } else {
            std::env::remove_var("SDKWORK_RTC_SESSION_RECONCILE_GRACE_SECONDS");
        }
    }
}

#[tokio::test]
async fn product_service_reconciles_provider_ended_drift_via_active_query() {
    let _env_lock = reconcile_env_lock();
    unsafe {
        std::env::set_var("SDKWORK_RTC_SESSION_MAX_AGE_SECONDS", "86400");
        std::env::set_var("SDKWORK_RTC_SESSION_RECONCILE_GRACE_SECONDS", "900");
    }

    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(
            FakeProvider::new("acme", true).with_provider_reports_ended(),
        ))
        .expect("provider should register");
    let service = test_rtc_service(registry).seed_default_room("980", "981", "982");
    let session = service
        .create_media_session(
            "980".into(),
            Some("981".into()),
            "982".into(),
            RtcCreateAppMediaSessionRequest {
                room_id: "room-default".into(),
                media_mode: RtcMediaSessionMode::Video,
                provider_profile_id: None,
                provider: None,
                region: Some("cn-test".into()),
                recording_requested: false,
                metadata: serde_json::json!({ "purpose": "provider-drift-reconciliation" }),
                idempotency_key: None,
            },
        )
        .await
        .expect("media session should be created");

    let result = service
        .reconcile_stale_media_sessions()
        .await
        .expect("reconciliation should succeed");
    assert_eq!(result.provider_queried, 1);
    assert_eq!(result.provider_synced, 1);
    assert_eq!(result.closed, 1);

    let closed = RtcBackendApiService::retrieve_media_session(
        &service,
        "980".into(),
        Some("981".into()),
        session.id,
    )
    .await
    .expect("closed session should be readable");
    assert_eq!(closed.status, RtcMediaSessionStatus::Ended);
    assert_eq!(
        closed.end_source,
        Some(RtcMediaSessionEndSource::ProviderStateSync)
    );
}
