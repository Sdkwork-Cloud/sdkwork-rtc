use crate::{ProviderHealthSnapshot, RtcContractError};

/// RTC runtime deployment profile helpers shared by service host and API server.
pub fn rtc_runtime_environment() -> String {
    std::env::var("SDKWORK_RTC_ENVIRONMENT")
        .or_else(|_| std::env::var("SDKWORK_ENVIRONMENT"))
        .unwrap_or_else(|_| "development".to_owned())
        .to_ascii_lowercase()
}

pub fn rtc_allows_in_memory_only_runtime() -> bool {
    matches!(
        rtc_runtime_environment().as_str(),
        "development" | "dev" | "local" | "test"
    )
}

pub fn rtc_persistence_required() -> bool {
    !rtc_allows_in_memory_only_runtime()
}

pub fn rtc_requires_provider_webhook_timestamp() -> bool {
    !rtc_allows_in_memory_only_runtime()
}

/// Whether unsigned provider credentials and CDN relay placeholders are permitted.
pub fn rtc_allows_development_provider_placeholders() -> bool {
    rtc_allows_in_memory_only_runtime()
}

fn rtc_hydration_limit(env_key: &str, default: usize, max: usize) -> usize {
    std::env::var(env_key)
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .unwrap_or(default)
        .clamp(1, max)
}

pub fn rtc_hydration_max_media_sessions() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_MEDIA_SESSIONS", 200, 2000)
}

pub fn rtc_hydration_max_rooms() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_ROOMS", 500, 5000)
}

pub fn rtc_hydration_max_webhook_events() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_WEBHOOK_EVENTS", 500, 10_000)
}

pub fn rtc_hydration_max_provider_query_jobs() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_PROVIDER_QUERY_JOBS", 200, 5000)
}

pub fn rtc_hydration_max_provider_query_snapshots() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_PROVIDER_QUERY_SNAPSHOTS", 200, 5000)
}

pub fn rtc_hydration_max_idempotency_records() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_IDEMPOTENCY_RECORDS", 500, 10_000)
}

pub fn rtc_hydration_max_session_token_grants() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_SESSION_TOKEN_GRANTS", 500, 10_000)
}

pub fn rtc_hydration_max_provider_accounts() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_PROVIDER_ACCOUNTS", 200, 2000)
}

pub fn rtc_hydration_max_provider_applications() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_PROVIDER_APPLICATIONS", 500, 5000)
}

pub fn rtc_hydration_max_provider_credentials() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_PROVIDER_CREDENTIALS", 500, 5000)
}

pub fn rtc_hydration_max_provider_profiles() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_PROVIDER_PROFILES", 200, 2000)
}

pub fn rtc_hydration_max_provider_routes() -> usize {
    rtc_hydration_limit("SDKWORK_RTC_HYDRATION_MAX_PROVIDER_ROUTES", 500, 5000)
}

pub fn provider_credential_signing_ready(health: &ProviderHealthSnapshot) -> bool {
    if rtc_allows_development_provider_placeholders() {
        return true;
    }
    health
        .details
        .get("credentialMode")
        .is_some_and(|mode| mode == "signed-token")
}

fn parse_truthy_env_flag(value: Option<String>) -> bool {
    value
        .map(|raw| {
            matches!(
                raw.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false)
}

pub fn validate_production_runtime_profile() -> Result<(), String> {
    let deployment_profile = std::env::var("SDKWORK_RTC_DEPLOYMENT_PROFILE")
        .or_else(|_| std::env::var("SDKWORK_DEPLOYMENT_PROFILE"))
        .unwrap_or_default()
        .to_ascii_lowercase();
    if matches!(deployment_profile.as_str(), "production" | "staging" | "prod")
        && rtc_allows_in_memory_only_runtime()
    {
        return Err(format!(
            "SDKWORK_RTC_ENVIRONMENT must not be development, dev, local, or test when deployment profile is {deployment_profile}"
        ));
    }
    let requires_app_context_signature = matches!(
        deployment_profile.as_str(),
        "production" | "staging" | "prod"
    ) || rtc_persistence_required();
    if requires_app_context_signature {
        if !parse_truthy_env_flag(
            std::env::var("SDKWORK_RTC_APP_CONTEXT_REQUIRE_SIGNATURE").ok(),
        ) {
            return Err(
                "SDKWORK_RTC_APP_CONTEXT_REQUIRE_SIGNATURE must be true for production RTC runtime"
                    .to_string(),
            );
        }
        let secret = std::env::var("SDKWORK_RTC_APP_CONTEXT_SIGNATURE_SECRET")
            .ok()
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty());
        if secret.is_none() {
            return Err(
                "SDKWORK_RTC_APP_CONTEXT_SIGNATURE_SECRET must be configured for production RTC runtime"
                    .to_string(),
            );
        }
    }
    Ok(())
}

/// Fail closed when provider signing credentials are missing outside development runtimes.
pub fn require_signed_provider_configuration(
    signing_configured: bool,
    capability: &str,
) -> Result<(), RtcContractError> {
    if signing_configured || rtc_allows_development_provider_placeholders() {
        return Ok(());
    }
    Err(RtcContractError::Unavailable(format!(
        "RTC provider {capability} requires signing credentials when SDKWORK_RTC_ENVIRONMENT is not development, dev, local, or test"
    )))
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;
    use std::sync::{Mutex, OnceLock};

    use super::{
        provider_credential_signing_ready, validate_production_runtime_profile,
        ProviderHealthSnapshot,
    };

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    struct EnvVarGuard {
        key: &'static str,
        previous: Option<String>,
    }

    impl EnvVarGuard {
        fn set(key: &'static str, value: &str) -> Self {
            let previous = std::env::var(key).ok();
            unsafe {
                std::env::set_var(key, value);
            }
            Self { key, previous }
        }
    }

    impl Drop for EnvVarGuard {
        fn drop(&mut self) {
            unsafe {
                match &self.previous {
                    Some(value) => std::env::set_var(self.key, value),
                    None => std::env::remove_var(self.key),
                }
            }
        }
    }

    #[test]
    fn provider_credential_signing_ready_requires_signed_mode_outside_dev() {
        let _lock = env_lock().lock().expect("env lock");
        let _env = EnvVarGuard::set("SDKWORK_RTC_ENVIRONMENT", "production");
        let mut details = BTreeMap::new();
        details.insert("credentialMode".into(), "development-placeholder".into());
        let health = ProviderHealthSnapshot {
            plugin_id: "rtc-volcengine".into(),
            status: "degraded".into(),
            checked_at: "2026-07-06T00:00:00.000Z".into(),
            details,
        };
        assert!(!provider_credential_signing_ready(&health));
    }

    #[test]
    fn validate_production_runtime_profile_rejects_dev_environment() {
        let _lock = env_lock().lock().expect("env lock");
        let _env = EnvVarGuard::set("SDKWORK_RTC_ENVIRONMENT", "development");
        let _profile = EnvVarGuard::set("SDKWORK_RTC_DEPLOYMENT_PROFILE", "production");
        assert!(validate_production_runtime_profile().is_err());
    }
}
