use sdkwork_communication_rtc_service::{
    RtcContractError, RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderWebhookParseRequest, RtcRecordingArtifact, RtcRecordingArtifactImportPort,
    RtcRecordingArtifactImportRequest,
};
use sdkwork_rtc_adapter_volcengine::{
    VOLCENGINE_RTC_PLUGIN_ID, VolcengineRtcOpenApiExecutor, VolcengineRtcOpenApiRequest,
    VolcengineRtcOpenApiResponse, VolcengineRtcProvider, VolcengineRtcProviderConfig,
    create_volcengine_rtc_provider_plugin_factory,
};
use std::sync::{Arc, Mutex};

#[test]
fn test_volcengine_rtc_provider_factory_creates_standard_provider_plugin() {
    let factory = create_volcengine_rtc_provider_plugin_factory(VolcengineRtcProviderConfig {
        access_endpoint: "wss://rtc.volcengine.local/session".into(),
        region: "cn-beijing".into(),
        api_endpoint: "https://rtc.volcengineapi.com".into(),
        api_host: "rtc.volcengineapi.com".into(),
        api_version: "2023-11-01".into(),
        app_id: None,
        app_key: None,
        access_key_id: None,
        secret_access_key: None,
        credential_ttl_seconds: 3_600,
    });

    let descriptor = factory.descriptor();
    assert_eq!(descriptor.plugin_id, VOLCENGINE_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "volcengine");
    assert!(descriptor.default_selected);

    let provider = factory.create_provider();
    assert_eq!(provider.descriptor(), descriptor);
    assert_media_session_contract(
        provider.as_ref(),
        RtcMediaSessionMode::Video,
        "rtc_factory_demo",
        "volcengine:rtc_factory_demo",
        "wss://rtc.volcengine.local/session",
        "cn-beijing",
    );
}

