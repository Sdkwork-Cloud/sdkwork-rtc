use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use sdkwork_routes_rtc_app_api::service::{
    RtcAppApiService, RtcCreateAppMediaSessionRequest, RtcIssueParticipantCredentialRequest,
    RtcListRequest,
};
use sdkwork_routes_rtc_backend_api::service::{
    RtcBackendApiError, RtcBackendApiService, RtcBackendListRequest,
    RtcProviderQueryJobCreateRequest, RtcProviderRouteCommand, RtcProviderWebhookReceiveRequest,
};
use sdkwork_rtc_core::{
    ProviderDomain, ProviderHealthSnapshot, ProviderPluginDescriptor, RtcContractError,
    RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcParticipantCredential,
    RtcPersistenceChangeSet, RtcPersistenceFuture, RtcPersistencePort, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderQueryResult, RtcProviderWebhookEvent, RtcProviderWebhookParseRequest,
    RtcRecordingArtifact, RtcSessionHandle,
};
use sdkwork_rtc_product::{RtcProductService, RtcProviderPluginRegistry};

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

    let service = RtcProductService::new(registry).seed_default_room("600", "601", "602");
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
            },
        )
        .await
        .expect("media session should be created through factory-created provider");

    assert_eq!(
        session.provider_session_id.as_deref(),
        Some("acme:session-1")
    );
    assert_eq!(
        session.provider_profile_id.as_deref(),
        Some("profile-600-601-acme-default")
    );
}

