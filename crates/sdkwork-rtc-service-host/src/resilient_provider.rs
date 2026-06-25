use std::sync::Arc;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use sdkwork_communication_rtc_service::{
    ProviderHealthSnapshot, ProviderPluginDescriptor, RtcContractError,
    RtcCreateMediaSessionRequest, RtcParticipantCredential, RtcParticipantCredentialContext,
    RtcProviderPort, RtcProviderQueryRequest, RtcProviderQueryResult, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest, RtcRecordingArtifact,
    RtcRecordingArtifactExportRequest, RtcRecordingArtifactsFuture, RtcSessionHandle,
};

const DEFAULT_PROVIDER_TIMEOUT_MS: u64 = 30_000;

pub fn provider_call_timeout_ms() -> u64 {
    std::env::var("SDKWORK_RTC_PROVIDER_TIMEOUT_MS")
        .ok()
        .and_then(|value| value.trim().parse::<u64>().ok())
        .filter(|value| *value > 0)
        .unwrap_or(DEFAULT_PROVIDER_TIMEOUT_MS)
}

pub fn wrap_provider_with_timeout(provider: Arc<dyn RtcProviderPort>) -> Arc<dyn RtcProviderPort> {
    Arc::new(TimeoutRtcProviderPort {
        inner: provider,
        timeout_ms: provider_call_timeout_ms(),
    })
}

struct TimeoutRtcProviderPort {
    inner: Arc<dyn RtcProviderPort>,
    timeout_ms: u64,
}

impl TimeoutRtcProviderPort {
    fn run_with_timeout<T, F>(
        &self,
        operation: &'static str,
        callback: F,
    ) -> Result<T, RtcContractError>
    where
        T: Send + 'static,
        F: FnOnce(Arc<dyn RtcProviderPort>) -> Result<T, RtcContractError> + Send + 'static,
    {
        let inner = Arc::clone(&self.inner);
        let (sender, receiver) = mpsc::channel();
        thread::spawn(move || {
            let _ = sender.send(callback(inner));
        });
        receiver
            .recv_timeout(Duration::from_millis(self.timeout_ms))
            .map_err(|_| {
                RtcContractError::Unavailable(format!(
                    "RTC provider {operation} timed out after {} ms",
                    self.timeout_ms
                ))
            })?
    }
}

impl RtcProviderPort for TimeoutRtcProviderPort {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        self.inner.descriptor()
    }

    fn create_session(
        &self,
        request: RtcCreateMediaSessionRequest,
    ) -> Result<RtcSessionHandle, RtcContractError> {
        self.run_with_timeout("create_session", move |inner| inner.create_session(request))
    }

    fn close_session(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<bool, RtcContractError> {
        let tenant_id = tenant_id.to_owned();
        let rtc_session_id = rtc_session_id.to_owned();
        self.run_with_timeout("close_session", move |inner| {
            inner.close_session(tenant_id.as_str(), rtc_session_id.as_str())
        })
    }

    fn issue_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        let tenant_id = tenant_id.to_owned();
        let rtc_session_id = rtc_session_id.to_owned();
        let participant_id = participant_id.to_owned();
        let context = context.cloned();
        self.run_with_timeout("issue_participant_credential", move |inner| {
            inner.issue_participant_credential(
                tenant_id.as_str(),
                rtc_session_id.as_str(),
                participant_id.as_str(),
                context.as_ref(),
            )
        })
    }

    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        let tenant_id = tenant_id.to_owned();
        let rtc_session_id = rtc_session_id.to_owned();
        let participant_id = participant_id.to_owned();
        let context = context.cloned();
        self.run_with_timeout("refresh_participant_credential", move |inner| {
            inner.refresh_participant_credential(
                tenant_id.as_str(),
                rtc_session_id.as_str(),
                participant_id.as_str(),
                context.as_ref(),
            )
        })
    }

    fn export_recording_artifact(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        let tenant_id = tenant_id.to_owned();
        let rtc_session_id = rtc_session_id.to_owned();
        self.run_with_timeout("export_recording_artifact", move |inner| {
            inner.export_recording_artifact(tenant_id.as_str(), rtc_session_id.as_str())
        })
    }

    fn export_recording_artifacts(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Vec<RtcRecordingArtifact>, RtcContractError> {
        let tenant_id = tenant_id.to_owned();
        let rtc_session_id = rtc_session_id.to_owned();
        self.run_with_timeout("export_recording_artifacts", move |inner| {
            inner.export_recording_artifacts(tenant_id.as_str(), rtc_session_id.as_str())
        })
    }

    fn export_recording_artifacts_for_query<'a>(
        &'a self,
        request: RtcRecordingArtifactExportRequest,
    ) -> RtcRecordingArtifactsFuture<'a> {
        self.inner.export_recording_artifacts_for_query(request)
    }

    fn query_provider_state(
        &self,
        request: RtcProviderQueryRequest,
    ) -> Result<RtcProviderQueryResult, RtcContractError> {
        self.run_with_timeout("query_provider_state", move |inner| {
            inner.query_provider_state(request)
        })
    }

    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        self.inner.parse_provider_webhook(request)
    }

    fn verify_provider_webhook_signature(
        &self,
        request: RtcProviderWebhookVerifyRequest,
    ) -> Result<(), RtcContractError> {
        self.inner.verify_provider_webhook_signature(request)
    }

    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot {
        self.inner.provider_health_snapshot()
    }
}
