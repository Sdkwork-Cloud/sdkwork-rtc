use sdkwork_communication_rtc_service::{
    RtcContractError, RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest, RtcRecordingArtifact,
    RtcRecordingArtifactImportPort, RtcRecordingArtifactImportRequest,
    sign_hmac_sha256_payload_hex,
};
use sdkwork_rtc_adapter_tencent::{
    TENCENT_RTC_PLUGIN_ID, TencentRtcOpenApiExecutor, TencentRtcOpenApiRequest,
    TencentRtcOpenApiResponse, TencentRtcProvider, TencentRtcProviderConfig,
    create_tencent_rtc_provider_plugin_factory,
};
use std::sync::{Arc, Mutex};

#[test]
fn test_tencent_rtc_provider_factory_creates_standard_provider_plugin() {
    let factory = create_tencent_rtc_provider_plugin_factory(TencentRtcProviderConfig {
        access_endpoint: "wss://rtc.tencent.local/session".into(),
        region: "ap-guangzhou".into(),
        api_endpoint: "https://trtc.tencentcloudapi.com".into(),
        api_host: "trtc.tencentcloudapi.com".into(),
        api_version: "2019-07-22".into(),
        sdk_app_id: None,
        sdk_secret_key: None,
        secret_id: None,
        secret_key: None,
        credential_ttl_seconds: 3_600,
    });

    let descriptor = factory.descriptor();
    assert_eq!(descriptor.plugin_id, TENCENT_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "tencent");

    let provider = factory.create_provider();
    assert_eq!(provider.descriptor(), descriptor);
    assert_media_session_contract(
        provider.as_ref(),
        RtcMediaSessionMode::Video,
        "rtc_factory_demo",
        "tencent:rtc_factory_demo",
        "wss://rtc.tencent.local/session",
        "ap-guangzhou",
    );
}

#[test]
fn test_tencent_rtc_provider_implements_contract_surface() {
    let provider = TencentRtcProvider::new(TencentRtcProviderConfig {
        access_endpoint: "wss://rtc.tencent.local/session".into(),
        region: "ap-guangzhou".into(),
        api_endpoint: "https://trtc.tencentcloudapi.com".into(),
        api_host: "trtc.tencentcloudapi.com".into(),
        api_version: "2019-07-22".into(),
        sdk_app_id: None,
        sdk_secret_key: None,
        secret_id: None,
        secret_key: None,
        credential_ttl_seconds: 3_600,
    });

    let descriptor = provider.descriptor();
    assert_eq!(descriptor.plugin_id, TENCENT_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "tencent");
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
            "cdn-relay",
            "provider.active-query"
        ]
    );

    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Audio,
        "rtc_audio_demo",
        "tencent:rtc_audio_demo",
        "wss://rtc.tencent.local/session",
        "ap-guangzhou",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Video,
        "rtc_video_demo",
        "tencent:rtc_video_demo",
        "wss://rtc.tencent.local/session",
        "ap-guangzhou",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Live,
        "rtc_live_demo",
        "tencent:rtc_live_demo",
        "wss://rtc.tencent.local/session",
        "ap-guangzhou",
    );
    assert_requested_region_overrides_provider_default(
        &provider,
        "rtc_region_override_demo",
        "ap-shanghai",
    );

    let credential = provider
        .issue_participant_credential("100001", "rtc_demo", "1009", None)
        .expect("tencent rtc credential should succeed");
    assert_eq!(
        credential.credential,
        "tencent-token:100001:rtc_demo:1009"
    );

    let artifact = provider.export_recording_artifact("100001", "rtc_demo");
    assert!(
        matches!(artifact, Err(RtcContractError::Unavailable(_))),
        "tencent recording export must fail closed until a Drive importer is configured"
    );

    let health = provider.provider_health_snapshot();
    assert_eq!(health.plugin_id, TENCENT_RTC_PLUGIN_ID);
    assert_eq!(health.status, "degraded");
    assert_eq!(health.details["providerKind"], "tencent");
    assert_eq!(health.details["credentialMode"], "development-placeholder");
    assert_eq!(health.details["recordingExportMode"], "unconfigured");
}

