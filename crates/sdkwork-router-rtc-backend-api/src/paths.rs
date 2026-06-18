use sdkwork_communication_rtc_service::{
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

pub const RTC_BACKEND_ROOT: &str = "/backend/v3/api/rtc";
pub const RTC_BACKEND_ROOMS_PATH: &str = "/backend/v3/api/rtc/rooms";
pub const RTC_BACKEND_ROOM_PATH: &str = "/backend/v3/api/rtc/rooms/{roomId}";
pub const RTC_BACKEND_PROVIDER_ACCOUNTS_PATH: &str = "/backend/v3/api/rtc/provider_accounts";
pub const RTC_BACKEND_PROVIDER_ACCOUNT_PATH: &str =
    "/backend/v3/api/rtc/provider_accounts/{providerAccountId}";
pub const RTC_BACKEND_PROVIDER_ACCOUNT_DISABLE_PATH: &str =
    "/backend/v3/api/rtc/provider_accounts/{providerAccountId}/disable";
pub const RTC_BACKEND_PROVIDER_ACCOUNT_APPLICATIONS_PATH: &str =
    "/backend/v3/api/rtc/provider_accounts/{providerAccountId}/applications";
pub const RTC_BACKEND_PROVIDER_APPLICATION_PATH: &str =
    "/backend/v3/api/rtc/provider_applications/{providerApplicationId}";
pub const RTC_BACKEND_PROVIDER_APPLICATION_DISABLE_PATH: &str =
    "/backend/v3/api/rtc/provider_applications/{providerApplicationId}/disable";
pub const RTC_BACKEND_PROVIDER_APPLICATION_CREDENTIALS_PATH: &str =
    "/backend/v3/api/rtc/provider_applications/{providerApplicationId}/credentials";
pub const RTC_BACKEND_PROVIDER_CREDENTIAL_PATH: &str =
    "/backend/v3/api/rtc/provider_credentials/{providerCredentialId}";
pub const RTC_BACKEND_PROVIDER_CREDENTIAL_REVOKE_PATH: &str =
    "/backend/v3/api/rtc/provider_credentials/{providerCredentialId}/revoke";
pub const RTC_BACKEND_PROVIDER_PROFILES_PATH: &str = "/backend/v3/api/rtc/provider_profiles";
pub const RTC_BACKEND_PROVIDER_PROFILE_PATH: &str =
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}";
pub const RTC_BACKEND_PROVIDER_PROFILE_DISABLE_PATH: &str =
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}/disable";
pub const RTC_BACKEND_PROVIDER_PROFILE_VERIFY_PATH: &str =
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}/verify";
pub const RTC_BACKEND_PROVIDER_ROUTES_PATH: &str = "/backend/v3/api/rtc/provider_routes";
pub const RTC_BACKEND_PROVIDER_ROUTE_PATH: &str =
    "/backend/v3/api/rtc/provider_routes/{providerRouteId}";
pub const RTC_BACKEND_PROVIDER_ROUTE_DISABLE_PATH: &str =
    "/backend/v3/api/rtc/provider_routes/{providerRouteId}/disable";
pub const RTC_BACKEND_MEDIA_SESSIONS_PATH: &str = "/backend/v3/api/rtc/media_sessions";
pub const RTC_BACKEND_MEDIA_SESSION_PATH: &str =
    "/backend/v3/api/rtc/media_sessions/{mediaSessionId}";
pub const RTC_BACKEND_MEDIA_SESSION_COMPLETION_RECORD_PATH: &str =
    "/backend/v3/api/rtc/media_sessions/{mediaSessionId}/completion_record";
pub const RTC_BACKEND_MEDIA_SESSION_CLOSE_PATH: &str =
    "/backend/v3/api/rtc/media_sessions/{mediaSessionId}/close";
pub const RTC_BACKEND_MEDIA_ARTIFACTS_PATH: &str = "/backend/v3/api/rtc/media_artifacts";
pub const RTC_BACKEND_MEDIA_ARTIFACT_PATH: &str =
    "/backend/v3/api/rtc/media_artifacts/{mediaArtifactId}";
pub const RTC_BACKEND_QUALITY_SAMPLES_PATH: &str = "/backend/v3/api/rtc/quality_samples";
pub const RTC_BACKEND_PROVIDER_WEBHOOK_EVENTS_PATH: &str =
    "/backend/v3/api/rtc/provider_webhooks/events";
pub const RTC_BACKEND_PROVIDER_WEBHOOK_RECEIVE_PATH: &str =
    "/backend/v3/api/rtc/provider_webhooks/{provider}/events";
