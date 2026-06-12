use std::sync::{Arc, Mutex};

use sdkwork_communication_rtc_service::{
    RtcContractError, RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderWebhookParseRequest, RtcRecordingArtifact, RtcRecordingArtifactImportPort,
    RtcRecordingArtifactImportRequest,
};
use sdkwork_rtc_adapter_aliyun::{
    ALIYUN_RTC_PLUGIN_ID, AliyunRtcOpenApiExecutor, AliyunRtcOpenApiRequest,
    AliyunRtcOpenApiResponse, AliyunRtcProvider, AliyunRtcProviderConfig,
    create_aliyun_rtc_provider_plugin_factory,
};

#[test]
fn test_aliyun_rtc_provider_factory_creates_standard_provider_plugin() {
    let factory = create_aliyun_rtc_provider_plugin_factory(AliyunRtcProviderConfig {
        access_endpoint: "wss://rtc.aliyun.local/session".into(),
        region: "cn-shanghai".into(),
    });

    let descriptor = factory.descriptor();
    assert_eq!(descriptor.plugin_id, ALIYUN_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "aliyun");

    let provider = factory.create_provider();
    assert_eq!(provider.descriptor(), descriptor);
    assert_media_session_contract(
        provider.as_ref(),
        RtcMediaSessionMode::Video,
        "rtc_factory_demo",
        "aliyun:rtc_factory_demo",
        "wss://rtc.aliyun.local/session",
        "cn-shanghai",
    );
}

#[test]
fn test_aliyun_rtc_provider_implements_contract_surface() {
    let provider = AliyunRtcProvider::new(AliyunRtcProviderConfig {
        access_endpoint: "wss://rtc.aliyun.local/session".into(),
        region: "cn-shanghai".into(),
    });

    let descriptor = provider.descriptor();
    assert_eq!(descriptor.plugin_id, ALIYUN_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "aliyun");
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
            "cloud-mix",
            "provider.active-query"
        ]
    );

    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Audio,
        "rtc_audio_demo",
        "aliyun:rtc_audio_demo",
        "wss://rtc.aliyun.local/session",
        "cn-shanghai",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Video,
        "rtc_video_demo",
        "aliyun:rtc_video_demo",
        "wss://rtc.aliyun.local/session",
        "cn-shanghai",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Live,
        "rtc_live_demo",
        "aliyun:rtc_live_demo",
        "wss://rtc.aliyun.local/session",
        "cn-shanghai",
    );
    assert_requested_region_overrides_provider_default(
        &provider,
        "rtc_region_override_demo",
        "cn-beijing",
    );

    let credential = provider
        .issue_participant_credential("t_demo", "rtc_demo", "u_peer")
        .expect("aliyun rtc credential should succeed");
    assert_eq!(credential.credential, "aliyun-token:t_demo:rtc_demo:u_peer");

    let artifact = provider.export_recording_artifact("t_demo", "rtc_demo");
    assert!(
        matches!(artifact, Err(RtcContractError::Unavailable(_))),
        "aliyun recording export must fail closed until a Drive importer is configured"
    );

    let health = provider.provider_health_snapshot();
    assert_eq!(health.plugin_id, ALIYUN_RTC_PLUGIN_ID);
    assert_eq!(health.status, "degraded");
    assert_eq!(health.details["providerKind"], "aliyun");
}

#[test]
fn test_aliyun_rtc_recording_export_uses_injected_drive_importer() {
    let importer = Arc::new(FakeRecordingImporter::default());
    let provider = AliyunRtcProvider::new(AliyunRtcProviderConfig {
        access_endpoint: "wss://rtc.aliyun.local/session".into(),
        region: "cn-shanghai".into(),
    })
    .with_recording_importer(importer.clone());

    let artifact = provider
        .export_recording_artifact("t_demo", "rtc_demo")
        .expect("aliyun rtc artifact export should call the Drive importer")
        .expect("fake Drive importer should return an artifact");

    assert_eq!(artifact.drive.space_id, "space-rtc-recordings");
    assert_eq!(artifact.drive.node_id, "node-rtc_demo");
    assert_eq!(
        artifact.resource.uri.as_deref(),
        Some(artifact.drive.drive_uri.as_str())
    );
    let requests = importer.requests();
    assert_eq!(requests.len(), 1);
    assert_eq!(requests[0].provider, "aliyun");
    assert_eq!(requests[0].tenant_id, "t_demo");
    assert_eq!(requests[0].rtc_session_id, "rtc_demo");
}

