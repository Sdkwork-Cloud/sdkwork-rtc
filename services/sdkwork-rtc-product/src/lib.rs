use sdkwork_rtc_core::{
    summarize_rtc_workspace, RtcCallParticipant, RtcCallSession, RtcCallSessionStatus, RtcCallType,
    RtcParticipantRole, RtcParticipantState, RtcRoom, RtcRoomStatus, RtcWorkspaceDigest,
};

#[derive(Clone, Debug, Default)]
pub struct InMemoryRtcRepository {
    rooms: Vec<RtcRoom>,
    sessions: Vec<RtcCallSession>,
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
            sessions: vec![RtcCallSession {
                id: "session-daily-sync".to_string(),
                room_id: "room-daily-sync".to_string(),
                tenant_id: "tenant-1".to_string(),
                organization_id: "org-1".to_string(),
                owner_user_id: "user-host".to_string(),
                call_type: RtcCallType::Video,
                status: RtcCallSessionStatus::Connected,
                provider_profile_id: Some("provider-livekit-default".to_string()),
                started_at: Some("2026-06-06T00:00:00Z".to_string()),
                ended_at: None,
                participants: vec![RtcCallParticipant {
                    id: "participant-host".to_string(),
                    session_id: "session-daily-sync".to_string(),
                    user_id: "user-host".to_string(),
                    display_name: "Host".to_string(),
                    role: RtcParticipantRole::Host,
                    state: RtcParticipantState::Joined,
                    audio_muted: false,
                    video_muted: false,
                }],
            }],
        }
    }

    pub fn list_rooms(&self) -> &[RtcRoom] {
        &self.rooms
    }

    pub fn list_sessions(&self) -> &[RtcCallSession] {
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
                .is_some_and(|value| value.starts_with("provider-"))
        );
    }
}
