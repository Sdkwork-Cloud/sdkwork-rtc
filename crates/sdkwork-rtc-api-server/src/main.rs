use axum::{Router, routing::get};
use tracing::info;

mod bootstrap;
use bootstrap::{build_builtin_provider_registry, build_product_service};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let registry = build_builtin_provider_registry()?;
    let service = build_product_service(registry).await?;
    let app = Router::new()
        .route("/health", get(health))
        .route("/ready", get(ready))
        .merge(sdkwork_router_rtc_app_api::build_sdkwork_rtc_app_api_router(service.clone()))
        .merge(sdkwork_router_rtc_backend_api::build_sdkwork_rtc_backend_api_router(service));

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

async fn health() -> &'static str {
    "ok"
}

async fn ready() -> &'static str {
    "ok"
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
