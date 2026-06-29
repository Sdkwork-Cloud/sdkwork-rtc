use serde::{Deserialize, Serialize};

use crate::completion::{
    RtcMediaSessionCompletionQualitySummary, RtcMediaSessionCompletionRecordingSummary,
    RtcMediaSessionEndSource,
};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaSessionMode {
    Audio,
    Video,
    Live,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaSessionStatus {
    Preparing,
    Active,
    Closing,
    Ended,
    Failed,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcParticipantRole {
    Host,
    Guest,
    Listener,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcParticipantState {
    Joining,
    Joined,
    Left,
    Kicked,
    Timeout,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcCreateMediaSessionRequest {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub media_mode: RtcMediaSessionMode,
    pub room_id: Option<String>,
    pub region: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcSessionHandle {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub provider_session_id: String,
    pub access_endpoint: Option<String>,
    pub region: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcParticipantCredential {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub participant_id: String,
    pub credential: String,
    pub expires_at: String,
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct RtcParticipantCredentialContext {
    pub provider_app_id: Option<String>,
    pub signing_secret: Option<String>,
    pub credential_ttl_seconds: Option<u32>,
}

impl RtcParticipantCredentialContext {
    pub fn merge_app_id<'a>(&'a self, current: &'a Option<String>) -> Option<String> {
        self.provider_app_id.clone().or_else(|| current.clone())
    }

    pub fn merge_signing_secret<'a>(&'a self, current: &'a Option<String>) -> Option<String> {
        self.signing_secret.clone().or_else(|| current.clone())
    }

    pub fn merge_ttl(&self, current: u32) -> u32 {
        self.credential_ttl_seconds.unwrap_or(current)
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcMediaParticipant {
    pub id: String,
    pub session_id: String,
    pub user_id: String,
    pub display_name: String,
    pub role: RtcParticipantRole,
    pub state: RtcParticipantState,
    pub audio_muted: bool,
    pub video_muted: bool,
    pub screen_share_active: bool,
    pub provider_participant_id: Option<String>,
    pub joined_at: Option<String>,
    pub left_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub leave_reason: Option<String>,
    pub last_seen_at: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcMediaSession {
    pub id: String,
    pub room_id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub owner_user_id: String,
    pub media_mode: RtcMediaSessionMode,
    pub status: RtcMediaSessionStatus,
    pub provider_profile_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub started_at: Option<String>,
    pub connected_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub end_reason: Option<String>,
    pub end_source: Option<RtcMediaSessionEndSource>,
    pub participant_count: u32,
    pub max_concurrent_participants: u32,
    pub quality_summary: Option<RtcMediaSessionCompletionQualitySummary>,
    pub recording_summary: Option<RtcMediaSessionCompletionRecordingSummary>,
    pub completion_recorded_at: Option<String>,
    pub last_provider_webhook_event_id: Option<String>,
    pub last_provider_query_job_id: Option<String>,
    pub participants: Vec<RtcMediaParticipant>,
}
