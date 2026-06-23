use std::collections::BTreeMap;
use std::sync::Arc;

use sdkwork_communication_rtc_service::{
    ProviderDomain, ProviderHealthSnapshot, ProviderPluginDescriptor,
    RTC_PROVIDER_REQUIRED_CAPABILITIES, RTC_PROVIDER_VOLCENGINE_OPTIONAL_CAPABILITIES,
    RtcActiveSessionTracker, RtcContractError, RtcCreateMediaSessionRequest,
    RtcParticipantCredential, RtcParticipantCredentialContext, RtcProviderPort,
    RtcProviderQueryRequest, RtcProviderQueryResult, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest, RtcRecordingArtifact,
    RtcRecordingArtifactExportRequest, RtcRecordingArtifactImportPort, RtcRecordingArtifactsFuture,
    RtcSessionHandle, utc_now_rfc3339_millis,
};

use crate::config::VolcengineRtcProviderConfig;
use crate::credential::{
    format_unix_seconds_rfc3339, generate_volcengine_rtc_token, issued_at_unix_seconds,
};
use crate::open_api::VolcengineRtcOpenApiExecutor;
use crate::{query, recording, webhook};

pub const VOLCENGINE_RTC_PLUGIN_ID: &str = "rtc-volcengine";

#[derive(Clone)]
pub struct VolcengineRtcProvider {
    config: VolcengineRtcProviderConfig,
    open_api_executor: Option<Arc<dyn VolcengineRtcOpenApiExecutor>>,
    recording_importer: Option<Arc<dyn RtcRecordingArtifactImportPort>>,
    active_sessions: RtcActiveSessionTracker,
}

impl Default for VolcengineRtcProvider {
    fn default() -> Self {
        Self::new(VolcengineRtcProviderConfig::default())
    }
}

impl VolcengineRtcProvider {
    pub fn new(config: VolcengineRtcProviderConfig) -> Self {
        Self {
            config,
            open_api_executor: None,
            recording_importer: None,
            active_sessions: RtcActiveSessionTracker::default(),
        }
    }

    pub fn with_open_api_executor(
        mut self,
        executor: Arc<dyn VolcengineRtcOpenApiExecutor>,
    ) -> Self {
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
            VOLCENGINE_RTC_PLUGIN_ID,
            ProviderDomain::Rtc,
            "volcengine",
            "Volcengine RTC",
        )
        .with_default_selected(true)
        .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
        .with_optional_capabilities(RTC_PROVIDER_VOLCENGINE_OPTIONAL_CAPABILITIES)
    }

    fn effective_config(
        &self,
        context: Option<&RtcParticipantCredentialContext>,
    ) -> VolcengineRtcProviderConfig {
        let Some(context) = context else {
            return self.config.clone();
        };
        VolcengineRtcProviderConfig {
            app_id: context.merge_app_id(&self.config.app_id),
            app_key: context.merge_signing_secret(&self.config.app_key),
            credential_ttl_seconds: context.merge_ttl(self.config.credential_ttl_seconds),
            ..self.config.clone()
        }
    }

    fn signing_configured(config: &VolcengineRtcProviderConfig) -> bool {
        config.app_id.is_some() && config.app_key.is_some()
    }
}

impl RtcProviderPort for VolcengineRtcProvider {
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
        self.active_sessions
            .open(request.tenant_id.as_str(), request.rtc_session_id.as_str());
        Ok(RtcSessionHandle {
            tenant_id: request.tenant_id,
            rtc_session_id: request.rtc_session_id.clone(),
            provider_session_id: format!("volcengine:{}", request.rtc_session_id),
            access_endpoint: Some(self.config.access_endpoint.clone()),
            region: Some(region),
        })
    }

    fn close_session(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<bool, RtcContractError> {
        Ok(self.active_sessions.close(tenant_id, rtc_session_id))
    }

    fn issue_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        let config = self.effective_config(context);
        if Self::signing_configured(&config) {
            let issued_at = issued_at_unix_seconds();
            let (credential, expire_at) =
                generate_volcengine_rtc_token(&config, rtc_session_id, participant_id, issued_at)?;
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
            credential: format!("volcengine-token:{tenant_id}:{rtc_session_id}:{participant_id}"),
            expires_at: utc_now_rfc3339_millis(),
        })
    }

    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
        context: Option<&RtcParticipantCredentialContext>,
    ) -> Result<RtcParticipantCredential, RtcContractError> {
        self.issue_participant_credential(tenant_id, rtc_session_id, participant_id, context)
    }

    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        webhook::parse_provider_webhook(request)
    }

    fn verify_provider_webhook_signature(
        &self,
        request: RtcProviderWebhookVerifyRequest,
    ) -> Result<(), RtcContractError> {
        webhook::verify_provider_webhook_signature(request)
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
        details.insert("providerKind".into(), "volcengine".into());
        details.insert("accessEndpoint".into(), self.config.access_endpoint.clone());
        details.insert("region".into(), self.config.region.clone());
        details.insert(
            "credentialMode".into(),
            if Self::signing_configured(&self.config) {
                "signed-token"
            } else {
                "development-placeholder"
            }
            .into(),
        );
        details.insert(
            "activeQueryMode".into(),
            if self.open_api_executor.is_some()
                && self.config.access_key_id.is_some()
                && self.config.secret_access_key.is_some()
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
        let signed_credentials_configured = Self::signing_configured(&self.config);
        let signed_open_api_configured = self.open_api_executor.is_some()
            && self.config.access_key_id.is_some()
            && self.config.secret_access_key.is_some();
        ProviderHealthSnapshot {
            plugin_id: VOLCENGINE_RTC_PLUGIN_ID.into(),
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