#[test]
fn test_volcengine_rtc_provider_implements_webhook_and_active_query_surface() {
    let provider = VolcengineRtcProvider::new(VolcengineRtcProviderConfig {
        access_endpoint: "wss://rtc.volcengine.local/session".into(),
        region: "cn-beijing".into(),
        api_endpoint: "https://rtc.volcengineapi.com".into(),
        api_host: "rtc.volcengineapi.com".into(),
        api_version: "2023-11-01".into(),
        app_id: None,
        app_key: None,
        access_key_id: None,
        secret_access_key: None,
        credential_ttl_seconds: 3_600,
    });

    let descriptor = provider.descriptor();
    assert_eq!(descriptor.plugin_id, VOLCENGINE_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "volcengine");
    assert!(descriptor.default_selected);
    assert!(
        descriptor
            .required_capabilities
            .iter()
            .any(|capability| capability == "provider.webhook")
    );
    assert!(
        descriptor
            .optional_capabilities
            .iter()
            .any(|capability| capability == "provider.active-query")
    );

    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Audio,
        "rtc_audio_demo",
        "volcengine:rtc_audio_demo",
        "wss://rtc.volcengine.local/session",
        "cn-beijing",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Video,
        "rtc_video_demo",
        "volcengine:rtc_video_demo",
        "wss://rtc.volcengine.local/session",
        "cn-beijing",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Live,
        "rtc_live_demo",
        "volcengine:rtc_live_demo",
        "wss://rtc.volcengine.local/session",
        "cn-beijing",
    );
    assert_requested_region_overrides_provider_default(
        &provider,
        "rtc_region_override_demo",
        "cn-shanghai",
    );

    let artifact = provider.export_recording_artifact("t_demo", "rtc_demo");
    assert!(
        matches!(artifact, Err(RtcContractError::Unavailable(_))),
        "volcengine recording export must fail closed until a Drive importer is configured"
    );

    let health = provider.provider_health_snapshot();
    assert_eq!(health.plugin_id, VOLCENGINE_RTC_PLUGIN_ID);
    assert_eq!(health.status, "degraded");
    assert_eq!(health.details["providerKind"], "volcengine");
    assert_eq!(health.details["credentialMode"], "development-placeholder");
    assert_eq!(health.details["recordingExportMode"], "unconfigured");

    let parsed = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "volcengine".into(),
            provider_profile_id: Some("profile_volcengine".into()),
            received_at: "2026-06-09T00:00:00.000Z".into(),
            headers: vec![
                ("X-Volc-Signature".into(), "sig-demo".into()),
                ("X-Volc-Timestamp".into(), "1781000000".into()),
            ],
            raw_payload: r#"{
                "EventType": "RoomUserJoin",
                "EventId": "ve-event-1",
                "RoomId": "room_demo",
                "SessionId": "rtc_session_webhook",
                "UserId": "u_host",
                "Timestamp": 1781000000
            }"#
            .into(),
        })
        .expect("volcengine webhook should parse");
    assert_eq!(parsed.provider, "volcengine");
    assert_eq!(parsed.external_event_id.as_deref(), Some("ve-event-1"));
    assert_eq!(parsed.event_kind, RtcProviderEventKind::ParticipantJoined);
    assert_eq!(parsed.room_id.as_deref(), Some("room_demo"));
    assert_eq!(
        parsed.rtc_session_id.as_deref(),
        Some("rtc_session_webhook")
    );
    assert_eq!(
        parsed.provider_session_id.as_deref(),
        Some("volcengine:rtc_session_webhook")
    );
    assert_eq!(parsed.participant_id.as_deref(), Some("u_host"));
    assert_eq!(parsed.signature_header.as_deref(), Some("sig-demo"));

    let nested = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "volcengine".into(),
            provider_profile_id: Some("profile_volcengine".into()),
            received_at: "2026-06-09T00:00:01.000Z".into(),
            headers: vec![("X-Volc-Sign".into(), "nested-sig".into())],
            raw_payload: r#"{
                "EventType": "RecordStopped",
                "EventId": "volc-record-1",
                "EventData": {
                    "RoomId": "room_recording",
                    "TaskId": "record_task_1",
                    "Timestamp": 1781000001
                }
            }"#
            .into(),
        })
        .expect("volcengine nested recording webhook should parse");
    assert_eq!(nested.event_kind, RtcProviderEventKind::RecordingCompleted);
    assert_eq!(nested.room_id.as_deref(), Some("room_recording"));
    assert_eq!(nested.recording_id.as_deref(), Some("record_task_1"));
    assert_eq!(nested.signature_header.as_deref(), Some("nested-sig"));

    let string_data = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "volcengine".into(),
            provider_profile_id: Some("profile_volcengine".into()),
            received_at: "2026-06-09T00:00:02.000Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "EventType": "RoomCreated",
                "EventId": "volc-room-created-1",
                "EventTime": 1781000002000,
                "Signature": "body-signature",
                "EventData": "{\"RoomId\":\"room_string_data\",\"UserId\":\"u_creator\"}"
            }"#
            .into(),
        })
        .expect("volcengine string EventData webhook should parse");
    assert_eq!(string_data.event_kind, RtcProviderEventKind::RoomStarted);
    assert_eq!(string_data.room_id.as_deref(), Some("room_string_data"));
    assert_eq!(string_data.participant_id.as_deref(), Some("u_creator"));
    assert_eq!(
        string_data.signature_header.as_deref(),
        Some("body-signature")
    );

    let query = provider.query_provider_state(RtcProviderQueryRequest {
        provider: "volcengine".into(),
        provider_profile_id: Some("profile_volcengine".into()),
        query_kind: RtcProviderQueryKind::RoomOnlineUsers,
        room_id: Some("room_demo".into()),
        rtc_session_id: Some("rtc_demo".into()),
        provider_session_id: Some("volcengine:rtc_demo".into()),
        cursor: None,
    });
    assert!(
        matches!(query, Err(RtcContractError::Unavailable(_))),
        "volcengine active query must fail closed until an OpenAPI executor is configured"
    );
}

#[test]
fn test_volcengine_rtc_recording_export_uses_injected_drive_importer() {
    let importer = Arc::new(FakeRecordingImporter::default());
    let provider = VolcengineRtcProvider::new(VolcengineRtcProviderConfig {
        access_endpoint: "wss://rtc.volcengine.local/session".into(),
        region: "cn-beijing".into(),
        api_endpoint: "https://rtc.volcengineapi.com".into(),
        api_host: "rtc.volcengineapi.com".into(),
        api_version: "2023-11-01".into(),
        app_id: None,
        app_key: None,
        access_key_id: None,
        secret_access_key: None,
        credential_ttl_seconds: 3_600,
    })
    .with_recording_importer(importer.clone());

    let artifact = provider
        .export_recording_artifact("t_demo", "rtc_demo")
        .expect("volcengine rtc artifact export should call the Drive importer")
        .expect("fake Drive importer should return an artifact");

    assert_eq!(artifact.drive.space_id, "space-rtc-recordings");
    assert_eq!(artifact.drive.node_id, "node-rtc_demo");
    assert_eq!(
        artifact.resource.uri.as_deref(),
        Some(artifact.drive.drive_uri.as_str())
    );
    let requests = importer.requests();
    assert_eq!(requests.len(), 1);
    assert_eq!(requests[0].provider, "volcengine");
    assert_eq!(requests[0].tenant_id, "t_demo");
    assert_eq!(requests[0].rtc_session_id, "rtc_demo");
}

