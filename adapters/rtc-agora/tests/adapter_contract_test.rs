use sdkwork_rtc_adapter_agora::{AGORA_RTC_PLUGIN_ID, AgoraRtcProvider, AgoraRtcProviderConfig};
use sdkwork_rtc_core::{RtcCallbackRequest, RtcCreateSessionRequest, RtcProviderPort};

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
            "cloud-mix",
            "data-channel",
            "spatial-audio",
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
        .expect("agora rtc create_session should succeed");
    assert_eq!(session.provider_session_id, "agora:rtc_demo");
    assert_eq!(
        session.access_endpoint.as_deref(),
        Some("wss://rtc.agora.local/session")
    );
    assert_eq!(session.region.as_deref(), Some("global"));

    let credential = provider
        .issue_participant_credential("t_demo", "rtc_demo", "u_peer")
        .expect("agora rtc credential should succeed");
    assert_eq!(credential.credential, "agora-token:t_demo:rtc_demo:u_peer");

    let callback = provider
        .map_provider_callback(RtcCallbackRequest {
            rtc_session_id: "rtc_demo".into(),
            callback_type: "room-ended".into(),
            payload_json: "{\"reason\":\"host_left\"}".into(),
        })
        .expect("agora rtc callback mapping should succeed");
    assert_eq!(callback.event_type, "room-ended");

    let health = provider.provider_health_snapshot();
    assert_eq!(health.plugin_id, AGORA_RTC_PLUGIN_ID);
    assert_eq!(health.status, "healthy");
    assert_eq!(health.details["providerKind"], "agora");
}