#[test]
fn test_tencent_rtc_recording_export_uses_injected_drive_importer() {
    let importer = Arc::new(FakeRecordingImporter::default());
    let provider = TencentRtcProvider::new(TencentRtcProviderConfig {
        access_endpoint: "wss://rtc.tencent.local/session".into(),
        region: "ap-guangzhou".into(),
        api_endpoint: "https://trtc.tencentcloudapi.com".into(),
        api_host: "trtc.tencentcloudapi.com".into(),
        api_version: "2019-07-22".into(),
        sdk_app_id: None,
        sdk_secret_key: None,
        secret_id: None,
        secret_key: None,
        credential_ttl_seconds: 3_600,
    })
    .with_recording_importer(importer.clone());

    let artifact = provider
        .export_recording_artifact("100001", "rtc_demo")
        .expect("tencent rtc artifact export should call the Drive importer")
        .expect("fake Drive importer should return an artifact");

    assert_eq!(artifact.drive.space_id, "space-rtc-recordings");
    assert_eq!(artifact.drive.node_id, "node-rtc_demo");
    assert_eq!(
        artifact.resource.uri.as_deref(),
        Some(artifact.drive.drive_uri.as_str())
    );
    let requests = importer.requests();
    assert_eq!(requests.len(), 1);
    assert_eq!(requests[0].provider, "tencent");
    assert_eq!(requests[0].tenant_id, "100001");
    assert_eq!(requests[0].rtc_session_id, "rtc_demo");
}

