//! SDKWork RTC database pool bootstrap via `sdkwork-database`.

use sdkwork_database_config::DatabaseConfig;
use sdkwork_database_sqlx::{create_pool_from_config, DatabasePool, PoolError};

pub use sdkwork_rtc_database_host::{
    bootstrap_rtc_database, bootstrap_rtc_database_from_env, RtcDatabaseHost,
};

pub type RtcDatabasePool = DatabasePool;

pub async fn connect_rtc_database_pool_from_env() -> Result<RtcDatabasePool, PoolError> {
    let config = DatabaseConfig::from_env("RTC")?;
    create_pool_from_config(config).await
}

pub async fn connect_and_bootstrap_rtc_database_from_env() -> Result<RtcDatabaseHost, String> {
    let pool = connect_rtc_database_pool_from_env()
        .await
        .map_err(|error| error.to_string())?;
    bootstrap_rtc_database(pool).await
}
