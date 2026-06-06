use std::collections::BTreeMap;

use sdkwork_rtc_core::{
    ProviderDomain, ProviderHealthSnapshot, ProviderPluginDescriptor,
    RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES, RTC_PROVIDER_REQUIRED_CAPABILITIES,
    RtcCallbackEvent, RtcCallbackRequest, RtcContractError, RtcCreateSessionRequest,
    RtcParticipantCredential, RtcProviderPort, RtcRecordingArtifact, RtcSessionHandle,
    utc_now_rfc3339_millis,
};

pub const AGORA_RTC_PLUGIN_ID: &str = "rtc-agora";
const DEFAULT_ACCESS_ENDPOINT: &str = "wss://rtc.agora.local/session";
const DEFAULT_REGION: &str = "global";

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AgoraRtcProviderConfig {
    pub access_endpoint: String,
    pub region: String,
}

impl Default for AgoraRtcProviderConfig {
    fn default() -> Self {
        Self {
            access_endpoint: std::env::var("SDKWORK_RTC_AGORA_ACCESS_ENDPOINT")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_ACCESS_ENDPOINT.into()),
            region: std::env::var("SDKWORK_RTC_AGORA_REGION")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| DEFAULT_REGION.into()),
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct AgoraRtcProvider {
    config: AgoraRtcProviderConfig,
}

impl AgoraRtcProvider {
    pub fn new(config: AgoraRtcProviderConfig) -> Self {
        Self { config }
    }

    fn descriptor_with_defaults(&self) -> ProviderPluginDescriptor {
        ProviderPluginDescriptor::new(AGORA_RTC_PLUGIN_ID, ProviderDomain::Rtc, "agora", "Agora RTC")
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
        request: RtcCreateSessionRequest,
    ) -> Result<RtcSessionHandle, RtcContractError> {
        Ok(RtcSessionHandle {
            tenant_id: request.tenant_id,
            rtc_session_id: request.rtc_session_id.clone(),
            provider_session_id: format!("agora:{}", request.rtc_session_id),
            access_endpoint: Some(self.config.access_endpoint.clone()),
            region: Some(self.config.region.clone()),
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

    fn map_provider_callback(
        &self,
        request: RtcCallbackRequest,
    ) -> Result<RtcCallbackEvent, RtcContractError> {
        Ok(RtcCallbackEvent {
            rtc_session_id: request.rtc_session_id,
            event_type: request.callback_type,
            participant_id: None,
            payload_json: request.payload_json,
        })
    }

    fn export_recording_artifact(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        Ok(Some(RtcRecordingArtifact::drive_backed_recording(
            tenant_id,
            rtc_session_id,
            "space_rtc_recordings",
            format!("node_{rtc_session_id}"),
            None,
        )))
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