#[test]
fn test_tencent_rtc_provider_implements_webhook_and_active_query_surface() {
    let provider = TencentRtcProvider::new(TencentRtcProviderConfig {
        access_endpoint: "wss://rtc.tencent.local/session".into(),
        region: "ap-guangzhou".into(),
        api_endpoint: "https://trtc.tencentcloudapi.com".into(),
        api_host: "trtc.tencentcloudapi.com".into(),
        api_version: "2019-07-22".into(),
        sdk_app_id: None,
        sdk_secret_key: None,
        secret_id: None,
        secret_key: None,
        credential_ttl_seconds: 3_600,
    });

    let descriptor = provider.descriptor();
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

    let parsed = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            received_at: "2026-06-09T00:00:00.000Z".into(),
            headers: vec![
                ("X-TC-Signature".into(), "sig-demo".into()),
                ("X-TC-Timestamp".into(), "1781000000".into()),
            ],
            raw_payload: r#"{
                "EventGroupId": 1,
                "EventType": 103,
                "EventId": "tc-event-1",
                "SdkAppId": 1400000000,
                "RoomId": "room_demo",
                "SessionId": "rtc_session_webhook",
                "UserId": "2",
                "EventTime": 1781000000
            }"#
            .into(),
        })
        .expect("tencent webhook should parse");
    assert_eq!(parsed.provider, "tencent");
    assert_eq!(parsed.external_event_id.as_deref(), Some("tc-event-1"));
    assert_eq!(parsed.event_kind, RtcProviderEventKind::ParticipantJoined);
    assert_eq!(parsed.room_id.as_deref(), Some("room_demo"));
    assert_eq!(
        parsed.rtc_session_id.as_deref(),
        Some("rtc_session_webhook")
    );
    assert_eq!(
        parsed.provider_session_id.as_deref(),
        Some("tencent:rtc_session_webhook")
    );
    assert_eq!(parsed.participant_id.as_deref(), Some("2"));
    assert_eq!(parsed.signature_header.as_deref(), Some("sig-demo"));

    let webhook_payload = r#"{"EventType":"104","EventId":"tc-event-1"}"#;
    let webhook_secret = "tencent-webhook-secret";
    provider
        .verify_provider_webhook_signature(RtcProviderWebhookVerifyRequest {
            headers: Vec::new(),
            raw_payload: webhook_payload.into(),
            signature_header: Some(sign_hmac_sha256_payload_hex(
                webhook_secret,
                webhook_payload,
            )),
            webhook_secret: webhook_secret.into(),
        })
        .expect("tencent webhook signature should verify");

    let nested = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            received_at: "2026-06-09T00:00:01.000Z".into(),
            headers: vec![("Sign".into(), "nested-signature".into())],
            raw_payload: r#"{
                "EventGroupId": 1,
                "EventType": 104,
                "CallbackTs": 1781000001000,
                "EventInfo": {
                    "RoomId": "room_nested",
                    "EventTs": 1781000001,
                    "EventMsTs": 1781000001000,
                    "UserId": "u_nested",
                    "UniqueId": 1781000001001
                }
            }"#
            .into(),
        })
        .expect("tencent nested webhook should parse");
    assert_eq!(nested.event_kind, RtcProviderEventKind::ParticipantLeft);
    assert_eq!(nested.room_id.as_deref(), Some("room_nested"));
    assert_eq!(nested.participant_id.as_deref(), Some("u_nested"));
    assert_eq!(nested.signature_header.as_deref(), Some("nested-signature"));

    let media_track = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            received_at: "2026-06-09T00:00:02.000Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "EventGroupId": 2,
                "EventType": 204,
                "CallbackTs": 1781000002000,
                "EventInfo": {
                    "RoomId": "room_nested",
                    "EventMsTs": 1781000002000,
                    "UserId": "u_nested",
                    "Reason": 0
                }
            }"#
            .into(),
        })
        .expect("tencent media track webhook should parse");
    assert_eq!(
        media_track.event_kind,
        RtcProviderEventKind::MediaTrackStopped
    );
    assert_eq!(media_track.room_id.as_deref(), Some("room_nested"));
    assert_eq!(media_track.participant_id.as_deref(), Some("u_nested"));

    let query = provider.query_provider_state(RtcProviderQueryRequest {
        provider: "tencent".into(),
        provider_profile_id: Some("profile_tencent".into()),
        query_kind: RtcProviderQueryKind::RecordingArtifacts,
        room_id: Some("room_demo".into()),
        rtc_session_id: Some("rtc_demo".into()),
        provider_session_id: Some("tencent:rtc_demo".into()),
        cursor: None,
    });
    assert!(
        matches!(query, Err(RtcContractError::Unavailable(_))),
        "tencent active query must fail closed until an OpenAPI executor is configured"
    );

    let quality_query = provider.query_provider_state(RtcProviderQueryRequest {
        provider: "tencent".into(),
        provider_profile_id: Some("profile_tencent".into()),
        query_kind: RtcProviderQueryKind::QualitySamples,
        room_id: Some("room_demo".into()),
        rtc_session_id: Some("rtc_demo".into()),
        provider_session_id: Some("tencent:rtc_demo".into()),
        cursor: None,
    });
    assert!(
        matches!(quality_query, Err(RtcContractError::Unavailable(_))),
        "tencent quality query must fail closed until an OpenAPI executor is configured"
    );
}

