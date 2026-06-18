use axum::Router;
use sdkwork_web_bootstrap::{ServiceRouterConfig, service_router};
use std::sync::Arc;
use tracing::info;

mod bootstrap;
mod readiness;
use bootstrap::{build_builtin_provider_registry, build_rtc_api_bootstrap};
use readiness::RtcDatabaseReadinessCheck;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let registry = build_builtin_provider_registry()?;
    let bootstrap = build_rtc_api_bootstrap(registry).await?;
    let service = bootstrap.service;

    let app_router = sdkwork_router_rtc_app_api::wrap_router_with_web_framework_from_env(
        sdkwork_router_rtc_app_api::build_sdkwork_rtc_app_api_router(service.clone()),
    )
    .await;
    let backend_router = sdkwork_router_rtc_backend_api::wrap_router_with_web_framework_from_env(
        sdkwork_router_rtc_backend_api::build_sdkwork_rtc_backend_api_router(service),
    )
    .await;

    let service_router_config = if let Some(pool) = bootstrap.database_pool {
        ServiceRouterConfig {
            readiness: Some(Arc::new(RtcDatabaseReadinessCheck::new(pool))),
            metrics: None,
        }
    } else {
        ServiceRouterConfig::default().with_always_ready()
    };

    let app = service_router(
        Router::new().merge(app_router).merge(backend_router),
        service_router_config,
    );

    let bind_addr = std::env::var("SDKWORK_RTC_APPLICATION_PUBLIC_INGRESS_BIND")
        .unwrap_or_else(|_| "127.0.0.1:18088".into());
    let listener = tokio::net::TcpListener::bind(bind_addr.as_str()).await?;
    info!(%bind_addr, "sdkwork-rtc-api-server listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    info!("sdkwork-rtc-api-server stopped");
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
