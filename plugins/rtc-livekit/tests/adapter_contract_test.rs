use std::sync::{Arc, Mutex};

use sdkwork_communication_rtc_service::{
    RtcContractError, RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest, RtcRecordingArtifact,
    RtcRecordingArtifactImportPort, RtcRecordingArtifactImportRequest,
    sign_hmac_sha256_payload_hex,
};
use sdkwork_rtc_adapter_livekit::{
    LIVEKIT_RTC_PLUGIN_ID, LivekitRtcOpenApiExecutor, LivekitRtcOpenApiRequest,
    LivekitRtcOpenApiResponse, LivekitRtcProvider, LivekitRtcProviderConfig,
    create_livekit_rtc_provider_plugin_factory,
};

#[test]
fn test_livekit_rtc_provider_factory_creates_standard_provider_plugin() {
    let factory = create_livekit_rtc_provider_plugin_factory(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
        ..Default::default()
    });

    let descriptor = factory.descriptor();
    assert_eq!(descriptor.plugin_id, LIVEKIT_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "livekit");

    let provider = factory.create_provider();
    assert_eq!(provider.descriptor(), descriptor);
    assert_media_session_contract(
        provider.as_ref(),
        RtcMediaSessionMode::Video,
        "rtc_factory_demo",
        "livekit:rtc_factory_demo",
        "wss://rtc.livekit.local/session",
        "self-hosted",
    );
}

#[test]
fn test_livekit_rtc_provider_implements_contract_surface() {
    let provider = LivekitRtcProvider::new(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
        ..Default::default()
    });

    let descriptor = provider.descriptor();
    assert_eq!(descriptor.plugin_id, LIVEKIT_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "livekit");
    assert_eq!(
        descriptor.required_capabilities,
        vec![
            "session",
            "credential",
            "provider.webhook",
            "health",
            "media.audio",
            "media.video",
            "live.broadcast",
            "live.audience",
            "provider.event-normalization"
        ]
    );
    assert_eq!(
        descriptor.optional_capabilities,
        vec![
            "recording",
            "artifact",
            "screen-share",
            "data-channel",
            "transcription",
            "e2ee",
            "provider.active-query"
        ]
    );

    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Audio,
        "rtc_audio_demo",
        "livekit:rtc_audio_demo",
        "wss://rtc.livekit.local/session",
        "self-hosted",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Video,
        "rtc_video_demo",
        "livekit:rtc_video_demo",
        "wss://rtc.livekit.local/session",
        "self-hosted",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Live,
        "rtc_live_demo",
        "livekit:rtc_live_demo",
        "wss://rtc.livekit.local/session",
        "self-hosted",
    );
    assert_requested_region_overrides_provider_default(
        &provider,
        "rtc_region_override_demo",
        "edge-shanghai",
    );

    let credential = provider
        .issue_participant_credential("100001", "rtc_demo", "1009", None)
        .expect("livekit rtc credential should succeed");
    assert_eq!(credential.credential, "livekit-token:100001:rtc_demo:1009");

    let artifact = provider.export_recording_artifact("100001", "rtc_demo");
    assert!(
        matches!(artifact, Err(RtcContractError::Unavailable(_))),
        "livekit recording export must fail closed until a Drive importer is configured"
    );

    let health = provider.provider_health_snapshot();
    assert_eq!(health.plugin_id, LIVEKIT_RTC_PLUGIN_ID);
    assert_eq!(health.status, "degraded");
    assert_eq!(health.details["providerKind"], "livekit");
}

#[test]
fn test_livekit_rtc_provider_issues_signed_token_when_credentials_configured() {
    let provider = LivekitRtcProvider::new(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
        api_endpoint: "https://livekit.local".into(),
        api_key: Some("livekit-api-key".into()),
        api_secret: Some("livekit-api-secret".into()),
        credential_ttl_seconds: 3_600,
    });

    let credential = provider
        .issue_participant_credential("100001", "room_demo", "u_host", None)
        .expect("livekit signed credential should be generated");
    assert!(credential.credential.matches('.').count() >= 2);
    assert!(!credential.credential.contains("livekit-token:"));
    assert!(!credential.credential.contains("livekit-api-secret"));
}