#[test]
fn test_aliyun_rtc_provider_implements_webhook_and_active_query_surface() {
    let provider = AliyunRtcProvider::new(AliyunRtcProviderConfig {
        access_endpoint: "wss://rtc.aliyun.local/session".into(),
        region: "cn-shanghai".into(),
    });

    let parsed = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "aliyun".into(),
            provider_profile_id: Some("profile_aliyun".into()),
            received_at: "2026-06-10T00:00:00.000Z".into(),
            headers: vec![("X-Acs-Signature".into(), "aliyun-signature".into())],
            raw_payload: r#"{
                "eventType": "UserJoin",
                "eventId": "aliyun-event-1",
                "appId": "aliyun-app",
                "channelId": "room_demo",
                "userId": "u_guest",
                "eventTime": 1781000000
            }"#
            .into(),
        })
        .expect("aliyun webhook should parse");
    assert_eq!(parsed.provider, "aliyun");
    assert_eq!(parsed.external_event_id.as_deref(), Some("aliyun-event-1"));
    assert_eq!(parsed.event_kind, RtcProviderEventKind::ParticipantJoined);
    assert_eq!(parsed.room_id.as_deref(), Some("room_demo"));
    assert_eq!(parsed.participant_id.as_deref(), Some("u_guest"));
    assert_eq!(parsed.signature_header.as_deref(), Some("aliyun-signature"));

    let session_scoped = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "aliyun".into(),
            provider_profile_id: Some("profile_aliyun".into()),
            received_at: "2026-06-10T00:00:00.500Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "eventType": "RoomEnd",
                "eventId": "aliyun-session-event-1",
                "data": {
                    "channelId": "room_session",
                    "SessionId": "rtc_session_webhook"
                }
            }"#
            .into(),
        })
        .expect("aliyun session-scoped webhook should parse");
    assert_eq!(session_scoped.event_kind, RtcProviderEventKind::RoomEnded);
    assert_eq!(
        session_scoped.rtc_session_id.as_deref(),
        Some("rtc_session_webhook")
    );
    assert_eq!(
        session_scoped.provider_session_id.as_deref(),
        Some("aliyun:rtc_session_webhook")
    );
    assert!(
        session_scoped
            .normalized_event_json
            .contains("\"rtcSessionId\":\"rtc_session_webhook\"")
    );
    assert!(
        session_scoped
            .normalized_event_json
            .contains("\"providerSessionId\":\"aliyun:rtc_session_webhook\"")
    );

    let recording = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "aliyun".into(),
            provider_profile_id: Some("profile_aliyun".into()),
            received_at: "2026-06-10T00:00:01.000Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "eventType": "RecordingComplete",
                "eventId": "aliyun-recording-1",
                "data": {
                    "channelId": "room_recording",
                    "taskId": "recording_task_1",
                    "userId": "recorder"
                }
            }"#
            .into(),
        })
        .expect("aliyun recording webhook should parse");
    assert_eq!(
        recording.event_kind,
        RtcProviderEventKind::RecordingCompleted
    );
    assert_eq!(recording.room_id.as_deref(), Some("room_recording"));
    assert_eq!(recording.recording_id.as_deref(), Some("recording_task_1"));

    let query = provider.query_provider_state(RtcProviderQueryRequest {
        provider: "aliyun".into(),
        provider_profile_id: Some("profile_aliyun".into()),
        query_kind: RtcProviderQueryKind::QualitySamples,
        room_id: Some("room_demo".into()),
        rtc_session_id: Some("rtc_demo".into()),
        provider_session_id: Some("aliyun:rtc_demo".into()),
        cursor: None,
    });
    assert!(
        matches!(query, Err(RtcContractError::Unavailable(_))),
        "aliyun active query must fail closed until an OpenAPI executor is configured"
    );

    let executor = Arc::new(FakeAliyunOpenApiExecutor::default());
    let provider = AliyunRtcProvider::new(AliyunRtcProviderConfig {
        access_endpoint: "wss://rtc.aliyun.local/session".into(),
        region: "cn-shanghai".into(),
    })
    .with_open_api_executor(executor.clone());
    let query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "aliyun".into(),
            provider_profile_id: Some("profile_aliyun".into()),
            query_kind: RtcProviderQueryKind::QualitySamples,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("aliyun:rtc_demo".into()),
            cursor: None,
        })
        .expect("aliyun active query should use the configured OpenAPI executor");
    assert_eq!(query.provider, "aliyun");
    assert_eq!(query.query_kind, RtcProviderQueryKind::QualitySamples);
    assert_eq!(query.room_id.as_deref(), Some("room_demo"));
    assert_eq!(query.status, "synced");
    assert!(query.raw_provider_action.contains("quality"));
    assert!(
        query
            .result_snapshot_json
            .contains("\"provider\":\"aliyun\"")
    );
    assert!(query.result_snapshot_json.contains("\"providerResponse\""));
    let requests = executor.requests();
    assert_eq!(requests.len(), 1);
    assert_eq!(requests[0].action, "aliyun.quality.samples.snapshot");
}

#[derive(Default)]
struct FakeAliyunOpenApiExecutor {
    requests: Mutex<Vec<AliyunRtcOpenApiRequest>>,
}

impl FakeAliyunOpenApiExecutor {
    fn requests(&self) -> Vec<AliyunRtcOpenApiRequest> {
        self.requests
            .lock()
            .expect("fake aliyun executor request lock")
            .clone()
    }
}

impl AliyunRtcOpenApiExecutor for FakeAliyunOpenApiExecutor {
    fn execute(
        &self,
        request: &AliyunRtcOpenApiRequest,
    ) -> Result<AliyunRtcOpenApiResponse, RtcContractError> {
        self.requests
            .lock()
            .expect("fake aliyun executor request lock")
            .push(request.clone());
        Ok(AliyunRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"success":true}"#.into(),
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
            tenant_id: "t_demo".into(),
            rtc_session_id: rtc_session_id.into(),
            media_mode,
            room_id: Some(format!("room_{rtc_session_id}")),
            region: Some(expected_region.into()),
        })
        .expect("aliyun rtc create_session should succeed for declared media mode");
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
            tenant_id: "t_demo".into(),
            rtc_session_id: rtc_session_id.into(),
            media_mode: RtcMediaSessionMode::Video,
            room_id: Some(format!("room_{rtc_session_id}")),
            region: Some(requested_region.into()),
        })
        .expect("aliyun rtc create_session should honor requested region");
    assert_eq!(session.region.as_deref(), Some(requested_region));
}
