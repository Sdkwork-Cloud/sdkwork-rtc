use serde::{Deserialize, Serialize};

use super::session::{RtcMediaSessionMode, RtcParticipantRole};

pub const LIVE_BROADCAST_CAPABILITY: &str = "live.broadcast";
pub const LIVE_AUDIENCE_CAPABILITY: &str = "live.audience";
pub const CDN_RELAY_CAPABILITY: &str = "cdn-relay";

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcLiveParticipantSurface {
    Broadcast,
    Audience,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcCdnRelayMode {
    Push,
    Pull,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcCdnRelayStartRequest {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub provider_session_id: String,
    pub mode: RtcCdnRelayMode,
    pub stream_id: Option<String>,
    pub region: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcCdnRelayHandle {
    pub relay_id: String,
    pub push_url: Option<String>,
    pub pull_url: Option<String>,
    pub provider_snapshot_json: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcCdnRelayStopRequest {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub relay_id: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcLiveAudiencePlaybackRequest {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub participant_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcLiveAudiencePlayback {
    pub playback_url: String,
    pub expires_at: Option<String>,
}

pub fn resolve_live_participant_surface(
    media_mode: RtcMediaSessionMode,
    role: RtcParticipantRole,
) -> Option<RtcLiveParticipantSurface> {
    if media_mode != RtcMediaSessionMode::Live {
        return None;
    }
    match role {
        RtcParticipantRole::Host | RtcParticipantRole::Guest => {
            Some(RtcLiveParticipantSurface::Broadcast)
        }
        RtcParticipantRole::Listener => Some(RtcLiveParticipantSurface::Audience),
    }
}

pub fn live_surface_required_capability(surface: RtcLiveParticipantSurface) -> &'static str {
    match surface {
        RtcLiveParticipantSurface::Broadcast => LIVE_BROADCAST_CAPABILITY,
        RtcLiveParticipantSurface::Audience => LIVE_AUDIENCE_CAPABILITY,
    }
}

pub fn format_cdn_relay_provider_session_id(provider: &str, rtc_session_id: &str) -> String {
    if rtc_session_id.contains(':') {
        rtc_session_id.to_string()
    } else {
        format!("{provider}:{rtc_session_id}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_live_surface_from_media_mode_and_role() {
        assert_eq!(
            resolve_live_participant_surface(RtcMediaSessionMode::Live, RtcParticipantRole::Host),
            Some(RtcLiveParticipantSurface::Broadcast)
        );
        assert_eq!(
            resolve_live_participant_surface(
                RtcMediaSessionMode::Live,
                RtcParticipantRole::Listener
            ),
            Some(RtcLiveParticipantSurface::Audience)
        );
        assert_eq!(
            resolve_live_participant_surface(RtcMediaSessionMode::Video, RtcParticipantRole::Host),
            None
        );
    }

    #[test]
    fn live_surface_maps_to_capability_keys() {
        assert_eq!(
            live_surface_required_capability(RtcLiveParticipantSurface::Broadcast),
            "live.broadcast"
        );
        assert_eq!(
            live_surface_required_capability(RtcLiveParticipantSurface::Audience),
            "live.audience"
        );
    }
}
