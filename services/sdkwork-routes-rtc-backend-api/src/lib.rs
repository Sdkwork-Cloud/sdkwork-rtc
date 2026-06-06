use sdkwork_rtc_core::{
    RTC_BACKEND_API_AUTHORITY, RTC_BACKEND_API_PREFIX, RTC_BACKEND_SDK_FAMILY, RTC_DOMAIN,
    RTC_OWNER,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RtcBackendRoute {
    pub method: &'static str,
    pub path: &'static str,
    pub tag: &'static str,
    pub operation_id: &'static str,
    pub owner: &'static str,
    pub permission: &'static str,
}

pub const RTC_BACKEND_ROUTES: &[RtcBackendRoute] = &[
    RtcBackendRoute {
        method: "GET",
        path: "/backend/v3/api/rtc/provider-profiles",
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: "/backend/v3/api/rtc/provider-profiles",
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.write",
    },
    RtcBackendRoute {
        method: "PATCH",
        path: "/backend/v3/api/rtc/provider-profiles/{providerProfileId}",
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.update",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: "/backend/v3/api/rtc/provider-routes",
        tag: "rtcProviderRoutes",
        operation_id: "rtc.providerRoutes.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_routes.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: "/backend/v3/api/rtc/provider-routes",
        tag: "rtcProviderRoutes",
        operation_id: "rtc.providerRoutes.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_routes.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: "/backend/v3/api/rtc/sessions",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.list",
        owner: RTC_OWNER,
        permission: "rtc.sessions.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: "/backend/v3/api/rtc/sessions/{sessionId}",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.sessions.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: "/backend/v3/api/rtc/sessions/{sessionId}/terminate",
        tag: "rtcSessions",
        operation_id: "rtc.sessions.terminate",
        owner: RTC_OWNER,
        permission: "rtc.sessions.terminate",
    },
    RtcBackendRoute {
        method: "GET",
        path: "/backend/v3/api/rtc/signaling-events",
        tag: "rtcSignalingEvents",
        operation_id: "rtc.signalingEvents.list",
        owner: RTC_OWNER,
        permission: "rtc.signaling.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: "/backend/v3/api/rtc/quality-samples",
        tag: "rtcQualitySamples",
        operation_id: "rtc.qualitySamples.list",
        owner: RTC_OWNER,
        permission: "rtc.quality.read",
    },
];

pub fn route_manifest_header() -> (&'static str, &'static str, &'static str, &'static str, &'static str) {
    (
        RTC_DOMAIN,
        RTC_BACKEND_API_AUTHORITY,
        RTC_BACKEND_SDK_FAMILY,
        RTC_BACKEND_API_PREFIX,
        RTC_OWNER,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backend_routes_use_standard_prefix_owner_and_permissions() {
        for route in RTC_BACKEND_ROUTES {
            assert!(route.path.starts_with("/backend/v3/api/rtc"));
            assert_eq!(route.owner, RTC_OWNER);
            assert!(route.permission.starts_with("rtc."));
            assert!(route.operation_id.starts_with("rtc."));
        }
    }

    #[test]
    fn backend_does_not_expose_login_or_app_session_creation_routes() {
        for route in RTC_BACKEND_ROUTES {
            assert!(!route.path.contains("/auth/"));
            assert!(!route.operation_id.ends_with(".join"));
            assert!(!route.operation_id.ends_with(".leave"));
        }
    }
}
