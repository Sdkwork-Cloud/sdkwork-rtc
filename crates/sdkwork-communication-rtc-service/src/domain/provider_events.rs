use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderEventKind {
    RoomStarted,
    RoomEnded,
    ParticipantJoined,
    ParticipantLeft,
    RecordingStarted,
    RecordingCompleted,
    RecordingFailed,
    MediaTrackStarted,
    MediaTrackStopped,
    QualitySample,
    Unknown,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderWebhookParseRequest {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub received_at: String,
    pub headers: Vec<(String, String)>,
    pub raw_payload: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderWebhookEvent {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub external_event_id: Option<String>,
    pub event_type: String,
    pub event_kind: RtcProviderEventKind,
    pub room_id: Option<String>,
    pub rtc_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub participant_id: Option<String>,
    pub recording_id: Option<String>,
    pub occurred_at: Option<String>,
    pub received_at: String,
    pub payload_hash: String,
    pub signature_header: Option<String>,
    pub raw_payload: String,
    pub normalized_event_json: String,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderQueryKind {
    RoomOnlineUsers,
    RoomState,
    MediaSessionState,
    RecordingArtifacts,
    QualitySamples,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderQueryRequest {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub query_kind: RtcProviderQueryKind,
    pub room_id: Option<String>,
    pub rtc_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub cursor: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderQueryResult {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub query_kind: RtcProviderQueryKind,
    pub room_id: Option<String>,
    pub rtc_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub status: String,
    pub raw_provider_action: String,
    pub result_snapshot_json: String,
    pub next_cursor: Option<String>,
    pub queried_at: String,
}

pub fn rtc_provider_payload_hash(payload: &str) -> String {
    format!(
        "sha256:{}",
        sdkwork_utils_rust::sha256_hash(payload.as_bytes())
    )
}