pub const RTC_BACKEND_PROVIDER_QUERY_JOBS_PATH: &str = "/backend/v3/api/rtc/provider_query_jobs";
pub const RTC_BACKEND_PROVIDER_QUERY_JOB_PATH: &str =
    "/backend/v3/api/rtc/provider_query_jobs/{providerQueryJobId}";
pub const RTC_BACKEND_PROVIDER_QUERY_JOB_SNAPSHOTS_PATH: &str =
    "/backend/v3/api/rtc/provider_query_jobs/{providerQueryJobId}/snapshots";
pub const RTC_BACKEND_PROVIDER_SCHEMAS_PATH: &str = "/backend/v3/api/rtc/provider_schemas";
pub const RTC_BACKEND_PROVIDER_SCHEMA_PATH: &str =
    "/backend/v3/api/rtc/provider_schemas/{provider}";
pub const RTC_BACKEND_PROVIDER_PLUGINS_PATH: &str = "/backend/v3/api/rtc/provider_plugins";
pub const RTC_BACKEND_PROVIDER_PLUGIN_PATH: &str =
    "/backend/v3/api/rtc/provider_plugins/{provider}";
pub const RTC_BACKEND_PROVIDER_PROFILE_CAPABILITIES_PATH: &str =
    "/backend/v3/api/rtc/provider_profiles/{providerProfileId}/capabilities";

