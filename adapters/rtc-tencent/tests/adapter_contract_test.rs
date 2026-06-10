use sdkwork_rtc_adapter_tencent::{
    TENCENT_RTC_PLUGIN_ID, TencentRtcOpenApiExecutor, TencentRtcOpenApiRequest,
    TencentRtcOpenApiResponse, TencentRtcProvider, TencentRtcProviderConfig,
    create_tencent_rtc_provider_plugin_factory,
};
use sdkwork_rtc_core::{
    RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderWebhookParseRequest,
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
        .issue_participant_credential("t_demo", "rtc_demo", "u_peer")
        .expect("tencent rtc credential should succeed");
    assert_eq!(
        credential.credential,
        "tencent-token:t_demo:rtc_demo:u_peer"
    );

    let artifact = provider
        .export_recording_artifact("t_demo", "rtc_demo")
        .expect("tencent rtc artifact export should succeed")
        .expect("tencent rtc artifact should exist");
    assert_eq!(
        artifact.drive.drive_uri,
        "drive://spaces/space_rtc_recordings/nodes/node_rtc_demo"
    );
    assert_eq!(
        artifact.resource.uri.as_deref(),
        Some("drive://spaces/space_rtc_recordings/nodes/node_rtc_demo")
    );
    assert_eq!(artifact.media_role, "rtc_recording");

    let health = provider.provider_health_snapshot();
    assert_eq!(health.plugin_id, TENCENT_RTC_PLUGIN_ID);
    assert_eq!(health.status, "healthy");
    assert_eq!(health.details["providerKind"], "tencent");
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
                "UserId": "u_guest",
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
    assert_eq!(parsed.participant_id.as_deref(), Some("u_guest"));
    assert_eq!(parsed.signature_header.as_deref(), Some("sig-demo"));

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
        .expect("tencent active query should succeed");
    assert_eq!(query.provider, "tencent");
    assert_eq!(query.query_kind, RtcProviderQueryKind::RecordingArtifacts);
    assert_eq!(query.room_id.as_deref(), Some("room_demo"));
    assert!(query.raw_provider_action.contains("DescribeCloudRecording"));

    let quality_query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "tencent".into(),
            provider_profile_id: Some("profile_tencent".into()),
            query_kind: RtcProviderQueryKind::QualitySamples,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("tencent:rtc_demo".into()),
            cursor: None,
        })
        .expect("tencent quality active query should succeed");
    assert_eq!(
        quality_query.query_kind,
        RtcProviderQueryKind::QualitySamples
    );
    assert!(
        quality_query
            .raw_provider_action
            .contains("DescribeTRTCRealTimeQualityData")
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
        .issue_participant_credential("t_demo", "room_demo", "u_guest")
        .expect("tencent signed credential should be generated");
    assert!(!credential.credential.contains("tencent-token:"));
    assert!(!credential.credential.contains("tencent-usersig-secret"));
    assert!(!credential.credential.contains('+'));
    assert!(!credential.credential.contains('/'));
    assert!(!credential.credential.contains('='));
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
            tenant_id: "t_demo".into(),
            rtc_session_id: rtc_session_id.into(),
            media_mode: RtcMediaSessionMode::Video,
            room_id: Some(format!("room_{rtc_session_id}")),
            region: Some(requested_region.into()),
        })
        .expect("tencent rtc create_session should honor requested region");
    assert_eq!(session.region.as_deref(), Some(requested_region));
}

#[derive(Default)]
struct CapturingTencentExecutor {
    last_request: Mutex<Option<TencentRtcOpenApiRequest>>,
}

impl CapturingTencentExecutor {
    fn last_request(&self) -> Option<TencentRtcOpenApiRequest> {
        self.last_request.lock().expect("lock request").clone()
    }
}

impl TencentRtcOpenApiExecutor for CapturingTencentExecutor {
    fn execute(
        &self,
        request: &TencentRtcOpenApiRequest,
    ) -> Result<TencentRtcOpenApiResponse, sdkwork_rtc_core::RtcContractError> {
        *self.last_request.lock().expect("lock request") = Some(request.clone());
        Ok(TencentRtcOpenApiResponse {
            status_code: 200,
            body: r#"{"Response":{"RequestId":"tc-request-1","Status":"Started","StorageFileList":[]}}"#.into(),
        })
    }
}
