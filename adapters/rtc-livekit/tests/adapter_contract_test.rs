use sdkwork_rtc_adapter_livekit::{
    LIVEKIT_RTC_PLUGIN_ID, LivekitRtcProvider, LivekitRtcProviderConfig,
};
use sdkwork_rtc_core::{RtcCallbackRequest, RtcCreateSessionRequest, RtcProviderPort};

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
            "callback",
            "health",
            "call.audio",
            "call.video",
            "live.broadcast",
            "live.audience"
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
            "e2ee"
        ]
    );

    let session = provider
        .create_session(RtcCreateSessionRequest {
            tenant_id: "t_demo".into(),
            rtc_session_id: "rtc_demo".into(),
            conversation_id: Some("c_demo".into()),
            rtc_mode: "live".into(),
            initiator_id: "u_demo".into(),
        })
        .expect("livekit rtc create_session should succeed");
    assert_eq!(session.provider_session_id, "livekit:rtc_demo");
    assert_eq!(
        session.access_endpoint.as_deref(),
        Some("wss://rtc.livekit.local/session")
    );
    assert_eq!(session.region.as_deref(), Some("self-hosted"));

    let credential = provider
        .issue_participant_credential("t_demo", "rtc_demo", "u_peer")
        .expect("livekit rtc credential should succeed");
    assert_eq!(
        credential.credential,
        "livekit-token:t_demo:rtc_demo:u_peer"
    );

    let callback = provider
        .map_provider_callback(RtcCallbackRequest {
            rtc_session_id: "rtc_demo".into(),
            callback_type: "room-ended".into(),
            payload_json: "{\"reason\":\"host_left\"}".into(),
        })
        .expect("livekit rtc callback mapping should succeed");
    assert_eq!(callback.event_type, "room-ended");

    let health = provider.provider_health_snapshot();
    assert_eq!(health.plugin_id, LIVEKIT_RTC_PLUGIN_ID);
    assert_eq!(health.status, "healthy");
    assert_eq!(health.details["providerKind"], "livekit");
}
