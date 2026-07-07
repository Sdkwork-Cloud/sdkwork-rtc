use std::sync::Arc;

use axum::Router;
use sdkwork_rtc_gateway_assembly::assemble_application_router_with_service;
use sdkwork_web_bootstrap::{HttpMetricsRegistry, ServiceRouterConfig, service_router};
use tracing::info;

use sdkwork_communication_rtc_service::rtc_persistence_required;
use sdkwork_communication_rtc_service::validate_production_runtime_profile;
use sdkwork_rtc_standalone_gateway::{
    bootstrap::{build_builtin_provider_registry, build_rtc_api_bootstrap},
    readiness::RtcDatabaseReadinessCheck,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    validate_production_runtime_profile().map_err(anyhow::Error::msg)?;

    let registry = build_builtin_provider_registry()?;
    let bootstrap = build_rtc_api_bootstrap(registry).await?;
    let service = bootstrap.service;

    let assembly = assemble_application_router_with_service(service).await;

    let metrics = HttpMetricsRegistry::new();

    let service_router_config = if let Some(pool) = bootstrap.database_pool {
        ServiceRouterConfig::default()
            .with_readiness_check(Arc::new(RtcDatabaseReadinessCheck::new(pool)))
            .with_metrics(metrics.clone())
    } else if rtc_persistence_required() {
        ServiceRouterConfig::default().with_metrics(metrics.clone())
    } else {
        ServiceRouterConfig::default()
            .with_always_ready()
            .with_metrics(metrics)
    };

    let app = service_router(assembly.router, service_router_config);

    let bind_addr = std::env::var("SDKWORK_RTC_APPLICATION_PUBLIC_INGRESS_BIND")
        .unwrap_or_else(|_| "127.0.0.1:18088".into());
    let listener = tokio::net::TcpListener::bind(bind_addr.as_str()).await?;
    info!(%bind_addr, "sdkwork-rtc-standalone-gateway listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    info!("sdkwork-rtc-standalone-gateway stopped");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }
}