pub const RTC_BACKEND_ROUTES: &[RtcBackendRoute] = &[
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_ROOMS_PATH,
        tag: "rtcRooms",
        operation_id: "rtc.rooms.list",
        owner: RTC_OWNER,
        permission: "rtc.rooms.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_ROOM_PATH,
        tag: "rtcRooms",
        operation_id: "rtc.rooms.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.rooms.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_ACCOUNTS_PATH,
        tag: "rtcProviderAccounts",
        operation_id: "rtc.providerAccounts.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_accounts.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_ACCOUNTS_PATH,
        tag: "rtcProviderAccounts",
        operation_id: "rtc.providerAccounts.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_accounts.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_ACCOUNT_PATH,
        tag: "rtcProviderAccounts",
        operation_id: "rtc.providerAccounts.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_accounts.read",
    },
    RtcBackendRoute {
        method: "PATCH",
        path: RTC_BACKEND_PROVIDER_ACCOUNT_PATH,
        tag: "rtcProviderAccounts",
        operation_id: "rtc.providerAccounts.update",
        owner: RTC_OWNER,
        permission: "rtc.provider_accounts.write",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_ACCOUNT_DISABLE_PATH,
        tag: "rtcProviderAccounts",
        operation_id: "rtc.providerAccounts.disable",
        owner: RTC_OWNER,
        permission: "rtc.provider_accounts.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_ACCOUNT_APPLICATIONS_PATH,
        tag: "rtcProviderApplications",
        operation_id: "rtc.providerAccounts.applications.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_applications.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_ACCOUNT_APPLICATIONS_PATH,
        tag: "rtcProviderApplications",
        operation_id: "rtc.providerAccounts.applications.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_applications.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_APPLICATION_PATH,
        tag: "rtcProviderApplications",
        operation_id: "rtc.providerApplications.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_applications.read",
    },
    RtcBackendRoute {
        method: "PATCH",
        path: RTC_BACKEND_PROVIDER_APPLICATION_PATH,
        tag: "rtcProviderApplications",
        operation_id: "rtc.providerApplications.update",
        owner: RTC_OWNER,
        permission: "rtc.provider_applications.write",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_APPLICATION_DISABLE_PATH,
        tag: "rtcProviderApplications",
        operation_id: "rtc.providerApplications.disable",
        owner: RTC_OWNER,
        permission: "rtc.provider_applications.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_APPLICATION_CREDENTIALS_PATH,
        tag: "rtcProviderCredentials",
        operation_id: "rtc.providerApplications.credentials.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_credentials.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_APPLICATION_CREDENTIALS_PATH,
        tag: "rtcProviderCredentials",
        operation_id: "rtc.providerApplications.credentials.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_credentials.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_CREDENTIAL_PATH,
        tag: "rtcProviderCredentials",
        operation_id: "rtc.providerCredentials.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_credentials.read",
    },
    RtcBackendRoute {
        method: "PATCH",
        path: RTC_BACKEND_PROVIDER_CREDENTIAL_PATH,
        tag: "rtcProviderCredentials",
        operation_id: "rtc.providerCredentials.update",
        owner: RTC_OWNER,
        permission: "rtc.provider_credentials.write",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_CREDENTIAL_REVOKE_PATH,
        tag: "rtcProviderCredentials",
        operation_id: "rtc.providerCredentials.revoke",
        owner: RTC_OWNER,
        permission: "rtc.provider_credentials.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_PROFILES_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_PROFILES_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_PROFILE_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.read",
    },
    RtcBackendRoute {
        method: "PATCH",
        path: RTC_BACKEND_PROVIDER_PROFILE_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.update",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.write",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_PROFILE_DISABLE_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.disable",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.write",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_PROFILE_VERIFY_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.verify",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.verify",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_ROUTES_PATH,
        tag: "rtcProviderRoutes",
        operation_id: "rtc.providerRoutes.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_routes.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_ROUTES_PATH,
        tag: "rtcProviderRoutes",
        operation_id: "rtc.providerRoutes.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_routes.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_ROUTE_PATH,
        tag: "rtcProviderRoutes",
        operation_id: "rtc.providerRoutes.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_routes.read",
    },
    RtcBackendRoute {
        method: "PATCH",
        path: RTC_BACKEND_PROVIDER_ROUTE_PATH,
        tag: "rtcProviderRoutes",
        operation_id: "rtc.providerRoutes.update",
        owner: RTC_OWNER,
        permission: "rtc.provider_routes.write",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_ROUTE_DISABLE_PATH,
        tag: "rtcProviderRoutes",
        operation_id: "rtc.providerRoutes.disable",
        owner: RTC_OWNER,
        permission: "rtc.provider_routes.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_MEDIA_SESSIONS_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.list",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_MEDIA_SESSION_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_MEDIA_SESSION_COMPLETION_RECORD_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.completionRecord.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_MEDIA_SESSION_CLOSE_PATH,
        tag: "rtcMediaSessions",
        operation_id: "rtc.mediaSessions.close",
        owner: RTC_OWNER,
        permission: "rtc.media_sessions.close",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_MEDIA_ARTIFACTS_PATH,
        tag: "rtcMediaArtifacts",
        operation_id: "rtc.mediaArtifacts.list",
        owner: RTC_OWNER,
        permission: "rtc.media_artifacts.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_MEDIA_ARTIFACT_PATH,
        tag: "rtcMediaArtifacts",
        operation_id: "rtc.mediaArtifacts.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.media_artifacts.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_QUALITY_SAMPLES_PATH,
        tag: "rtcQualitySamples",
        operation_id: "rtc.qualitySamples.list",
        owner: RTC_OWNER,
        permission: "rtc.quality.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_WEBHOOK_EVENTS_PATH,
        tag: "rtcProviderWebhooks",
        operation_id: "rtc.providerWebhooks.events.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_webhooks.read",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_WEBHOOK_RECEIVE_PATH,
        tag: "rtcProviderWebhooks",
        operation_id: "rtc.providerWebhooks.events.receive",
        owner: RTC_OWNER,
        permission: "rtc.provider_webhooks.receive",
    },
    RtcBackendRoute {
        method: "POST",
        path: RTC_BACKEND_PROVIDER_QUERY_JOBS_PATH,
        tag: "rtcProviderQueryJobs",
        operation_id: "rtc.providerQueryJobs.create",
        owner: RTC_OWNER,
        permission: "rtc.provider_query_jobs.write",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_QUERY_JOB_PATH,
        tag: "rtcProviderQueryJobs",
        operation_id: "rtc.providerQueryJobs.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_query_jobs.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_QUERY_JOB_SNAPSHOTS_PATH,
        tag: "rtcProviderQueryJobs",
        operation_id: "rtc.providerQueryJobs.snapshots.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_query_jobs.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_SCHEMAS_PATH,
        tag: "rtcProviderSchemas",
        operation_id: "rtc.providerSchemas.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_schemas.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_SCHEMA_PATH,
        tag: "rtcProviderSchemas",
        operation_id: "rtc.providerSchemas.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_schemas.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_PLUGINS_PATH,
        tag: "rtcProviderPlugins",
        operation_id: "rtc.providerPlugins.list",
        owner: RTC_OWNER,
        permission: "rtc.provider_plugins.read",
    },
    RtcBackendRoute {
        method: "GET",
        path: RTC_BACKEND_PROVIDER_PLUGIN_PATH,
        tag: "rtcProviderPlugins",
        operation_id: "rtc.providerPlugins.retrieve",
        owner: RTC_OWNER,
        permission: "rtc.provider_plugins.read",
    },
    RtcBackendRoute {
        method: "PUT",
        path: RTC_BACKEND_PROVIDER_PROFILE_CAPABILITIES_PATH,
        tag: "rtcProviderProfiles",
        operation_id: "rtc.providerProfiles.capabilities.configure",
        owner: RTC_OWNER,
        permission: "rtc.provider_profiles.write",
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