#[test]
fn test_volcengine_active_query_builds_signed_open_api_request_when_credentials_are_configured() {
    let executor = Arc::new(CapturingVolcengineExecutor::default());
    let provider = VolcengineRtcProvider::new(VolcengineRtcProviderConfig {
        access_endpoint: "wss://rtc.volcengine.local/session".into(),
        region: "cn-beijing".into(),
        api_endpoint: "https://rtc.volcengineapi.com".into(),
        api_host: "rtc.volcengineapi.com".into(),
        api_version: "2023-11-01".into(),
        app_id: Some("volc-app-id".into()),
        app_key: Some("volc-app-key".into()),
        access_key_id: Some("AKLT_TEST".into()),
        secret_access_key: Some("volc-secret-value".into()),
        credential_ttl_seconds: 3_600,
    })
    .with_open_api_executor(executor.clone());

    let query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "volcengine".into(),
            provider_profile_id: Some("profile_volcengine".into()),
            query_kind: RtcProviderQueryKind::RoomOnlineUsers,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("volcengine:rtc_demo".into()),
            cursor: None,
        })
        .expect("volcengine signed active query should succeed");

    let request = executor
        .last_request()
        .expect("volcengine active query should execute signed request");
    assert_eq!(request.method, "GET");
    assert_eq!(request.host, "rtc.volcengineapi.com");
    assert_eq!(request.action, "GetRoomOnlineUsers");
    assert!(
        request
            .query
            .iter()
            .any(|(key, value)| key == "Action" && value == "GetRoomOnlineUsers")
    );
    assert!(
        request
            .query
            .iter()
            .any(|(key, value)| key == "Version" && value == "2023-11-01")
    );
    assert!(
        request
            .query
            .iter()
            .any(|(key, value)| key == "AppId" && value == "volc-app-id")
    );
    assert!(
        request
            .query
            .iter()
            .any(|(key, value)| key == "RoomId" && value == "room_demo")
    );
    assert!(
        request
            .headers
            .iter()
            .any(|(key, _)| key.eq_ignore_ascii_case("Authorization"))
    );
    assert!(
        request
            .headers
            .iter()
            .any(|(key, _)| key.eq_ignore_ascii_case("X-Date"))
    );
    assert!(
        request
            .headers
            .iter()
            .any(|(key, _)| key.eq_ignore_ascii_case("X-Content-Sha256"))
    );
    assert_eq!(query.status, "synced");
    assert_eq!(query.raw_provider_action, "GetRoomOnlineUsers");
    assert!(query.result_snapshot_json.contains("\"providerRequest\""));
    assert!(query.result_snapshot_json.contains("\"providerResponse\""));
    assert!(!query.result_snapshot_json.contains("volc-secret-value"));

    let credential = provider
        .issue_participant_credential("t_demo", "room_demo", "u_host")
        .expect("volcengine signed credential should be generated");
    assert!(credential.credential.starts_with("001volc-app-id"));
    assert!(!credential.credential.contains("volcengine-token:"));
    assert!(!credential.credential.contains("volc-app-key"));
}

#[test]
fn test_volcengine_active_query_normalizes_successful_response_and_pagination_cursor() {
    let executor = Arc::new(CapturingVolcengineExecutor::with_response(
        VolcengineRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"ResponseMetadata":{"RequestId":"volc-request-2"},"Result":{"RoomExists":true,"VisibleUserList":["u1","u2"],"TotalUser":2,"NextPageToken":"cursor-2"}}"#.into(),
        },
    ));
    let provider = signed_volcengine_provider_with_executor(executor.clone());

    let query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "volcengine".into(),
            provider_profile_id: Some("profile_volcengine".into()),
            query_kind: RtcProviderQueryKind::RoomOnlineUsers,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("volcengine:rtc_demo".into()),
            cursor: Some("cursor-1".into()),
        })
        .expect("volcengine active query should normalize successful provider response");

    assert_eq!(query.status, "synced");
    assert_eq!(query.next_cursor.as_deref(), Some("cursor-2"));
    let snapshot: serde_json::Value = serde_json::from_str(query.result_snapshot_json.as_str())
        .expect("volcengine normalized query snapshot should be JSON");
    let normalized = &snapshot["sdkworkNormalized"];
    assert_eq!(normalized["provider"].as_str(), Some("volcengine"));
    assert_eq!(normalized["action"].as_str(), Some("GetRoomOnlineUsers"));
    assert_eq!(normalized["status"].as_str(), Some("synced"));
    assert_eq!(normalized["requestId"].as_str(), Some("volc-request-2"));
    assert_eq!(normalized["nextCursor"].as_str(), Some("cursor-2"));
    assert_eq!(normalized["participantCount"].as_u64(), Some(2));
    assert_eq!(
        normalized["participantIds"].as_array().map(Vec::len),
        Some(2)
    );
}

