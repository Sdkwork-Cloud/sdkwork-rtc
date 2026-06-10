use sdkwork_rtc_adapter_agora::{
    AGORA_RTC_PLUGIN_ID, AgoraRtcProvider, AgoraRtcProviderConfig,
    create_agora_rtc_provider_plugin_factory,
};
use sdkwork_rtc_core::{
    RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderWebhookParseRequest,
};

#[test]
fn test_agora_rtc_provider_factory_creates_standard_provider_plugin() {
    let factory = create_agora_rtc_provider_plugin_factory(AgoraRtcProviderConfig {
        access_endpoint: "wss://rtc.agora.local/session".into(),
        region: "global".into(),
    });

    let descriptor = factory.descriptor();
    assert_eq!(descriptor.plugin_id, AGORA_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "agora");

    let provider = factory.create_provider();
    assert_eq!(provider.descriptor(), descriptor);
    assert_media_session_contract(
        provider.as_ref(),
        RtcMediaSessionMode::Video,
        "rtc_factory_demo",
        "agora:rtc_factory_demo",
        "wss://rtc.agora.local/session",
        "global",
    );
}

#[test]
fn test_agora_rtc_provider_implements_contract_surface() {
    let provider = AgoraRtcProvider::new(AgoraRtcProviderConfig {
        access_endpoint: "wss://rtc.agora.local/session".into(),
        region: "global".into(),
    });

    let descriptor = provider.descriptor();
    assert_eq!(descriptor.plugin_id, AGORA_RTC_PLUGIN_ID);
    assert_eq!(descriptor.provider_kind, "agora");
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
            "data-channel",
            "spatial-audio",
            "e2ee",
            "provider.active-query"
        ]
    );

    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Audio,
        "rtc_audio_demo",
        "agora:rtc_audio_demo",
        "wss://rtc.agora.local/session",
        "global",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Video,
        "rtc_video_demo",
        "agora:rtc_video_demo",
        "wss://rtc.agora.local/session",
        "global",
    );
    assert_media_session_contract(
        &provider,
        RtcMediaSessionMode::Live,
        "rtc_live_demo",
        "agora:rtc_live_demo",
        "wss://rtc.agora.local/session",
        "global",
    );
    assert_requested_region_overrides_provider_default(
        &provider,
        "rtc_region_override_demo",
        "ap-singapore",
    );

    let credential = provider
        .issue_participant_credential("t_demo", "rtc_demo", "u_peer")
        .expect("agora rtc credential should succeed");
    assert_eq!(credential.credential, "agora-token:t_demo:rtc_demo:u_peer");

    let artifact = provider
        .export_recording_artifact("t_demo", "rtc_demo")
        .expect("agora rtc artifact export should succeed")
        .expect("agora rtc artifact should exist");
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
    assert_eq!(health.plugin_id, AGORA_RTC_PLUGIN_ID);
    assert_eq!(health.status, "healthy");
    assert_eq!(health.details["providerKind"], "agora");
}

#[test]
fn test_agora_rtc_provider_implements_webhook_and_active_query_surface() {
    let provider = AgoraRtcProvider::new(AgoraRtcProviderConfig {
        access_endpoint: "wss://rtc.agora.local/session".into(),
        region: "global".into(),
    });

    let parsed = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "agora".into(),
            provider_profile_id: Some("profile_agora".into()),
            received_at: "2026-06-10T00:00:00.000Z".into(),
            headers: vec![("Agora-Signature-V2".into(), "agora-signature".into())],
            raw_payload: r#"{
                "eventType": "user_joined",
                "eventId": "agora-event-1",
                "channelName": "room_demo",
                "uid": "u_guest",
                "noticeId": "notice-1",
                "payload": {
                    "serviceType": 0
                }
            }"#
            .into(),
        })
        .expect("agora webhook should parse");
    assert_eq!(parsed.provider, "agora");
    assert_eq!(parsed.external_event_id.as_deref(), Some("agora-event-1"));
    assert_eq!(parsed.event_kind, RtcProviderEventKind::ParticipantJoined);
    assert_eq!(parsed.room_id.as_deref(), Some("room_demo"));
    assert_eq!(parsed.participant_id.as_deref(), Some("u_guest"));
    assert_eq!(parsed.signature_header.as_deref(), Some("agora-signature"));

    let session_scoped = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "agora".into(),
            provider_profile_id: Some("profile_agora".into()),
            received_at: "2026-06-10T00:00:00.500Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "eventType": "channel_destroy",
                "eventId": "agora-session-event-1",
                "channelName": "room_session",
                "SessionId": "rtc_session_webhook"
            }"#
            .into(),
        })
        .expect("agora session-scoped webhook should parse");
    assert_eq!(session_scoped.event_kind, RtcProviderEventKind::RoomEnded);
    assert_eq!(
        session_scoped.rtc_session_id.as_deref(),
        Some("rtc_session_webhook")
    );
    assert_eq!(
        session_scoped.provider_session_id.as_deref(),
        Some("agora:rtc_session_webhook")
    );
    assert!(
        session_scoped
            .normalized_event_json
            .contains("\"rtcSessionId\":\"rtc_session_webhook\"")
    );
    assert!(
        session_scoped
            .normalized_event_json
            .contains("\"providerSessionId\":\"agora:rtc_session_webhook\"")
    );

    let recording = provider
        .parse_provider_webhook(RtcProviderWebhookParseRequest {
            provider: "agora".into(),
            provider_profile_id: Some("profile_agora".into()),
            received_at: "2026-06-10T00:00:01.000Z".into(),
            headers: vec![],
            raw_payload: r#"{
                "eventType": "recorder_slice_stop",
                "noticeId": "notice-recording-1",
                "payload": {
                    "channelName": "room_recording",
                    "sid": "recording_sid_1",
                    "uid": "recorder"
                }
            }"#
            .into(),
        })
        .expect("agora recording webhook should parse");
    assert_eq!(
        recording.event_kind,
        RtcProviderEventKind::RecordingCompleted
    );
    assert_eq!(recording.room_id.as_deref(), Some("room_recording"));
    assert_eq!(recording.recording_id.as_deref(), Some("recording_sid_1"));

    let query = provider
        .query_provider_state(RtcProviderQueryRequest {
            provider: "agora".into(),
            provider_profile_id: Some("profile_agora".into()),
            query_kind: RtcProviderQueryKind::RoomOnlineUsers,
            room_id: Some("room_demo".into()),
            rtc_session_id: Some("rtc_demo".into()),
            provider_session_id: Some("agora:rtc_demo".into()),
            cursor: None,
        })
        .expect("agora active query should return a provider snapshot");
    assert_eq!(query.provider, "agora");
    assert_eq!(query.query_kind, RtcProviderQueryKind::RoomOnlineUsers);
    assert_eq!(query.room_id.as_deref(), Some("room_demo"));
    assert_eq!(query.status, "ready");
    assert!(query.raw_provider_action.contains("channel"));
    assert!(
        query
            .result_snapshot_json
            .contains("\"provider\":\"agora\"")
    );
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
        .expect("agora rtc create_session should succeed for declared media mode");
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
        .expect("agora rtc create_session should honor requested region");
    assert_eq!(session.region.as_deref(), Some(requested_region));
}
