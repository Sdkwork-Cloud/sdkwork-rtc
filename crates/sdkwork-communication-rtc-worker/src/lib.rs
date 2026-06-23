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

    pub async fn run_job(
        &self,
        job: RtcWorkerJob,
    ) -> Result<RtcSessionReconcileResult, String> {
        match job {
            RtcWorkerJob::SessionReconciliation => {
                self.service.reconcile_stale_media_sessions().await
            }
        }
    }
}
