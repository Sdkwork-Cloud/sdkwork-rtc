use std::sync::Arc;

use sdkwork_communication_rtc_service::RtcPersistencePort;
use sdkwork_database_repository::health::{HealthCheckResult, HealthChecker, HealthStatus};
use sdkwork_database_sqlx::{DatabasePool, PoolError, create_pool_from_env};

use crate::{RtcPostgresPersistencePort, RtcSqlitePersistencePort};

/// RTC persistence bootstrap output, including the framework pool when available.
#[derive(Clone)]
pub struct RtcPersistenceBootstrap {
    pub persistence: Arc<dyn RtcPersistencePort>,
    pub pool: Option<DatabasePool>,
}

const RTC_DATABASE_ENV_KEYS: &[&str] = &[
    "SDKWORK_RTC_DATABASE_URL",
    "SDKWORK_RTC_DATABASE_FILE",
    "SDKWORK_RTC_DATABASE_ENGINE",
    "SDKWORK_RTC_DATABASE_HOST",
    "SDKWORK_RTC_DATABASE_PORT",
    "SDKWORK_RTC_DATABASE_NAME",
    "SDKWORK_RTC_DATABASE_SCHEMA",
    "SDKWORK_RTC_DATABASE_USERNAME",
    "SDKWORK_RTC_DATABASE_PASSWORD",
    "SDKWORK_RTC_DATABASE_PASSWORD_FILE",
    "SDKWORK_RTC_DATABASE_SSL_MODE",
    "SDKWORK_RTC_DATABASE_MODE",
    "SDKWORK_RTC_DATABASE_TABLE_PREFIX",
    "SDKWORK_RTC_DATABASE_MAX_CONNECTIONS",
    "SDKWORK_RTC_DATABASE_MIN_CONNECTIONS",
    "SDKWORK_RTC_DATABASE_ACQUIRE_TIMEOUT",
    "SDKWORK_RTC_DATABASE_IDLE_TIMEOUT",
    "SDKWORK_RTC_DATABASE_MAX_LIFETIME",
];

/// Connects an RTC persistence port using the standard SDKWork database env profile.
pub async fn connect_rtc_persistence_from_env()
-> Result<Option<Arc<dyn RtcPersistencePort>>, PoolError> {
    Ok(connect_rtc_persistence_bootstrap_from_env()
        .await?
        .map(|bootstrap| bootstrap.persistence))
}

/// Connects RTC persistence and retains the framework pool for readiness probes.
pub async fn connect_rtc_persistence_bootstrap_from_env()
-> Result<Option<RtcPersistenceBootstrap>, PoolError> {
    if !rtc_database_env_explicitly_configured() {
        return Ok(None);
    }

    let Some(pool) = create_pool_from_env("SDKWORK_RTC").await? else {
        return Ok(None);
    };
    let persistence = persistence_from_database_pool(pool.clone())
        .await
        .map_err(|error| PoolError::DatabaseConfig(error.to_string()))?;
    Ok(Some(RtcPersistenceBootstrap {
        persistence,
        pool: Some(pool),
    }))
}

pub fn rtc_database_env_explicitly_configured() -> bool {
    rtc_database_env_values_explicitly_configured(|key| std::env::var(key).ok())
}

pub fn rtc_database_env_values_explicitly_configured(
    lookup: impl Fn(&str) -> Option<String>,
) -> bool {
    RTC_DATABASE_ENV_KEYS.iter().any(|key| {
        lookup(key)
            .map(|value| !value.trim().is_empty())
            .unwrap_or(false)
    })
}

pub async fn persistence_from_database_pool(
    pool: DatabasePool,
) -> Result<Arc<dyn RtcPersistencePort>, sqlx::Error> {
    match pool {
        DatabasePool::Postgres(ref pg_pool, _) => {
            sdkwork_rtc_database_host::bootstrap_rtc_database(pool.clone())
                .await
                .map_err(|error| sqlx::Error::Configuration(error.into()))?;
            Ok(Arc::new(RtcPostgresPersistencePort::new(pg_pool.clone())))
        }
        DatabasePool::Sqlite(ref sqlite_pool, _) => {
            sdkwork_rtc_database_host::bootstrap_rtc_database(pool.clone())
                .await
                .map_err(|error| sqlx::Error::Configuration(error.into()))?;
            Ok(Arc::new(RtcSqlitePersistencePort::new(sqlite_pool.clone())))
        }
    }
}

pub async fn check_rtc_database_health(pool: DatabasePool) -> Result<HealthCheckResult, PoolError> {
    HealthChecker::new(pool)
        .check()
        .await
        .map_err(|error| PoolError::DatabaseConfig(error.to_string()))
}

pub fn is_rtc_database_healthy(result: &HealthCheckResult) -> bool {
    matches!(
        result.status,
        HealthStatus::Healthy | HealthStatus::Degraded(_)
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn rtc_database_env_is_not_configured_without_rtc_prefixed_keys() {
        assert!(!rtc_database_env_values_explicitly_configured(|_| None));
    }

    #[test]
    fn rtc_database_env_is_configured_when_rtc_database_url_is_set() {
        let values = HashMap::from([(
            "SDKWORK_RTC_DATABASE_URL".to_string(),
            "sqlite://./.runtime/rtc.sqlite".to_string(),
        )]);
        assert!(rtc_database_env_values_explicitly_configured(|key| {
            values.get(key).cloned()
        }));
    }

    #[test]
    fn rtc_database_env_ignores_blank_rtc_prefixed_values() {
        let values = HashMap::from([("SDKWORK_RTC_DATABASE_URL".to_string(), "   ".to_string())]);
        assert!(!rtc_database_env_values_explicitly_configured(|key| {
            values.get(key).cloned()
        }));
    }
}
