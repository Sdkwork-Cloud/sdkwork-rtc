//! Gateway bootstrap for sdkwork-rtc.
//! Multi-surface assembly merges business routers only; listeners add infra via `service_router`.

use axum::Router;
use sdkwork_communication_rtc_repository_sqlx::connect_rtc_persistence_bootstrap_from_env;
use sdkwork_communication_rtc_service::rtc_persistence_required;
use sdkwork_rtc_adapter_agora::{
    create_agora_rtc_provider_plugin_factory, AgoraRtcProviderConfig,
};
use sdkwork_rtc_adapter_aliyun::{
    create_aliyun_rtc_provider_plugin_factory, AliyunRtcProviderConfig,
};
use sdkwork_rtc_adapter_livekit::{
    create_livekit_rtc_provider_plugin_factory, LivekitRtcProviderConfig,
};
use sdkwork_rtc_adapter_tencent::{
    create_tencent_rtc_provider_plugin_factory, TencentRtcProviderConfig,
};
use sdkwork_rtc_adapter_volcengine::{
    create_volcengine_rtc_provider_plugin_factory, VolcengineRtcProviderConfig,
};
use sdkwork_rtc_service_host::{RtcProductService, RtcProviderPluginRegistry};
use std::sync::Arc;

pub struct ApplicationAssembly {
    pub router: Router,
}

fn build_builtin_provider_registry() -> anyhow::Result<RtcProviderPluginRegistry> {
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
        .map_err(anyhow::Error::from)
}

async fn bootstrap_product_service() -> anyhow::Result<Arc<RtcProductService>> {
    let registry = build_builtin_provider_registry()?;
    let mut service = RtcProductService::new(registry);

    if let Some(bootstrap) = connect_rtc_persistence_bootstrap_from_env()
        .await
        .map_err(|error| anyhow::anyhow!("connect RTC persistence: {error}"))?
    {
        service = service.with_persistence(bootstrap.persistence);
        let tenant_id =
            std::env::var("SDKWORK_RTC_HYDRATE_TENANT_ID").unwrap_or_else(|_| "default".into());
        let organization_id = std::env::var("SDKWORK_RTC_HYDRATE_ORGANIZATION_ID")
            .unwrap_or_else(|_| "default".into());
        service
            .hydrate_from_persistence(tenant_id, organization_id)
            .await?;
    } else if rtc_persistence_required() {
        return Err(anyhow::anyhow!(
            "RTC database persistence is required when SDKWORK_RTC_ENVIRONMENT is not development, dev, local, or test"
        ));
    }

    Ok(Arc::new(service))
}

pub async fn assemble_application_router_with_service(
    service: Arc<RtcProductService>,
) -> ApplicationAssembly {
    let app_router = sdkwork_routes_rtc_app_api::wrap_router_with_web_framework_from_env(
        sdkwork_routes_rtc_app_api::gateway_mount(service.clone()),
    )
    .await;
    let backend_router = sdkwork_routes_rtc_backend_api::wrap_router_with_web_framework_from_env(
        sdkwork_routes_rtc_backend_api::gateway_mount(service),
    )
    .await;

    ApplicationAssembly {
        router: Router::new().merge(app_router).merge(backend_router),
    }
}

pub async fn assemble_application_router() -> anyhow::Result<ApplicationAssembly> {
    Ok(assemble_application_router_with_service(bootstrap_product_service().await?).await)
}