#[tokio::test]
async fn product_service_runs_rtc_flows_through_registered_provider_plugins() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = RtcProductService::new(registry).seed_default_room("900", "901", "902");

    let active_profiles = service
        .list_active_provider_profiles(RtcListRequest {
            tenant_id: "900".into(),
            organization_id: Some("901".into()),
            cursor: None,
            limit: None,
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
        Some("acme:session-1")
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
            },
        )
        .await
        .expect("participant credential should be issued through selected provider");
    assert_eq!(
        credential.credential,
        "acme-token:900:session-1:participant-300"
    );

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
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
                    "sessionId": "session-1",
                    "recordingId": "recording-1"
                }),
                extra: Default::default(),
            },
        )
        .await
        .expect("provider webhook should be parsed and recorded through provider plugin");
    assert_eq!(webhook_record.provider, "acme");
    assert_eq!(webhook_record.event_kind, RtcProviderEventKind::RoomEnded);
    assert_eq!(
        webhook_record.media_session_id.as_deref(),
        Some("session-1")
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
    assert_eq!(query_job.target_id, "acme:session-1");

    let artifacts = service
        .list_recording_artifacts(
            "900".into(),
            Some("901".into()),
            session.id.clone(),
            None,
            None,
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
        sdkwork_rtc_core::RtcMediaSessionStatus::Ended
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
async fn product_service_selects_only_active_provider_profiles_within_current_scope() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = RtcProductService::new(registry).seed_default_room("910", "911", "912");

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
        Some("acme:session-1")
    );

    service
        .disable_provider_profile(
            "910".into(),
            Some("911".into()),
            "912".into(),
            "profile-910-911-acme-default".into(),
            sdkwork_rtc_core::RtcProviderProfileDisableRequest {
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
    let service = RtcProductService::new(registry).seed_default_room("920", "921", "922");

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
        Some("backup:session-1")
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
        Some("acme:session-2")
    );
}

#[tokio::test]
async fn product_service_rejects_duplicate_provider_profile_identity_in_same_scope() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register");
    let service = RtcProductService::new(registry).seed_default_room("930", "931", "932");

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
async fn product_service_rejects_provider_webhook_when_provider_mismatches_session_profile() {
    let registry = RtcProviderPluginRegistry::new()
        .with_provider(Arc::new(FakeProvider::new("acme", true)))
        .expect("acme provider should register")
        .with_provider(Arc::new(FakeProvider::new("backup", false)))
        .expect("backup provider should register");
    let service = RtcProductService::new(registry).seed_default_room("940", "941", "942");

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
                    "sessionId": "session-1",
                    "recordingId": "recording-provider-mismatch"
                }),
                extra: Default::default(),
            },
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
    let service = RtcProductService::new(registry).seed_default_room("950", "951", "952");

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
    let service = RtcProductService::new(registry).seed_default_room("955", "956", "957");

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
        .list_recording_artifacts("955".into(), Some("956".into()), session.id, None, None)
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
    let service = RtcProductService::new(registry).seed_default_room("958", "959", "960");

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
    let service = RtcProductService::new(registry).seed_default_room("960", "961", "962");

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
    let service = RtcProductService::new(registry).seed_default_room("700", "701", "702");

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
            },
        )
        .await
        .expect("participant should join before webhook completion");

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
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
                    "sessionId": "session-1",
                    "recordingId": "recording-webhook-close"
                }),
                extra: Default::default(),
            },
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
        sdkwork_rtc_core::RtcMediaSessionStatus::Ended
    );
    assert_eq!(
        ended_session.end_source,
        Some(sdkwork_rtc_core::RtcMediaSessionEndSource::ProviderWebhook)
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
        .list_recording_artifacts("700".into(), Some("701".into()), session.id, None, None)
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
    let service = RtcProductService::new(registry)
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
                && stored_session.status == sdkwork_rtc_core::RtcMediaSessionStatus::Ended
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
    let service = RtcProductService::new(registry)
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
            },
        )
        .await
        .expect("media session should be created through default provider");

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
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
                    "sessionId": "session-1",
                    "recordingId": "recording-persist-webhook"
                }),
                extra: Default::default(),
            },
        )
        .await
        .expect("room ended webhook should complete the session");

    let batches = persistence.batches();
    let completion_batch = batches
        .iter()
        .find(|batch| {
            batch
                .webhook_events
                .iter()
                .any(|record| record.id == webhook_record.id)
        })
        .expect("webhook completion change set should be written to persistence");
    assert!(
        completion_batch
            .media_sessions
            .iter()
            .any(|stored_session| stored_session.id == session.id
                && stored_session.status == sdkwork_rtc_core::RtcMediaSessionStatus::Ended
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
    let service = RtcProductService::new(registry)
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
                    && stored_session.status == sdkwork_rtc_core::RtcMediaSessionStatus::Active
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
    let service = RtcProductService::new(registry)
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
            sdkwork_rtc_core::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_rtc_core::RtcProviderProfileVerifyKind::Full,
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
        verification
            .checks
            .iter()
            .all(|check| check.status
                == sdkwork_rtc_core::RtcProviderProfileVerifyCheckStatus::Passed),
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
            sdkwork_rtc_core::RtcProviderProfileDisableRequest {
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
                    && stored.health_status == sdkwork_rtc_core::RtcProviderHealthStatus::Healthy
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
                    && stored.status == sdkwork_rtc_core::RtcProviderProfileStatus::Disabled
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
    let service = RtcProductService::new(registry)
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
            sdkwork_rtc_core::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_rtc_core::RtcProviderProfileVerifyKind::Full,
                timeout_ms: Some(1),
            },
        )
        .await
        .expect("provider verification should return timeout diagnostics");

    assert_eq!(
        verification.status,
        sdkwork_rtc_core::RtcProviderHealthStatus::Unhealthy
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
                && check.status == sdkwork_rtc_core::RtcProviderProfileVerifyCheckStatus::Failed
        }),
        "provider verification must fail when measured latency exceeds timeoutMs"
    );

    let persisted_error = persistence
        .batches()
        .into_iter()
        .flat_map(|batch| batch.provider_profiles)
        .find(|stored| {
            stored.id == profile.id
                && stored.health_status == sdkwork_rtc_core::RtcProviderHealthStatus::Unhealthy
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
    let service = RtcProductService::new(registry)
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
            sdkwork_rtc_core::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_rtc_core::RtcProviderProfileVerifyKind::Full,
                timeout_ms: Some(3_000),
            },
        )
        .await
        .expect("provider profile verification should return failed checks");

    assert_eq!(
        verification.status,
        sdkwork_rtc_core::RtcProviderHealthStatus::Unhealthy
    );
    assert!(
        verification.checks.iter().any(|check| {
            check.name == "credential_reference"
                && check.status == sdkwork_rtc_core::RtcProviderProfileVerifyCheckStatus::Failed
        }),
        "missing credential material must fail the credential_reference provider account check"
    );

    let batches = persistence.batches();
    assert!(
        batches.iter().any(|batch| {
            batch.provider_profiles.iter().any(|stored| {
                stored.id == profile.id
                    && stored.health_status == sdkwork_rtc_core::RtcProviderHealthStatus::Unhealthy
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
    let service = RtcProductService::new(registry)
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
            sdkwork_rtc_core::RtcProviderProfileVerifyRequest {
                query_kind: sdkwork_rtc_core::RtcProviderProfileVerifyKind::Full,
                timeout_ms: Some(3_000),
            },
        )
        .await
        .expect("provider profile verification should not panic on provider UTF-8 details");

    assert_eq!(
        verification.status,
        sdkwork_rtc_core::RtcProviderHealthStatus::Degraded
    );
    let persisted_error = persistence
        .batches()
        .into_iter()
        .flat_map(|batch| batch.provider_profiles)
        .find(|stored| {
            stored.id == profile.id
                && stored.health_status == sdkwork_rtc_core::RtcProviderHealthStatus::Degraded
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
    let service = RtcProductService::new(registry)
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
    let service = RtcProductService::new(registry).seed_default_room("710", "711", "712");

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
            },
        )
        .await
        .expect("media session should be created through default provider");

    let webhook_record = service
        .receive_provider_webhook_event(
            "acme".into(),
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
                extra: Default::default(),
            },
        )
        .await
        .expect("room-only provider webhook should resolve active room session");
    assert_eq!(
        webhook_record.media_session_id.as_deref(),
        Some("session-1")
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
    let service = RtcProductService::new(registry).seed_default_room("720", "721", "722");

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
                    "sessionId": "session-1",
                    "recordingId": "recording-org-scope"
                }),
                extra: Default::default(),
            },
        )
        .await
        .expect("provider webhook should create organization scoped event record");

    let correct_scope = RtcBackendListRequest {
        tenant_id: "720".into(),
        organization_id: Some("721".into()),
        provider: None,
        status: None,
        cursor: None,
        limit: None,
    };
    let wrong_scope = RtcBackendListRequest {
        tenant_id: "720".into(),
        organization_id: Some("wrong-organization".into()),
        provider: None,
        status: None,
        cursor: None,
        limit: None,
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
        None,
        None,
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
}

