use serde::{Deserialize, Serialize};

use super::room::RtcRoom;
use super::session::{RtcMediaSession, RtcMediaSessionMode, RtcMediaSessionStatus};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcWorkspaceDigest {
    pub active_sessions: usize,
    pub connected_sessions: usize,
    pub ended_sessions: usize,
    pub live_sessions: usize,
    pub total_participants: usize,
    pub total_rooms: usize,
    pub total_sessions: usize,
    pub video_sessions: usize,
}

pub fn summarize_rtc_workspace(
    rooms: &[RtcRoom],
    sessions: &[RtcMediaSession],
) -> RtcWorkspaceDigest {
    RtcWorkspaceDigest {
        active_sessions: sessions
            .iter()
            .filter(|session| matches!(session.status, RtcMediaSessionStatus::Active))
            .count(),
        connected_sessions: sessions
            .iter()
            .filter(|session| session.connected_at.is_some())
            .count(),
        ended_sessions: sessions
            .iter()
            .filter(|session| {
                matches!(
                    session.status,
                    RtcMediaSessionStatus::Ended | RtcMediaSessionStatus::Failed
                )
            })
            .count(),
        live_sessions: sessions
            .iter()
            .filter(|session| session.media_mode == RtcMediaSessionMode::Live)
            .count(),
        total_participants: sessions
            .iter()
            .map(|session| session.participants.len())
            .sum(),
        total_rooms: rooms.len(),
        total_sessions: sessions.len(),
        video_sessions: sessions
            .iter()
            .filter(|session| session.media_mode == RtcMediaSessionMode::Video)
            .count(),
    }
}
