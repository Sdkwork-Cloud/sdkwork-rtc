use sdkwork_communication_rtc_worker::{RtcWorker, RtcWorkerJob};
use sdkwork_rtc_api_server::bootstrap::{
    build_builtin_provider_registry, build_rtc_reconcile_bootstrap,
};
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let registry = build_builtin_provider_registry()?;
    let bootstrap = build_rtc_reconcile_bootstrap(registry).await?;
    let service = bootstrap.service;

    let hydrated_scopes = service.hydrate_for_reconciliation().await?;
    info!(
        hydrated_scopes,
        "sdkwork-rtc-reconcile hydrated runtime state from persistence"
    );

    let worker = RtcWorker::new((*service).clone());
    let result = worker
        .run_job(RtcWorkerJob::SessionReconciliation)
        .await
        .map_err(anyhow::Error::msg)?;

    info!(
        scanned = result.scanned,
        closed = result.closed,
        skipped = result.skipped,
        provider_queried = result.provider_queried,
        provider_synced = result.provider_synced,
        compensated = result.compensated,
        failures = result.failures.len(),
        "sdkwork-rtc-reconcile completed"
    );

    if !result.failures.is_empty() {
        for failure in &result.failures {
            tracing::error!(failure, "reconciliation failure");
        }
        std::process::exit(1);
    }

    Ok(())
}
