use std::collections::BTreeMap;
use std::sync::Arc;

use sdkwork_communication_rtc_service::{
    ProviderDomain, ProviderHealthSnapshot, ProviderPluginDescriptor,
    RTC_PROVIDER_ALIYUN_OPTIONAL_CAPABILITIES, RTC_PROVIDER_REQUIRED_CAPABILITIES,
    RtcContractError, RtcCreateMediaSessionRequest, RtcParticipantCredential, RtcProviderPort,
    RtcProviderQueryRequest, RtcProviderQueryResult, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcRecordingArtifact, RtcRecordingArtifactExportRequest,
    RtcRecordingArtifactImportPort, RtcRecordingArtifactsFuture, RtcSessionHandle,
    utc_now_rfc3339_millis,
};

use crate::config::AliyunRtcProviderConfig;
use crate::open_api::AliyunRtcOpenApiExecutor;
use crate::{query, recording, webhook};

pub const ALIYUN_RTC_PLUGIN_ID: &str = "rtc-aliyun";

#[derive(Clone, Default)]
pub struct AliyunRtcProvider {
    config: AliyunRtcProviderConfig,
    open_api_executor: Option<Arc<dyn AliyunRtcOpenApiExecutor>>,
    recording_importer: Option<Arc<dyn RtcRecordingArtifactImportPort>>,
}

impl AliyunRtcProvider {
    pub fn new(config: AliyunRtcProviderConfig) -> Self {
        Self {
            config,
            open_api_executor: None,
            recording_importer: None,
        }
    }

    pub fn with_open_api_executor(mut self, executor: Arc<dyn AliyunRtcOpenApiExecutor>) -> Self {
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
            ALIYUN_RTC_PLUGIN_ID,
            ProviderDomain::Rtc,
            "aliyun",
            "Aliyun RTC",
        )
        .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
        .with_optional_capabilities(RTC_PROVIDER_ALIYUN_OPTIONAL_CAPABILITIES)
    }
}

impl RtcProviderPort for AliyunRtcProvider {
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
            provider_session_id: format!("aliyun:{}", request.rtc_session_id),
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
            credential: format!("aliyun-token:{tenant_id}:{rtc_session_id}:{participant_id}"),
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
        details.insert("providerKind".into(), "aliyun".into());
        details.insert("accessEndpoint".into(), self.config.access_endpoint.clone());
        details.insert("region".into(), self.config.region.clone());
        details.insert(
            "activeQueryMode".into(),
            if self.open_api_executor.is_some() {
                "open-api-executor"
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
        ProviderHealthSnapshot {
            plugin_id: ALIYUN_RTC_PLUGIN_ID.into(),
            status: if self.open_api_executor.is_some() && self.recording_importer.is_some() {
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
