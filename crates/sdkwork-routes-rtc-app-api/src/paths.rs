use sdkwork_communication_rtc_service::{
    RTC_APP_API_AUTHORITY, RTC_APP_API_PREFIX, RTC_APP_SDK_FAMILY, RTC_DOMAIN, RTC_OWNER,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RtcAppRoute {
    pub method: &'static str,
    pub path: &'static str,
    pub tag: &'static str,
    pub operation_id: &'static str,
    pub owner: &'static str,
    pub permission: &'static str,
}

pub const RTC_APP_ROOT: &str = "/app/v3/api/rtc";
pub const RTC_APP_ROOMS_PATH: &str = "/app/v3/api/rtc/rooms";
pub const RTC_APP_ROOM_PATH: &str = "/app/v3/api/rtc/rooms/{roomId}";
pub const RTC_APP_ACTIVE_PROVIDER_PROFILES_PATH: &str = "/app/v3/api/rtc/provider_profiles/active";
pub const RTC_APP_MEDIA_SESSIONS_PATH: &str = "/app/v3/api/rtc/media_sessions";
pub const RTC_APP_MEDIA_SESSION_PATH: &str = "/app/v3/api/rtc/media_sessions/{mediaSessionId}";
pub const RTC_APP_MEDIA_SESSION_COMPLETION_RECORD_PATH: &str =
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/completion_record";
pub const RTC_APP_PARTICIPANT_CREDENTIAL_PATH: &str =
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/participants/{participantId}/credential";
pub const RTC_APP_RECORDING_ARTIFACTS_PATH: &str =
    "/app/v3/api/rtc/media_sessions/{mediaSessionId}/recording_artifacts";

pub const RTC_APP_ROUTES: &[RtcAppRoute] = &[
    RtcAppRoute {
        method: "GET",
        path: RTC_APP_ROOMS_PATH,
        tag: "rtcRooms",
        operation_id: "rtc.rooms.list",
        owner: RTC_OWNER,
        permission: "rtc.rooms.read",
    },
    RtcAppRoute {
        method: "GET",
        path: RTC_APP_ROOM_PATH,
        tag: "rtcRooms",
        operation_id: "rtc.rooms.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.rooms.read",
    },
    RtcAppRoute {
        method: "GET",
        path: RTC_APP_ACTIVE_PROVIDER_PROFILES_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.active.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.read",
    },
    RtcAppRoute {
        method: "GET",
        path: RTC_APP_MEDIA_SESSIONS_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.list",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.read",
    },
    RtcAppRoute {
        method: "POST",
        path: RTC_APP_MEDIA_SESSIONS_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.create",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.write",
    },
    RtcAppRoute {
        method: "GET",
        path: RTC_APP_MEDIA_SESSION_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.read",
    },
    RtcAppRoute {
        method: "GET",
        path: RTC_APP_MEDIA_SESSION_COMPLETION_RECORD_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.completionRecord.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.read",
    },
    RtcAppRoute {
        method: "POST",
        path: RTC_APP_PARTICIPANT_CREDENTIAL_PATH,
        tag: "rtcParticipantCredentials",
        operation_id: "rtc.mediaSessions.participantCredentials.issue",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.credentials.issue",
    },
    RtcAppRoute {
        method: "GET",
        path: RTC_APP_RECORDING_ARTIFACTS_PATH,
        tag: "rtcRecordingArtifacts",
        operation_id: "rtc.mediaSessions.recordingArtifacts.list",
        owner: RTC_OWNER,
        permission: "rtc.media_artifacts.read",
    },
];

pub fn route_manifest_header() -> (
    &'static str,
    &'static str,
    &'static str,
    &'static str,
    &'static str,
) {
    (
        RTC_DOMAIN,
        RTC_APP_API_AUTHORITY,
        RTC_APP_SDK_FAMILY,
        RTC_APP_API_PREFIX,
        RTC_OWNER,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_routes_use_standard_prefix_owner_and_permissions() {
        for route in RTC_APP_ROUTES {
            assert!(route.path.starts_with("/app/v3/api/rtc"));
            assert_eq!(route.owner, RTC_OWNER);
            assert!(route.permission.starts_with("rtc."));
            assert!(route.operation_id.starts_with("rtc."));
        }
    }

    #[test]
    fn app_routes_do_not_expose_signaling_or_business_call_workflows() {
        for route in RTC_APP_ROUTES {
            assert!(!route.path.contains("/signals"));
            assert!(!route.path.contains("/invitations"));
            assert!(!route.path.contains("/calls"));
            assert!(!route.operation_id.contains("signal"));
            assert!(!route.operation_id.contains("invite"));
        }
    }
}
