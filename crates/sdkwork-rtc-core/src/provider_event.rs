use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

use crate::{RtcProviderEventKind, RtcProviderQueryKind};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderWebhookEventRecord {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub external_event_id: Option<String>,
    pub event_type: String,
    pub event_kind: RtcProviderEventKind,
    pub room_id: Option<String>,
    pub media_session_id: Option<String>,
    pub participant_id: Option<String>,
    pub recording_id: Option<String>,
    pub payload_hash: String,
    pub raw_payload: JsonValue,
    pub normalized_event: JsonValue,
    pub signature_header: Option<String>,
    pub received_at: String,
    pub processed_at: Option<String>,
    pub status: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderQueryJobRecord {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub query_kind: RtcProviderQueryKind,
    pub target_kind: String,
    pub target_id: String,
    pub room_id: Option<String>,
    pub media_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub provider_request_id: Option<String>,
    pub status: String,
    pub requested_at: String,
    pub completed_at: Option<String>,
    pub result_snapshot: JsonValue,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderQuerySnapshotRecord {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider_query_job_id: String,
    pub provider: String,
    pub query_kind: RtcProviderQueryKind,
    pub target_kind: String,
    pub target_id: String,
    pub provider_session_id: Option<String>,
    pub snapshot_kind: String,
    pub snapshot_payload: JsonValue,
    pub captured_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn provider_event_records_serialize_without_signaling_terms() {
        let record = RtcProviderWebhookEventRecord {
            id: "webhook-event-1".to_string(),
            tenant_id: "100".to_string(),
            organization_id: "200".to_string(),
            provider: "volcengine".to_string(),
            provider_profile_id: Some("profile-volcengine".to_string()),
            external_event_id: Some("external-1".to_string()),
            event_type: "RoomEnd".to_string(),
            event_kind: RtcProviderEventKind::RoomEnded,
            room_id: Some("room-1".to_string()),
            media_session_id: Some("session-1".to_string()),
            participant_id: None,
            recording_id: Some("recording-1".to_string()),
            payload_hash: "fnv64:webhook".to_string(),
            raw_payload: serde_json::json!({ "EventType": "RoomEnd" }),
            normalized_event: serde_json::json!({ "eventKind": "room_ended" }),
            signature_header: Some("signature".to_string()),
            received_at: "2026-06-10T00:10:01.000Z".to_string(),
            processed_at: None,
            status: "received".to_string(),
        };

        let serialized = serde_json::to_string(&record).expect("record should serialize");

        for forbidden in ["signal", "invite", "ringing", "conversation"] {
            assert!(
                !serialized.contains(forbidden),
                "provider event records must not include signaling term {forbidden}"
            );
        }
        assert!(serialized.contains("mediaSessionId"));
    }
}
