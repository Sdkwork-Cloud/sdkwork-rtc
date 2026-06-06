pub use sdkwork_rtc_core::{
    RtcContractError, RtcSession, RtcSessionState, RtcSignalEvent, RtcSignalSender,
    RtcStateRecord, RtcStateStore,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reexports_rtc_state_contract_from_core() {
        let record = RtcStateRecord {
            tenant_id: "t_demo".into(),
            rtc_session_id: "rtc_demo".into(),
            session: RtcSession {
                tenant_id: "t_demo".into(),
                rtc_session_id: "rtc_demo".into(),
                conversation_id: None,
                rtc_mode: "voice".into(),
                initiator_id: "u_demo".into(),
                initiator_kind: "user".into(),
                provider_plugin_id: None,
                provider_session_id: None,
                access_endpoint: None,
                provider_region: None,
                state: RtcSessionState::Started,
                signaling_stream_id: None,
                artifact_message_id: None,
                started_at: "2026-05-06T00:00:00.000Z".into(),
                ended_at: None,
            },
            signals: vec![RtcSignalEvent {
                tenant_id: "t_demo".into(),
                rtc_session_id: "rtc_demo".into(),
                signal_seq: 1,
                conversation_id: None,
                rtc_mode: "voice".into(),
                signal_type: "rtc.offer".into(),
                schema_ref: None,
                payload: "{}".into(),
                sender: RtcSignalSender {
                    id: "u_demo".into(),
                    kind: "user".into(),
                    member_id: None,
                    device_id: None,
                    session_id: None,
                    metadata: Default::default(),
                },
                signaling_stream_id: None,
                occurred_at: "2026-05-06T00:00:01.000Z".into(),
            }],
            updated_at: "2026-05-06T00:00:01.000Z".into(),
        };

        assert_eq!(record.signals[0].signal_seq, 1);
    }
}
