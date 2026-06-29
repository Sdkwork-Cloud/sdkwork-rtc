use std::sync::Arc;

use sdkwork_communication_rtc_repository_sqlx::connect_rtc_persistence_bootstrap_from_env;
use sdkwork_communication_rtc_service::rtc_persistence_required;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_rtc_service_host::{RtcProductService, RtcProviderPluginRegistry};

pub use sdkwork_rtc_plugin_bootstrap::build_builtin_provider_registry;

pub struct RtcApiBootstrap {
    pub service: Arc<RtcProductService>,
    pub database_pool: Option<DatabasePool>,
}

pub async fn build_rtc_api_bootstrap(
    registry: RtcProviderPluginRegistry,
) -> anyhow::Result<RtcApiBootstrap> {
    build_rtc_runtime_bootstrap(registry, true).await
}

pub async fn build_rtc_reconcile_bootstrap(
    registry: RtcProviderPluginRegistry,
) -> anyhow::Result<RtcApiBootstrap> {
    build_rtc_runtime_bootstrap(registry, false).await
}

async fn build_rtc_runtime_bootstrap(
    registry: RtcProviderPluginRegistry,
    startup_hydrate: bool,
) -> anyhow::Result<RtcApiBootstrap> {
    let mut service = RtcProductService::new(registry);
    let mut database_pool = None;
    if let Some(bootstrap) = connect_rtc_persistence_bootstrap_from_env()
        .await
        .map_err(|error| anyhow::anyhow!("connect RTC persistence: {error}"))?
    {
        database_pool = bootstrap.pool;
        service = service.with_persistence(bootstrap.persistence);
        if startup_hydrate {
            let tenant_id =
                std::env::var("SDKWORK_RTC_HYDRATE_TENANT_ID").unwrap_or_else(|_| "default".into());
            let organization_id = std::env::var("SDKWORK_RTC_HYDRATE_ORGANIZATION_ID")
                .unwrap_or_else(|_| "default".into());
            service
                .hydrate_from_persistence(tenant_id, organization_id)
                .await?;
        }
    } else if rtc_persistence_required() {
        return Err(anyhow::anyhow!(
            "RTC database persistence is required when SDKWORK_RTC_ENVIRONMENT is not development, dev, local, or test"
        ));
    }
    Ok(RtcApiBootstrap {
        service: Arc::new(service),
        database_pool,
    })
}

pub async fn build_product_service(
    registry: RtcProviderPluginRegistry,
) -> anyhow::Result<Arc<RtcProductService>> {
    Ok(build_rtc_api_bootstrap(registry).await?.service)
}
