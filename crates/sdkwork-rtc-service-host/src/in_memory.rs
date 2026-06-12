use sdkwork_communication_rtc_service::{
    RtcMediaParticipant, RtcMediaSession, RtcMediaSessionMode, RtcMediaSessionStatus,
    RtcParticipantRole, RtcParticipantState, RtcRoom, RtcRoomStatus, RtcWorkspaceDigest,
    summarize_rtc_workspace,
};

#[derive(Clone, Debug, Default)]
pub struct InMemoryRtcRepository {
    rooms: Vec<RtcRoom>,
    sessions: Vec<RtcMediaSession>,
}

impl InMemoryRtcRepository {
    pub fn seeded() -> Self {
        Self {
            rooms: vec![RtcRoom {
                id: "room-daily-sync".to_string(),
                tenant_id: "tenant-1".to_string(),
                organization_id: "org-1".to_string(),
                owner_user_id: "user-host".to_string(),
                title: "Daily Sync".to_string(),
                status: RtcRoomStatus::Active,
            }],
            sessions: vec![RtcMediaSession {
                id: "session-daily-sync".to_string(),
                room_id: "room-daily-sync".to_string(),
                tenant_id: "tenant-1".to_string(),
                organization_id: "org-1".to_string(),
                owner_user_id: "user-host".to_string(),
                media_mode: RtcMediaSessionMode::Video,
                status: RtcMediaSessionStatus::Active,
                provider_profile_id: Some("provider-volcengine-default".to_string()),
                provider_session_id: Some("volcengine:session-daily-sync".to_string()),
                started_at: Some("2026-06-06T00:00:00Z".to_string()),
                connected_at: Some("2026-06-06T00:00:01Z".to_string()),
                ended_at: None,
                duration_ms: None,
                end_reason: None,
                end_source: None,
                participant_count: 1,
                max_concurrent_participants: 1,
                quality_summary: None,
                recording_summary: None,
                completion_recorded_at: None,
                last_provider_webhook_event_id: None,
                last_provider_query_job_id: None,
                participants: vec![RtcMediaParticipant {
                    id: "participant-host".to_string(),
                    session_id: "session-daily-sync".to_string(),
                    user_id: "user-host".to_string(),
                    display_name: "Host".to_string(),
                    role: RtcParticipantRole::Host,
                    state: RtcParticipantState::Joined,
                    audio_muted: false,
                    video_muted: false,
                    screen_share_active: false,
                    provider_participant_id: Some("volcengine:user-host".to_string()),
                    joined_at: Some("2026-06-06T00:00:01Z".to_string()),
                    left_at: None,
                    duration_ms: None,
                    leave_reason: None,
                    last_seen_at: Some("2026-06-06T00:00:01Z".to_string()),
                }],
            }],
        }
    }

    pub fn list_rooms(&self) -> &[RtcRoom] {
        &self.rooms
    }

    pub fn list_sessions(&self) -> &[RtcMediaSession] {
        &self.sessions
    }

    pub fn digest(&self) -> RtcWorkspaceDigest {
        summarize_rtc_workspace(&self.rooms, &self.sessions)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seeded_repository_exposes_rtc_domain_state() {
        let repository = InMemoryRtcRepository::seeded();
        assert_eq!(repository.list_rooms().len(), 1);
        assert_eq!(repository.list_sessions().len(), 1);
        assert_eq!(repository.digest().active_sessions, 1);
        assert_eq!(repository.digest().video_sessions, 1);
        assert!(
            repository.list_sessions()[0]
                .provider_profile_id
                .as_deref()
                .is_some_and(|value| value == "provider-volcengine-default")
        );
    }
}
