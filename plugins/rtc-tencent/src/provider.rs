use std::collections::BTreeMap;
use std::sync::Arc;

use sdkwork_communication_rtc_service::{
    ProviderDomain, ProviderHealthSnapshot, ProviderPluginDescriptor,
    RTC_PROVIDER_REQUIRED_CAPABILITIES, RTC_PROVIDER_TENCENT_OPTIONAL_CAPABILITIES,
    RtcContractError, RtcCreateMediaSessionRequest, RtcParticipantCredential, RtcProviderPort,
    RtcProviderQueryRequest, RtcProviderQueryResult, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcRecordingArtifact, RtcRecordingArtifactExportRequest,
    RtcRecordingArtifactImportPort, RtcRecordingArtifactsFuture, RtcSessionHandle,
    utc_now_rfc3339_millis,
};

use crate::config::TencentRtcProviderConfig;
use crate::credential::{
    format_unix_seconds_rfc3339, generate_tencent_user_sig, issued_at_unix_seconds,
};
use crate::open_api::TencentRtcOpenApiExecutor;
use crate::{query, recording, webhook};

pub const TENCENT_RTC_PLUGIN_ID: &str = "rtc-tencent";

#[derive(Clone, Default)]
pub struct TencentRtcProvider {
    config: TencentRtcProviderConfig,
    open_api_executor: Option<Arc<dyn TencentRtcOpenApiExecutor>>,
    recording_importer: Option<Arc<dyn RtcRecordingArtifactImportPort>>,
}

impl TencentRtcProvider {
    pub fn new(config: TencentRtcProviderConfig) -> Self {
        Self {
            config,
            open_api_executor: None,
            recording_importer: None,
        }
    }

    pub fn with_open_api_executor(mut self, executor: Arc<dyn TencentRtcOpenApiExecutor>) -> Self {
        self.open_api_executor = Some(executor);
        self
    }

    pub fn with_recording_importer(
        mut self,
        importer: Arc<dyn RtcRecordingArtifactImportPort>,
    ) -> Self {
        self.recording_importer = Some(importer);
        self
    }

    fn descriptor_with_defaults(&self) -> ProviderPluginDescriptor {
        ProviderPluginDescriptor::new(
            TENCENT_RTC_PLUGIN_ID,
            ProviderDomain::Rtc,
            "tencent",
            "Tencent RTC",
        )
        .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
        .with_optional_capabilities(RTC_PROVIDER_TENCENT_OPTIONAL_CAPABILITIES)
    }
}

impl RtcProviderPort for TencentRtcProvider {
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
            provider_session_id: format!("tencent:{}", request.rtc_session_id),
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
        if self.config.sdk_app_id.is_some() && self.config.sdk_secret_key.is_some() {
            let issued_at = issued_at_unix_seconds();
            let (credential, expire_at) =
                generate_tencent_user_sig(&self.config, participant_id, issued_at)?;
            return Ok(RtcParticipantCredential {
                tenant_id: tenant_id.into(),
                rtc_session_id: rtc_session_id.into(),
                participant_id: participant_id.into(),
                credential,
                expires_at: format_unix_seconds_rfc3339(expire_at),
            });
        }

        Ok(RtcParticipantCredential {
            tenant_id: tenant_id.into(),
            rtc_session_id: rtc_session_id.into(),
            participant_id: participant_id.into(),
            credential: format!("tencent-token:{tenant_id}:{rtc_session_id}:{participant_id}"),
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
        query::query_provider_state(&self.config, self.open_api_executor.as_deref(), request)
    }

    fn export_recording_artifact(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        recording::export_recording_artifact(
            self.recording_importer.as_deref(),
            tenant_id,
            rtc_session_id,
        )
    }

    fn export_recording_artifacts_for_query<'a>(
        &'a self,
        request: RtcRecordingArtifactExportRequest,
    ) -> RtcRecordingArtifactsFuture<'a> {
        Box::pin(async move {
            Ok(recording::export_recording_artifact_for_query(
                self.recording_importer.as_deref(),
                request,
            )
            .await?
            .into_iter()
            .collect())
        })
    }

    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot {
        let mut details = BTreeMap::new();
        details.insert("providerKind".into(), "tencent".into());
        details.insert("accessEndpoint".into(), self.config.access_endpoint.clone());
        details.insert("region".into(), self.config.region.clone());
        details.insert(
            "credentialMode".into(),
            if self.config.sdk_app_id.is_some() && self.config.sdk_secret_key.is_some() {
                "signed-usersig"
            } else {
                "development-placeholder"
            }
            .into(),
        );
        details.insert(
            "activeQueryMode".into(),
            if self.open_api_executor.is_some()
                && self.config.secret_id.is_some()
                && self.config.secret_key.is_some()
            {
                "signed-open-api"
            } else {
                "unconfigured"
            }
            .into(),
        );
        details.insert(
            "recordingExportMode".into(),
            if self.recording_importer.is_some() {
                "drive-importer"
            } else {
                "unconfigured"
            }
            .into(),
        );
        let signed_credentials_configured =
            self.config.sdk_app_id.is_some() && self.config.sdk_secret_key.is_some();
        let signed_open_api_configured = self.open_api_executor.is_some()
            && self.config.secret_id.is_some()
            && self.config.secret_key.is_some();
        ProviderHealthSnapshot {
            plugin_id: TENCENT_RTC_PLUGIN_ID.into(),
            status: if signed_credentials_configured
                && signed_open_api_configured
                && self.recording_importer.is_some()
            {
                "healthy"
            } else {
                "degraded"
            }
            .into(),
            checked_at: utc_now_rfc3339_millis(),
            details,
        }
    }
}