#[test]
fn test_tencent_active_query_builds_signed_open_api_request_when_credentials_are_configured() {
    let executor = Arc::new(CapturingTencentExecutor::default());
    let provider = TencentRtcProvider::new(TencentRtcProviderConfig {
        access_endpoint: "wss://rtc.tencent.local/session".into(),
        region: "ap-guangzhou".into(),
        api_endpoint: "https://trtc.tencentcloudapi.com".into(),
        api_host: "trtc.tencentcloudapi.com".into(),
        api_version: "2019-07-22".into(),
        sdk_app_id: Some("1400000000".into()),
        sdk_secret_key: Some("tencent-usersig-secret".into()),
        secret_id: Some("AKID_TEST".into()),
        secret_key: Some("tencent-secret-value".into()),
        credential_ttl_seconds: 3_600,
    })
    .with_open_api_executor(executor.clone());

    let query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            query_kind: RtcProviderQueryKind::RecordingArtifacts,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("tencent:rtc_demo".into()),
            cursor: None,
        })
        .expect("tencent signed active query should succeed");

    let request = executor
        .last_request()
        .expect("tencent active query should execute signed request");
    assert_eq!(request.method, "POST");
    assert_eq!(request.host, "trtc.tencentcloudapi.com");
    assert_eq!(request.action, "DescribeCloudRecording");
    assert!(request.headers.iter().any(|(key, value)| {
        key.eq_ignore_ascii_case("X-TC-Action") && value == "DescribeCloudRecording"
    }));
    assert!(
        request.headers.iter().any(|(key, value)| {
            key.eq_ignore_ascii_case("X-TC-Version") && value == "2019-07-22"
        })
    );
    assert!(request.headers.iter().any(|(key, value)| {
        key.eq_ignore_ascii_case("X-TC-Region") && value == "ap-guangzhou"
    }));
    assert!(
        request
            .headers
            .iter()
            .any(|(key, _)| key.eq_ignore_ascii_case("Authorization"))
    );
    assert!(request.body.contains("\"SdkAppId\":1400000000"));
    assert!(request.body.contains("\"RoomId\":\"room_demo\""));
    assert_eq!(query.status, "synced");
    assert_eq!(query.raw_provider_action, "DescribeCloudRecording");
    assert!(query.result_snapshot_json.contains("\"providerRequest\""));
    assert!(query.result_snapshot_json.contains("\"providerResponse\""));
    assert!(!query.result_snapshot_json.contains("tencent-secret-value"));

    let credential = provider
        .issue_participant_credential("100001", "room_demo", "2", None)
        .expect("tencent signed credential should be generated");
    assert!(!credential.credential.contains("tencent-token:"));
    assert!(!credential.credential.contains("tencent-usersig-secret"));
    assert!(!credential.credential.contains('+'));
    assert!(!credential.credential.contains('/'));
    assert!(!credential.credential.contains('='));
}

#[test]
fn test_tencent_active_query_normalizes_successful_response_and_pagination_cursor() {
    let executor = Arc::new(CapturingTencentExecutor::with_response(
        TencentRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"Response":{"RequestId":"tc-request-2","Status":"Started","StorageFileList":[{"FileName":"recording.mp4","TrackType":"audio_video"}],"Next":"cursor-2"}}"#.into(),
        },
    ));
    let provider = signed_tencent_provider_with_executor(executor.clone());

    let query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            query_kind: RtcProviderQueryKind::RecordingArtifacts,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("tencent:rtc_demo".into()),
            cursor: Some("cursor-1".into()),
        })
        .expect("tencent active query should normalize successful provider response");

    assert_eq!(query.status, "synced");
    assert_eq!(query.next_cursor.as_deref(), Some("cursor-2"));
    let snapshot: serde_json::Value = serde_json::from_str(query.result_snapshot_json.as_str())
        .expect("tencent normalized query snapshot should be JSON");
    let normalized = &snapshot["sdkworkNormalized"];
    assert_eq!(normalized["provider"].as_str(), Some("tencent"));
    assert_eq!(
        normalized["action"].as_str(),
        Some("DescribeCloudRecording")
    );
    assert_eq!(normalized["status"].as_str(), Some("synced"));
    assert_eq!(normalized["requestId"].as_str(), Some("tc-request-2"));
    assert_eq!(normalized["nextCursor"].as_str(), Some("cursor-2"));
    assert_eq!(normalized["recordingStatus"].as_str(), Some("Started"));
    assert_eq!(normalized["artifactCount"].as_u64(), Some(1));
}

