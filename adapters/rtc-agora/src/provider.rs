use std::collections::BTreeMap;

use sdkwork_rtc_core::{
    ProviderDomain, ProviderHealthSnapshot, ProviderPluginDescriptor,
    RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES, RTC_PROVIDER_REQUIRED_CAPABILITIES, RtcContractError,
    RtcCreateMediaSessionRequest, RtcParticipantCredential, RtcProviderPort,
    RtcProviderQueryRequest, RtcProviderQueryResult, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcRecordingArtifact, RtcSessionHandle, utc_now_rfc3339_millis,
};

use crate::config::AgoraRtcProviderConfig;
use crate::{query, recording, webhook};

pub const AGORA_RTC_PLUGIN_ID: &str = "rtc-agora";

#[derive(Clone, Debug, Default)]
pub struct AgoraRtcProvider {
    config: AgoraRtcProviderConfig,
}

impl AgoraRtcProvider {
    pub fn new(config: AgoraRtcProviderConfig) -> Self {
        Self { config }
    }

    fn descriptor_with_defaults(&self) -> ProviderPluginDescriptor {
        ProviderPluginDescriptor::new(
            AGORA_RTC_PLUGIN_ID,
            ProviderDomain::Rtc,
            "agora",
            "Agora RTC",
        )
        .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
        .with_optional_capabilities(RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES)
    }
}

impl RtcProviderPort for AgoraRtcProvider {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        self.descriptor_with_defaults()
    }

    fn create_session(
        &self,
        request: RtcCreateMediaSessionRequest,
    ) -> Result<RtcSessionHandle, RtcContractError> {
        let region = request
            .region
            .filter(|region| !region.trim().is_empty())
            .unwrap_or_else(|| self.config.region.clone());
        Ok(RtcSessionHandle {
            tenant_id: request.tenant_id,
            rtc_session_id: request.rtc_session_id.clone(),
            provider_session_id: format!("agora:{}", request.rtc_session_id),
            access_endpoint: Some(self.config.access_endpoint.clone()),
            region: Some(region),
        })
    }

    fn close_session(
        &self,
        _tenant_id: &str,
        _rtc_session_id: &str,
    ) -> Result<bool, RtcContractError> {
        Ok(true)
    }

    fn issue_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        Ok(RtcParticipantCredential {
            tenant_id: tenant_id.into(),
            rtc_session_id: rtc_session_id.into(),
            participant_id: participant_id.into(),
            credential: format!("agora-token:{tenant_id}:{rtc_session_id}:{participant_id}"),
            expires_at: utc_now_rfc3339_millis(),
        })
    }

    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        self.issue_participant_credential(tenant_id, rtc_session_id, participant_id)
    }

    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        webhook::parse_provider_webhook(request)
    }

    fn query_provider_state(
        &self,
        request: RtcProviderQueryRequest,
    ) -> Result<RtcProviderQueryResult, RtcContractError> {
        query::query_provider_state(&self.config, request)
    }

    fn export_recording_artifact(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        recording::export_recording_artifact(tenant_id, rtc_session_id)
    }

    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot {
        let mut details = BTreeMap::new();
        details.insert("providerKind".into(), "agora".into());
        details.insert("accessEndpoint".into(), self.config.access_endpoint.clone());
        details.insert("region".into(), self.config.region.clone());
        ProviderHealthSnapshot {
            plugin_id: AGORA_RTC_PLUGIN_ID.into(),
            status: "healthy".into(),
            checked_at: utc_now_rfc3339_millis(),
            details,
        }
    }
}