#[test]
fn test_livekit_rtc_recording_export_uses_injected_drive_importer() {
    let importer = Arc::new(FakeRecordingImporter::default());
    let provider = LivekitRtcProvider::new(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
        ..Default::default()
    })
    .with_recording_importer(importer.clone());

    let artifact = provider
        .export_recording_artifact("100001", "rtc_demo")
        .expect("livekit rtc artifact export should call the Drive importer")
        .expect("fake Drive importer should return an artifact");

    assert_eq!(artifact.drive.space_id, "space-rtc-recordings");
    assert_eq!(artifact.drive.node_id, "node-rtc_demo");
    assert_eq!(
        artifact.resource.uri.as_deref(),
        Some(artifact.drive.drive_uri.as_str())
    );
    let requests = importer.requests();
    assert_eq!(requests.len(), 1);
    assert_eq!(requests[0].provider, "livekit");
    assert_eq!(requests[0].tenant_id, "100001");
    assert_eq!(requests[0].rtc_session_id, "rtc_demo");
}

#[test]
fn test_livekit_rtc_provider_implements_webhook_and_active_query_surface() {
    let provider = LivekitRtcProvider::new(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
        ..Default::default()
    });

    let parsed = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "livekit".into(),
            provider_profile_id: Some("profile_livekit".into()),
            received_at: "2026-06-10T00:00:00.000Z".into(),
            headers: vec![(
                "Authorization".into(),
                "Bearer livekit-webhook-token".into(),
            )],
            raw_payload: r#"{
                "event": "participant_joined",
                "id": "livekit-event-1",
                "room": {
                    "name": "room_demo",
                    "sid": "RM_demo"
                },
                "participant": {
                    "identity": "2",
                    "sid": "PA_guest"
                },
                "createdAt": 1781000000
            }"#
            .into(),
        })
        .expect("livekit webhook should parse");
    assert_eq!(parsed.provider, "livekit");
    assert_eq!(parsed.external_event_id.as_deref(), Some("livekit-event-1"));
    assert_eq!(parsed.event_kind, RtcProviderEventKind::ParticipantJoined);
    assert_eq!(parsed.room_id.as_deref(), Some("room_demo"));
    assert_eq!(parsed.participant_id.as_deref(), Some("2"));
    assert_eq!(
        parsed.signature_header.as_deref(),
        Some("Bearer livekit-webhook-token")
    );

    let webhook_payload = r#"{"event":"participant_joined","id":"livekit-event-2"}"#;
    let webhook_secret = "livekit-webhook-secret";
    let webhook_signature = sign_hmac_sha256_payload_hex(webhook_secret, webhook_payload);
    provider
        .verify_provider_webhook_signature(RtcProviderWebhookVerifyRequest {
            headers: Vec::new(),
            raw_payload: webhook_payload.into(),
            signature_header: Some(format!("Bearer {webhook_signature}")),
            webhook_secret: webhook_secret.into(),
        })
        .expect("livekit webhook signature should verify");

    let session_scoped = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "livekit".into(),
            provider_profile_id: Some("profile_livekit".into()),
            received_at: "2026-06-10T00:00:00.500Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "event": "room_finished",
                "id": "livekit-session-event-1",
                "room": {
                    "name": "room_session"
                },
                "rtcSessionId": "rtc_session_webhook"
            }"#
            .into(),
        })
        .expect("livekit session-scoped webhook should parse");
    assert_eq!(session_scoped.event_kind, RtcProviderEventKind::RoomEnded);
    assert_eq!(
        session_scoped.rtc_session_id.as_deref(),
        Some("rtc_session_webhook")
    );
    assert_eq!(
        session_scoped.provider_session_id.as_deref(),
        Some("livekit:rtc_session_webhook")
    );
    assert!(
        session_scoped
            .normalized_event_json
            .contains("\"rtcSessionId\":\"rtc_session_webhook\"")
    );
    assert!(
        session_scoped
            .normalized_event_json
            .contains("\"providerSessionId\":\"livekit:rtc_session_webhook\"")
    );

    let egress = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "livekit".into(),
            provider_profile_id: Some("profile_livekit".into()),
            received_at: "2026-06-10T00:00:01.000Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "event": "egress_ended",
                "id": "livekit-egress-event-1",
                "room": {
                    "name": "room_recording"
                },
                "egressInfo": {
                    "egressId": "egress_1",
                    "roomName": "room_recording"
                }
            }"#
            .into(),
        })
        .expect("livekit egress webhook should parse");
    assert_eq!(egress.event_kind, RtcProviderEventKind::RecordingCompleted);
    assert_eq!(egress.room_id.as_deref(), Some("room_recording"));
    assert_eq!(egress.recording_id.as_deref(), Some("egress_1"));

    let query = provider.query_provider_state(RtcProviderQueryRequest {
        provider: "livekit".into(),
        provider_profile_id: Some("profile_livekit".into()),
        query_kind: RtcProviderQueryKind::RoomState,
        room_id: Some("room_demo".into()),
        rtc_session_id: Some("rtc_demo".into()),
        provider_session_id: Some("livekit:rtc_demo".into()),
        cursor: None,
    });
    assert!(
        matches!(query, Err(RtcContractError::Unavailable(_))),
        "livekit active query must fail closed until an OpenAPI executor is configured"
    );

    let executor = Arc::new(FakeLivekitOpenApiExecutor::default());
    let provider = LivekitRtcProvider::new(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
        ..Default::default()
    })
    .with_open_api_executor(executor.clone());
    let query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "livekit".into(),
            provider_profile_id: Some("profile_livekit".into()),
            query_kind: RtcProviderQueryKind::RoomState,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("livekit:rtc_demo".into()),
            cursor: None,
        })
        .expect("livekit active query should use the configured OpenAPI executor");
    assert_eq!(query.provider, "livekit");
    assert_eq!(query.query_kind, RtcProviderQueryKind::RoomState);
    assert_eq!(query.room_id.as_deref(), Some("room_demo"));
    assert_eq!(query.status, "synced");
    assert!(query.raw_provider_action.contains("Room"));
    assert!(
        query
            .result_snapshot_json
            .contains("\"provider\":\"livekit\"")
    );
    assert!(query.result_snapshot_json.contains("\"providerResponse\""));
    let requests = executor.requests();
    assert_eq!(requests.len(), 1);
    assert_eq!(requests[0].action, "livekit.RoomService.ListRooms");
}

