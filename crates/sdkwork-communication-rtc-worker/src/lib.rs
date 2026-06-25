use sdkwork_rtc_service_host::{RtcProductService, RtcSessionReconcileResult};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RtcWorkerJob {
    SessionReconciliation,
}

pub struct RtcWorker {
    service: RtcProductService,
}

impl RtcWorker {
    pub fn new(service: RtcProductService) -> Self {
        Self { service }
    }

    pub fn service(&self) -> &RtcProductService {
        &self.service
    }

    pub async fn run_job(&self, job: RtcWorkerJob) -> Result<RtcSessionReconcileResult, String> {
        match job {
            RtcWorkerJob::SessionReconciliation => {
                self.service.reconcile_stale_media_sessions().await
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_rtc_service_host::RtcProviderPluginRegistry;

    #[tokio::test]
    async fn session_reconciliation_job_returns_empty_result_on_fresh_service() {
        let worker = RtcWorker::new(RtcProductService::new(RtcProviderPluginRegistry::new()));
        let result = worker
            .run_job(RtcWorkerJob::SessionReconciliation)
            .await
            .expect("reconciliation should succeed");
        assert_eq!(result.scanned, 0);
        assert!(result.failures.is_empty());
    }
}
