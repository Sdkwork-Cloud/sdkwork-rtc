use sdkwork_rtc_core::{
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

pub const RTC_APP_ROUTES: &[RtcAppRoute] = &[
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/sessions",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.create",
        owner: RTC_OWNER,
        permission: "rtc.sessions.write",
    },
    RtcAppRoute {
        method: "GET",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.sessions.read",
    },
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/invite",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.invite",
        owner: RTC_OWNER,
        permission: "rtc.invite",
    },
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/accept",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.accept",
        owner: RTC_OWNER,
        permission: "rtc.accept",
    },
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/reject",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.reject",
        owner: RTC_OWNER,
        permission: "rtc.reject",
    },
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/end",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.end",
        owner: RTC_OWNER,
        permission: "rtc.end",
    },
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/signals",
        tag: "rtcSignals",
        operation_id: "rtc.signals.create",
        owner: RTC_OWNER,
        permission: "rtc.signal",
    },
    RtcAppRoute {
        method: "GET",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/signals",
        tag: "rtcSignals",
        operation_id: "rtc.signals.list",
        owner: RTC_OWNER,
        permission: "rtc.signal",
    },
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/credentials",
        tag: "rtcCredentials",
        operation_id: "rtc.credentials.issue",
        owner: RTC_OWNER,
        permission: "rtc.issue_credential",
    },
    RtcAppRoute {
        method: "GET",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/records",
        tag: "rtcRecords",
        operation_id: "rtc.records.list",
        owner: RTC_OWNER,
        permission: "rtc.records.read",
    },
    RtcAppRoute {
        method: "GET",
        path: "/app/v3/api/rtc/sessions/{rtcSessionId}/artifacts/recording",
        tag: "rtcArtifacts",
        operation_id: "rtc.artifacts.recording.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.artifact",
    },
    RtcAppRoute {
        method: "POST",
        path: "/app/v3/api/rtc/provider_callbacks",
        tag: "rtcProviderCallbacks",
        operation_id: "rtc.providerCallbacks.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_callbacks.write",
    },
    RtcAppRoute {
        method: "GET",
        path: "/app/v3/api/rtc/provider_health",
        tag: "rtcProviderHealth",
        operation_id: "rtc.providerHealth.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_health.read",
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
    fn app_routes_include_room_session_signaling_and_token_grant_contracts() {
        let operation_ids = RTC_APP_ROUTES
            .iter()
            .map(|route| route.operation_id)
            .collect::<Vec<_>>();
        assert!(operation_ids.contains(&"rtc.sessions.create"));
        assert!(operation_ids.contains(&"rtc.sessions.retrieve"));
        assert!(operation_ids.contains(&"rtc.sessions.invite"));
        assert!(operation_ids.contains(&"rtc.sessions.accept"));
        assert!(operation_ids.contains(&"rtc.sessions.reject"));
        assert!(operation_ids.contains(&"rtc.sessions.end"));
        assert!(operation_ids.contains(&"rtc.signals.create"));
        assert!(operation_ids.contains(&"rtc.signals.list"));
        assert!(operation_ids.contains(&"rtc.credentials.issue"));
        assert!(operation_ids.contains(&"rtc.records.list"));
        assert!(operation_ids.contains(&"rtc.artifacts.recording.retrieve"));
        assert!(operation_ids.contains(&"rtc.providerCallbacks.create"));
        assert!(operation_ids.contains(&"rtc.providerHealth.retrieve"));
    }
}
