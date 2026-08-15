use sdkwork_api_rtc_assembly::assemble_api_router;
use sdkwork_web_bootstrap::{HttpMetricsRegistry, ServiceRouterConfig, service_router};
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let assembly = assemble_api_router().await?;

    let metrics = HttpMetricsRegistry::new();
    let service_router_config = ServiceRouterConfig::default()
        .with_readiness_check(assembly.readiness_check.clone())
        .with_metrics(metrics);

    let app = service_router(assembly.router, service_router_config);

    let bind_addr = std::env::var("SDKWORK_RTC_APPLICATION_PUBLIC_INGRESS_BIND")
        .unwrap_or_else(|_| "127.0.0.1:18088".into());
    let listener = tokio::net::TcpListener::bind(bind_addr.as_str()).await?;
    info!(%bind_addr, "sdkwork-api-rtc-standalone-gateway listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    info!("sdkwork-api-rtc-standalone-gateway stopped");
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
