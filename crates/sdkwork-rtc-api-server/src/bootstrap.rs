use std::sync::Arc;

use sdkwork_communication_rtc_repository_sqlx::{
    POSTGRES_SCHEMA, RtcPostgresPersistencePort, RtcSqlitePersistencePort, SQLITE_SCHEMA,
};
use sdkwork_communication_rtc_service::RtcPersistencePort;
use sdkwork_rtc_service_host::{
    RtcProductService, RtcProviderPluginRegistry, RtcProviderPluginRegistryError,
};
use sqlx::postgres::PgPoolOptions;
use sqlx::sqlite::SqlitePoolOptions;

pub fn build_builtin_provider_registry()
-> Result<RtcProviderPluginRegistry, RtcProviderPluginRegistryError> {
    use sdkwork_rtc_adapter_agora::{
        AgoraRtcProviderConfig, create_agora_rtc_provider_plugin_factory,
    };
    use sdkwork_rtc_adapter_aliyun::{
        AliyunRtcProviderConfig, create_aliyun_rtc_provider_plugin_factory,
    };
    use sdkwork_rtc_adapter_livekit::{
        LivekitRtcProviderConfig, create_livekit_rtc_provider_plugin_factory,
    };
    use sdkwork_rtc_adapter_tencent::{
        TencentRtcProviderConfig, create_tencent_rtc_provider_plugin_factory,
    };
    use sdkwork_rtc_adapter_volcengine::{
        VolcengineRtcProviderConfig, create_volcengine_rtc_provider_plugin_factory,
    };

    RtcProviderPluginRegistry::new()
        .with_provider_factory(Arc::new(create_volcengine_rtc_provider_plugin_factory(
            VolcengineRtcProviderConfig::default(),
        )))
        .and_then(|registry| {
            registry.with_provider_factory(Arc::new(create_tencent_rtc_provider_plugin_factory(
                TencentRtcProviderConfig::default(),
            )))
        })
        .and_then(|registry| {
            registry.with_provider_factory(Arc::new(create_agora_rtc_provider_plugin_factory(
                AgoraRtcProviderConfig::default(),
            )))
        })
        .and_then(|registry| {
            registry.with_provider_factory(Arc::new(create_aliyun_rtc_provider_plugin_factory(
                AliyunRtcProviderConfig::default(),
            )))
        })
        .and_then(|registry| {
            registry.with_provider_factory(Arc::new(create_livekit_rtc_provider_plugin_factory(
                LivekitRtcProviderConfig::default(),
            )))
        })
}

pub async fn build_product_service(
    registry: RtcProviderPluginRegistry,
) -> anyhow::Result<Arc<RtcProductService>> {
    let mut service = RtcProductService::new(registry);
    if let Some(database_url) = std::env::var("SDKWORK_RTC_DATABASE_URL")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
    {
        let persistence = connect_persistence(database_url.as_str()).await?;
        service = service.with_persistence(persistence);
        let tenant_id =
            std::env::var("SDKWORK_RTC_HYDRATE_TENANT_ID").unwrap_or_else(|_| "default".into());
        let organization_id = std::env::var("SDKWORK_RTC_HYDRATE_ORGANIZATION_ID")
            .unwrap_or_else(|_| "default".into());
        service
            .hydrate_from_persistence(tenant_id, organization_id)
            .await?;
    }
    Ok(Arc::new(service))
}

async fn connect_persistence(database_url: &str) -> anyhow::Result<Arc<dyn RtcPersistencePort>> {
    if database_url.starts_with("postgres://") || database_url.starts_with("postgresql://") {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await?;
        apply_postgres_schema(&pool).await?;
        return Ok(Arc::new(RtcPostgresPersistencePort::new(pool)));
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;
    apply_sqlite_schema(&pool).await?;
    Ok(Arc::new(RtcSqlitePersistencePort::new(pool)))
}

async fn apply_sqlite_schema(pool: &sqlx::SqlitePool) -> anyhow::Result<()> {
    for statement in SQLITE_SCHEMA
        .split(';')
        .map(str::trim)
        .filter(|statement| !statement.is_empty())
    {
        sqlx::query(statement).execute(pool).await?;
    }
    Ok(())
}

async fn apply_postgres_schema(pool: &sqlx::PgPool) -> anyhow::Result<()> {
    for statement in POSTGRES_SCHEMA
        .split(';')
        .map(str::trim)
        .filter(|statement| !statement.is_empty())
    {
        sqlx::query(statement).execute(pool).await?;
    }
    Ok(())
}
