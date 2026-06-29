use std::collections::BTreeMap;
use std::future::Future;
use std::pin::Pin;

use serde::{Deserialize, Serialize};
use serde_json::json;

use super::drive::RtcDriveReference;
use super::media::{RtcMediaKind, RtcMediaResource, RtcMediaSource};
use crate::constants::RTC_DRIVE_SPACE_TYPE;
use crate::error::RtcContractError;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcRecordingArtifactKind {
    Recording,
    Transcript,
    ScreenShare,
    Snapshot,
    Other,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcRecordingArtifactStatus {
    Pending,
    Processing,
    Ready,
    Failed,
    Deleted,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaArtifact {
    pub id: String,
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub owner_user_id: String,
    pub artifact_kind: RtcRecordingArtifactKind,
    pub artifact_status: RtcRecordingArtifactStatus,
    pub media_role: String,
    pub provider_profile_id: Option<String>,
    pub provider_artifact_id: Option<String>,
    pub drive: RtcDriveReference,
    pub resource: RtcMediaResource,
    pub resource_hash: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub failure_reason: Option<String>,
    pub source_provider_webhook_event_id: Option<String>,
    pub source_provider_query_job_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RtcMediaArtifactDescriptor {
    pub id: String,
    pub owner_user_id: String,
    pub artifact_kind: RtcRecordingArtifactKind,
    pub artifact_status: RtcRecordingArtifactStatus,
    pub media_role: String,
    pub started_at: String,
    pub ended_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaArtifactList {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub items: Vec<RtcMediaArtifact>,
}

impl RtcMediaArtifactList {
    pub fn new(
        tenant_id: impl Into<String>,
        rtc_session_id: impl Into<String>,
        items: Vec<RtcMediaArtifact>,
    ) -> Self {
        Self {
            tenant_id: tenant_id.into(),
            rtc_session_id: rtc_session_id.into(),
            items,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcRecordingArtifact {
    pub tenant_id: String,
    pub rtc_session_id: String,
    #[serde(rename = "drive")]
    pub drive: RtcDriveReference,
    #[serde(rename = "resource")]
    pub resource: RtcMediaResource,
    pub media_role: String,
}

impl RtcRecordingArtifact {
    pub fn drive_backed_recording(
        tenant_id: impl Into<String>,
        rtc_session_id: impl Into<String>,
        space_id: impl Into<String>,
        node_id: impl Into<String>,
        node_version: Option<String>,
    ) -> Self {
        let tenant_id = tenant_id.into();
        let rtc_session_id = rtc_session_id.into();
        let drive = RtcDriveReference::rtc(space_id, node_id, node_version);
        let drive_uri = drive.drive_uri.clone();
        let drive_space_id = drive.space_id.clone();
        let drive_node_id = drive.node_id.clone();
        let resource_id = drive_node_id.clone();
        let drive_node_version = drive.node_version.clone();
        let mut drive_metadata = BTreeMap::new();
        drive_metadata.insert("spaceId".to_string(), json!(drive_space_id));
        drive_metadata.insert("nodeId".to_string(), json!(drive_node_id));
        drive_metadata.insert("spaceType".to_string(), json!(RTC_DRIVE_SPACE_TYPE));
        drive_metadata.insert("nodeVersion".to_string(), json!(drive_node_version));
        let mut metadata = BTreeMap::new();
        metadata.insert("drive".to_string(), json!(drive_metadata));
        Self {
            tenant_id,
            rtc_session_id: rtc_session_id.clone(),
            drive,
            resource: RtcMediaResource {
                id: Some(resource_id),
                kind: RtcMediaKind::Video,
                source: RtcMediaSource::Drive,
                url: None,
                public_url: None,
                uri: Some(drive_uri),
                object_blob_id: None,
                file_name: Some(format!("{rtc_session_id}.mp4")),
                mime_type: Some("video/mp4".into()),
                size_bytes: None,
                checksum: None,
                width: None,
                height: None,
                duration_seconds: None,
                alt_text: None,
                title: None,
                poster: None,
                thumbnails: None,
                variants: None,
                access: None,
                ai: None,
                metadata: Some(metadata),
            },
            media_role: "rtc_recording".into(),
        }
    }

    pub fn into_media_artifact(self, descriptor: RtcMediaArtifactDescriptor) -> RtcMediaArtifact {
        RtcMediaArtifact {
            id: descriptor.id,
            tenant_id: self.tenant_id,
            rtc_session_id: self.rtc_session_id,
            owner_user_id: descriptor.owner_user_id,
            artifact_kind: descriptor.artifact_kind,
            artifact_status: descriptor.artifact_status,
            media_role: descriptor.media_role,
            provider_profile_id: None,
            provider_artifact_id: None,
            drive: self.drive,
            resource: self.resource,
            resource_hash: None,
            started_at: Some(descriptor.started_at),
            ended_at: Some(descriptor.ended_at),
            duration_ms: None,
            failure_reason: None,
            source_provider_webhook_event_id: None,
            source_provider_query_job_id: None,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcRecordingArtifactImportRequest {
    pub provider: String,
    pub tenant_id: String,
    #[serde(default)]
    pub organization_id: Option<String>,
    #[serde(default)]
    pub owner_user_id: Option<String>,
    pub rtc_session_id: String,
    pub provider_profile_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub recording_id: Option<String>,
    pub provider_snapshot_json: Option<String>,
}

impl RtcRecordingArtifactImportRequest {
    pub fn from_export(
        provider: impl Into<String>,
        request: RtcRecordingArtifactExportRequest,
    ) -> Self {
        Self {
            provider: provider.into(),
            tenant_id: request.tenant_id,
            organization_id: request.organization_id,
            owner_user_id: request.owner_user_id,
            rtc_session_id: request.rtc_session_id,
            provider_profile_id: request.provider_profile_id,
            provider_session_id: request.provider_session_id,
            recording_id: request.recording_id,
            provider_snapshot_json: request.provider_snapshot_json,
        }
    }
}

pub type RtcRecordingArtifactImportFuture<'a> = Pin<
    Box<dyn Future<Output = Result<Option<RtcRecordingArtifact>, RtcContractError>> + Send + 'a>,
>;

pub type RtcRecordingArtifactsFuture<'a> =
    Pin<Box<dyn Future<Output = Result<Vec<RtcRecordingArtifact>, RtcContractError>> + Send + 'a>>;

pub trait RtcRecordingArtifactImportPort: Send + Sync {
    fn import_recording_artifact(
        &self,
        request: RtcRecordingArtifactImportRequest,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError>;

    fn import_recording_artifacts(
        &self,
        request: RtcRecordingArtifactImportRequest,
    ) -> Result<Vec<RtcRecordingArtifact>, RtcContractError> {
        Ok(self
            .import_recording_artifact(request)?
            .into_iter()
            .collect())
    }

    fn import_recording_artifact_async<'a>(
        &'a self,
        request: RtcRecordingArtifactImportRequest,
    ) -> RtcRecordingArtifactImportFuture<'a> {
        Box::pin(async move { self.import_recording_artifact(request) })
    }

    fn import_recording_artifacts_async<'a>(
        &'a self,
        request: RtcRecordingArtifactImportRequest,
    ) -> RtcRecordingArtifactsFuture<'a> {
        Box::pin(async move { self.import_recording_artifacts(request) })
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcRecordingArtifactExportRequest {
    pub tenant_id: String,
    #[serde(default)]
    pub organization_id: Option<String>,
    #[serde(default)]
    pub owner_user_id: Option<String>,
    pub rtc_session_id: String,
    pub provider_profile_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub recording_id: Option<String>,
    pub provider_snapshot_json: Option<String>,
}
