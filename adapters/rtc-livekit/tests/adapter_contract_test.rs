use sdkwork_rtc_adapter_livekit::{
    LIVEKIT_RTC_PLUGIN_ID, LivekitRtcProvider, LivekitRtcProviderConfig,
    create_livekit_rtc_provider_plugin_factory,
};
use sdkwork_rtc_core::{
    RtcCreateMediaSessionRequest, RtcMediaSessionMode, RtcProviderEventKind,
    RtcProviderPluginFactory, RtcProviderPort, RtcProviderQueryKind, RtcProviderQueryRequest,
    RtcProviderWebhookParseRequest,
};

#[test]
fn test_livekit_rtc_provider_factory_creates_standard_provider_plugin() {
    let factory = create_livekit_rtc_provider_plugin_factory(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
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
        .issue_participant_credential("t_demo", "rtc_demo", "u_peer")
        .expect("livekit rtc credential should succeed");
    assert_eq!(
        credential.credential,
        "livekit-token:t_demo:rtc_demo:u_peer"
    );

    let artifact = provider
        .export_recording_artifact("t_demo", "rtc_demo")
        .expect("livekit rtc artifact export should succeed")
        .expect("livekit rtc artifact should exist");
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
    assert_eq!(health.plugin_id, LIVEKIT_RTC_PLUGIN_ID);
    assert_eq!(health.status, "healthy");
    assert_eq!(health.details["providerKind"], "livekit");
}

#[test]
fn test_livekit_rtc_provider_implements_webhook_and_active_query_surface() {
    let provider = LivekitRtcProvider::new(LivekitRtcProviderConfig {
        access_endpoint: "wss://rtc.livekit.local/session".into(),
        region: "self-hosted".into(),
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
                    "identity": "u_guest",
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
    assert_eq!(parsed.participant_id.as_deref(), Some("u_guest"));
    assert_eq!(
        parsed.signature_header.as_deref(),
        Some("Bearer livekit-webhook-token")
    );

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
        .expect("livekit active query should return a provider snapshot");
    assert_eq!(query.provider, "livekit");
    assert_eq!(query.query_kind, RtcProviderQueryKind::RoomState);
    assert_eq!(query.room_id.as_deref(), Some("room_demo"));
    assert_eq!(query.status, "ready");
    assert!(query.raw_provider_action.contains("Room"));
    assert!(
        query
            .result_snapshot_json
            .contains("\"provider\":\"livekit\"")
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
            tenant_id: "t_demo".into(),
            rtc_session_id: rtc_session_id.into(),
            media_mode: RtcMediaSessionMode::Video,
            room_id: Some(format!("room_{rtc_session_id}")),
            region: Some(requested_region.into()),
        })
        .expect("livekit rtc create_session should honor requested region");
    assert_eq!(session.region.as_deref(), Some(requested_region));
}
