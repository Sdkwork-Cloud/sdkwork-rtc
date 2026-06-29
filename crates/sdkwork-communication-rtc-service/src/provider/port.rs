use std::sync::Arc;

use super::descriptor::{ProviderHealthSnapshot, ProviderPluginDescriptor};
use crate::{
    RtcContractError, RtcCreateMediaSessionRequest, RtcParticipantCredential,
    RtcParticipantCredentialContext, RtcProviderQueryRequest, RtcProviderQueryResult,
    RtcProviderWebhookEvent, RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest,
    RtcRecordingArtifact, RtcRecordingArtifactExportRequest, RtcRecordingArtifactsFuture,
    RtcSessionHandle, verify_provider_webhook_signature_hmac,
};

pub trait RtcProviderPort: Send + Sync {
    fn descriptor(&self) -> ProviderPluginDescriptor;
    fn create_session(
        &self,
        request: RtcCreateMediaSessionRequest,
    ) -> Result<RtcSessionHandle, RtcContractError>;
    fn close_session(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<bool, RtcContractError>;
    fn issue_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError>;
    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError>;
    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        Err(RtcContractError::UnsupportedCapability(format!(
            "{} provider webhook parsing is not implemented",
            request.provider
        )))
    }
    fn verify_provider_webhook_signature(
        &self,
        request: RtcProviderWebhookVerifyRequest,
    ) -> Result<(), RtcContractError> {
        verify_provider_webhook_signature_hmac(request)
    }
    fn query_provider_state(
        &self,
        request: RtcProviderQueryRequest,
    ) -> Result<RtcProviderQueryResult, RtcContractError> {
        Err(RtcContractError::UnsupportedCapability(format!(
            "{} provider active query is not implemented",
            request.provider
        )))
    }
    fn export_recording_artifact(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError>;
    fn export_recording_artifacts(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Vec<RtcRecordingArtifact>, RtcContractError> {
        Ok(self
            .export_recording_artifact(tenant_id, rtc_session_id)?
            .into_iter()
            .collect())
    }
    fn export_recording_artifacts_for_query<'a>(
        &'a self,
        request: RtcRecordingArtifactExportRequest,
    ) -> RtcRecordingArtifactsFuture<'a> {
        Box::pin(async move {
            self.export_recording_artifacts(
                request.tenant_id.as_str(),
                request.rtc_session_id.as_str(),
            )
        })
    }
    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot;
}

pub trait RtcProviderPluginFactory: Send + Sync {
    fn descriptor(&self) -> ProviderPluginDescriptor;
    fn create_provider(&self) -> Arc<dyn RtcProviderPort>;
}