#[test]
fn test_tencent_active_query_fails_closed_for_non_success_http_response() {
    let executor = Arc::new(CapturingTencentExecutor::with_response(
        TencentRtcOpenApiResponse {
            status_code: 503,
            body: r#"{"Response":{"RequestId":"tc-http-error-1"}}"#.into(),
        },
    ));
    let provider = signed_tencent_provider_with_executor(executor);

    let error = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            query_kind: RtcProviderQueryKind::RoomState,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("tencent:rtc_demo".into()),
            cursor: None,
        })
        .expect_err("tencent active query must fail closed for provider HTTP errors");

    match error {
        RtcContractError::Unavailable(message) => {
            assert!(message.contains("503"));
            assert!(message.contains("tc-http-error-1"));
        }
        other => panic!("expected unavailable provider error, got {other:?}"),
    }
}

#[test]
fn test_tencent_active_query_fails_closed_for_provider_error_payload() {
    let executor = Arc::new(CapturingTencentExecutor::with_response(
        TencentRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"Response":{"RequestId":"tc-error-1","Error":{"Code":"AuthFailure.SignatureFailure","Message":"bad signature"}}}"#.into(),
        },
    ));
    let provider = signed_tencent_provider_with_executor(executor);

    let error = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            query_kind: RtcProviderQueryKind::RoomState,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("tencent:rtc_demo".into()),
            cursor: None,
        })
        .expect_err("tencent active query must fail closed for provider error payloads");

    match error {
        RtcContractError::Unavailable(message) => {
            assert!(message.contains("AuthFailure.SignatureFailure"));
            assert!(message.contains("bad signature"));
            assert!(message.contains("tc-error-1"));
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
            tenant_id: "100001".into(),
            rtc_session_id: rtc_session_id.into(),
            media_mode,
            room_id: Some(format!("room_{rtc_session_id}")),
            region: Some(expected_region.into()),
        })
        .expect("tencent rtc create_session should succeed for declared media mode");
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
        .expect("tencent rtc create_session should honor requested region");
    assert_eq!(session.region.as_deref(), Some(requested_region));
}

fn signed_tencent_provider_with_executor(
    executor: Arc<dyn TencentRtcOpenApiExecutor>,
) -> TencentRtcProvider {
    TencentRtcProvider::new(TencentRtcProviderConfig {
        access_endpoint: "wss://rtc.tencent.local/session".into(),
        region: "ap-guangzhou".into(),
        api_endpoint: "https://trtc.tencentcloudapi.com".into(),
        api_host: "trtc.tencentcloudapi.com".into(),
        api_version: "2019-07-22".into(),
        sdk_app_id: Some("1400000000".into()),
        sdk_secret_key: Some("tencent-usersig-secret".into()),
        secret_id: Some("AKID_TEST".into()),
        secret_key: Some("tencent-secret-value".into()),
        credential_ttl_seconds: 3_600,
    })
    .with_open_api_executor(executor)
}

struct CapturingTencentExecutor {
    last_request: Mutex<Option<TencentRtcOpenApiRequest>>,
    response: TencentRtcOpenApiResponse,
}

impl CapturingTencentExecutor {
    fn with_response(response: TencentRtcOpenApiResponse) -> Self {
        Self {
            last_request: Mutex::new(None),
            response,
        }
    }

    fn last_request(&self) -> Option<TencentRtcOpenApiRequest> {
        self.last_request.lock().expect("lock request").clone()
    }
}

impl Default for CapturingTencentExecutor {
    fn default() -> Self {
        Self::with_response(TencentRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"Response":{"RequestId":"tc-request-1","Status":"Started","StorageFileList":[]}}"#.into(),
        })
    }
}

impl TencentRtcOpenApiExecutor for CapturingTencentExecutor {
    fn execute(
        &self,
        request: &TencentRtcOpenApiRequest,
    ) -> Result<TencentRtcOpenApiResponse, sdkwork_communication_rtc_service::RtcContractError>
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