struct FakeProviderFactory {
    provider: String,
    default_selected: bool,
}

#[derive(Default)]
struct RecordingPersistence {
    batches: Mutex<Vec<RtcPersistenceChangeSet>>,
}

impl RecordingPersistence {
    fn batches(&self) -> Vec<RtcPersistenceChangeSet> {
        self.batches
            .lock()
            .expect("recording persistence lock")
            .clone()
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
        }
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
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        Ok(RtcParticipantCredential {
            tenant_id: tenant_id.into(),
            rtc_session_id: rtc_session_id.into(),
            participant_id: participant_id.into(),
            credential: format!(
                "{}-token:{tenant_id}:{rtc_session_id}:{participant_id}",
                self.provider
            ),
            expires_at: "2026-06-10T01:00:00.000Z".into(),
        })
    }

    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        self.issue_participant_credential(tenant_id, rtc_session_id, participant_id)
    }

    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        let payload: serde_json::Value = serde_json::from_str(&request.raw_payload)
            .map_err(|error| RtcContractError::Conflict(error.to_string()))?;
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
            payload_hash: sdkwork_rtc_core::rtc_provider_payload_hash(&request.raw_payload),
            signature_header: Some("sig-1".into()),
            raw_payload: request.raw_payload,
            normalized_event_json: serde_json::json!({
                "provider": self.provider,
                "eventKind": "room_ended"
            })
            .to_string(),
        })
    }

    fn query_provider_state(
        &self,
        request: RtcProviderQueryRequest,
    ) -> Result<RtcProviderQueryResult, RtcContractError> {
        Ok(RtcProviderQueryResult {
            provider: self.provider.clone(),
            provider_profile_id: request.provider_profile_id,
            query_kind: request.query_kind,
            room_id: request.room_id,
            rtc_session_id: request.rtc_session_id,
            provider_session_id: request.provider_session_id,
            status: "synced".into(),
            raw_provider_action: "FakeQueryRecordingArtifacts".into(),
            result_snapshot_json: serde_json::json!({
                "recordingArtifacts": [
                    { "recordingId": "recording-1", "state": "ready" }
                ]
            })
            .to_string(),
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

fn provider_profile_command(
    provider: impl Into<String>,
    code: impl Into<String>,
    is_default: bool,
    priority: i32,
) -> sdkwork_rtc_core::RtcProviderProfileCommand {
    let provider = provider.into();
    sdkwork_rtc_core::RtcProviderProfileCommand {
        provider: provider.clone(),
        code: code.into(),
        name: format!("{provider} provider account"),
        status: Some(sdkwork_rtc_core::RtcProviderProfileStatus::Active),
        is_default,
        priority,
        environment: "production".into(),
        region: Some("cn-test".into()),
        provider_app_id: Some(format!("{provider}-app-id")),
        endpoint: Some(format!("https://rtc.{provider}.example")),
        credential_ref: Some(format!("secret://rtc/{provider}/credential")),
        webhook_secret_ref: Some(format!("secret://rtc/{provider}/webhook")),
        capabilities: sdkwork_rtc_core::RtcProviderCapabilitySnapshot::commercial_default(),
        config_snapshot: serde_json::json!({
            "accountCode": provider,
            "recording": { "enabled": true }
        }),
    }
}