#[test]
fn test_volcengine_active_query_fails_closed_for_non_success_http_response() {
    let executor = Arc::new(CapturingVolcengineExecutor::with_response(
        VolcengineRtcOpenApiResponse {
            status_code: 503,
            body: r#"{"ResponseMetadata":{"RequestId":"volc-http-error-1"}}"#.into(),
        },
    ));
    let provider = signed_volcengine_provider_with_executor(executor);

    let error = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "volcengine".into(),
            provider_profile_id: Some("profile_volcengine".into()),
            query_kind: RtcProviderQueryKind::RoomState,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("volcengine:rtc_demo".into()),
            cursor: None,
        })
        .expect_err("volcengine active query must fail closed for provider HTTP errors");

    match error {
        RtcContractError::Unavailable(message) => {
            assert!(message.contains("503"));
            assert!(message.contains("volc-http-error-1"));
        }
        other => panic!("expected unavailable provider error, got {other:?}"),
    }
}

#[test]
fn test_volcengine_active_query_fails_closed_for_provider_error_payload() {
    let executor = Arc::new(CapturingVolcengineExecutor::with_response(
        VolcengineRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"ResponseMetadata":{"RequestId":"volc-error-1","Error":{"Code":"InvalidParameter","Message":"bad room"}}}"#.into(),
        },
    ));
    let provider = signed_volcengine_provider_with_executor(executor);

    let error = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "volcengine".into(),
            provider_profile_id: Some("profile_volcengine".into()),
            query_kind: RtcProviderQueryKind::RoomState,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("volcengine:rtc_demo".into()),
            cursor: None,
        })
        .expect_err("volcengine active query must fail closed for provider error payloads");

    match error {
        RtcContractError::Unavailable(message) => {
            assert!(message.contains("InvalidParameter"));
            assert!(message.contains("bad room"));
            assert!(message.contains("volc-error-1"));
        }
        other => panic!("expected unavailable provider error, got {other:?}"),
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
        .expect("volcengine rtc create_session should succeed for declared media mode");
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
        .expect("volcengine rtc create_session should honor requested region");
    assert_eq!(session.region.as_deref(), Some(requested_region));
}

fn signed_volcengine_provider_with_executor(
    executor: Arc<dyn VolcengineRtcOpenApiExecutor>,
) -> VolcengineRtcProvider {
    VolcengineRtcProvider::new(VolcengineRtcProviderConfig {
        access_endpoint: "wss://rtc.volcengine.local/session".into(),
        region: "cn-beijing".into(),
        api_endpoint: "https://rtc.volcengineapi.com".into(),
        api_host: "rtc.volcengineapi.com".into(),
        api_version: "2023-11-01".into(),
        app_id: Some("volc-app-id".into()),
        app_key: Some("volc-app-key".into()),
        access_key_id: Some("AKLT_TEST".into()),
        secret_access_key: Some("volc-secret-value".into()),
        credential_ttl_seconds: 3_600,
    })
    .with_open_api_executor(executor)
}

struct CapturingVolcengineExecutor {
    last_request: Mutex<Option<VolcengineRtcOpenApiRequest>>,
    response: VolcengineRtcOpenApiResponse,
}

impl CapturingVolcengineExecutor {
    fn with_response(response: VolcengineRtcOpenApiResponse) -> Self {
        Self {
            last_request: Mutex::new(None),
            response,
        }
    }

    fn last_request(&self) -> Option<VolcengineRtcOpenApiRequest> {
        self.last_request.lock().expect("lock request").clone()
    }
}

impl Default for CapturingVolcengineExecutor {
    fn default() -> Self {
        Self::with_response(VolcengineRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"ResponseMetadata":{"RequestId":"volc-request-1"},"Result":{"RoomExists":true,"VisibleUserList":["u1"],"TotalUser":1}}"#.into(),
        })
    }
}

impl VolcengineRtcOpenApiExecutor for CapturingVolcengineExecutor {
    fn execute(
        &self,
        request: &VolcengineRtcOpenApiRequest,
    ) -> Result<VolcengineRtcOpenApiResponse, sdkwork_communication_rtc_service::RtcContractError>
    {
        *self.last_request.lock().expect("lock request") = Some(request.clone());
        Ok(self.response.clone())
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