#[derive(Default)]
struct FakeLivekitOpenApiExecutor {
    requests: Mutex<Vec<LivekitRtcOpenApiRequest>>,
}

impl FakeLivekitOpenApiExecutor {
    fn requests(&self) -> Vec<LivekitRtcOpenApiRequest> {
        self.requests
            .lock()
            .expect("fake livekit executor request lock")
            .clone()
    }
}

impl LivekitRtcOpenApiExecutor for FakeLivekitOpenApiExecutor {
    fn execute(
        &self,
        request: &LivekitRtcOpenApiRequest,
    ) -> Result<LivekitRtcOpenApiResponse, RtcContractError> {
        self.requests
            .lock()
            .expect("fake livekit executor request lock")
            .push(request.clone());
        Ok(LivekitRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"ok":true}"#.into(),
        })
    }
}

#[derive(Default)]
struct FakeRecordingImporter {
    requests: Mutex<Vec<RtcRecordingArtifactImportRequest>>,
}

impl FakeRecordingImporter {
    fn requests(&self) -> Vec<RtcRecordingArtifactImportRequest> {
        self.requests
            .lock()
            .expect("fake recording importer request lock")
            .clone()
    }
}

impl RtcRecordingArtifactImportPort for FakeRecordingImporter {
    fn import_recording_artifact(
        &self,
        request: RtcRecordingArtifactImportRequest,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        self.requests
            .lock()
            .expect("fake recording importer request lock")
            .push(request.clone());
        let rtc_session_id = request.rtc_session_id.clone();
        Ok(Some(RtcRecordingArtifact::drive_backed_recording(
            request.tenant_id,
            request.rtc_session_id,
            "space-rtc-recordings",
            format!("node-{rtc_session_id}"),
            Some("1".into()),
        )))
    }
}

fn assert_media_session_contract<P: RtcProviderPort + ?Sized>(
    provider: &P,
    media_mode: RtcMediaSessionMode,
    rtc_session_id: &str,
    expected_provider_session_id: &str,
    expected_access_endpoint: &str,
    expected_region: &str,
) {
    let session = provider
        .create_session(RtcCreateMediaSessionRequest {
            tenant_id: "100001".into(),
            rtc_session_id: rtc_session_id.into(),
            media_mode,
            room_id: Some(format!("room_{rtc_session_id}")),
            region: Some(expected_region.into()),
        })
        .expect("livekit rtc create_session should succeed for declared media mode");
    assert_eq!(session.provider_session_id, expected_provider_session_id);
    assert_eq!(
        session.access_endpoint.as_deref(),
        Some(expected_access_endpoint)
    );
    assert_eq!(session.region.as_deref(), Some(expected_region));
}

fn assert_requested_region_overrides_provider_default<P: RtcProviderPort + ?Sized>(
    provider: &P,
    rtc_session_id: &str,
    requested_region: &str,
) {
    let session = provider
        .create_session(RtcCreateMediaSessionRequest {
            tenant_id: "100001".into(),
            rtc_session_id: rtc_session_id.into(),
            media_mode: RtcMediaSessionMode::Video,
            room_id: Some(format!("room_{rtc_session_id}")),
            region: Some(requested_region.into()),
        })
        .expect("livekit rtc create_session should honor requested region");
    assert_eq!(session.region.as_deref(), Some(requested_region));
}
