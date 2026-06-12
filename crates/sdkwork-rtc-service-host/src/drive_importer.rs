use std::collections::BTreeMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use sdkwork_communication_rtc_service::{
    RtcContractError, RtcDriveReference, RtcMediaChecksum, RtcMediaChecksumAlgorithm, RtcMediaKind,
    RtcMediaMetadata, RtcMediaResource, RtcMediaSource, RtcRecordingArtifact,
    RtcRecordingArtifactImportFuture, RtcRecordingArtifactImportPort,
    RtcRecordingArtifactImportRequest,
};
use sdkwork_drive_storage_contract::DriveObjectStore;
use sdkwork_drive_workspace_service::DriveServiceError;
use sdkwork_drive_workspace_service::ports::uploader_store::DriveUploaderStore;
use sdkwork_drive_workspace_service::uploader::{
    DriveUploaderService, PrepareUploaderUploadCommand, UploadBytesCommand, UploaderActor,
    UploaderRetention, UploaderTarget,
};
use serde_json::json;

const RTC_APP_ID: &str = "sdkwork-rtc";
const RTC_RECORDING_RESOURCE_TYPE: &str = "rtc_recording";
const DEFAULT_CHUNK_SIZE_BYTES: i64 = 8 * 1024 * 1024;

pub type RtcRecordingArtifactContentFuture<'a> = Pin<
    Box<dyn Future<Output = Result<RtcRecordingArtifactContent, RtcContractError>> + Send + 'a>,
>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcRecordingArtifactContent {
    pub body: Vec<u8>,
    pub original_file_name: String,
    pub content_type: String,
    pub file_fingerprint: Option<String>,
    pub upload_profile_code: Option<String>,
    pub chunk_size_bytes: Option<i64>,
}

pub trait RtcRecordingArtifactContentProvider: Send + Sync {
    fn recording_artifact_content<'a>(
        &'a self,
        request: &'a RtcRecordingArtifactImportRequest,
    ) -> RtcRecordingArtifactContentFuture<'a>;
}

pub struct RtcDriveRecordingArtifactImporter<S, O, C>
where
    S: DriveUploaderStore,
    O: DriveObjectStore,
    C: RtcRecordingArtifactContentProvider,
{
    uploader: DriveUploaderService<S>,
    object_store: Arc<O>,
    content_provider: Arc<C>,
    fixed_epoch_ms: Option<i64>,
}

impl<S, O, C> RtcDriveRecordingArtifactImporter<S, O, C>
where
    S: DriveUploaderStore,
    O: DriveObjectStore,
    C: RtcRecordingArtifactContentProvider,
{
    pub fn new(
        uploader: DriveUploaderService<S>,
        object_store: Arc<O>,
        content_provider: Arc<C>,
    ) -> Self {
        Self {
            uploader,
            object_store,
            content_provider,
            fixed_epoch_ms: None,
        }
    }

    pub fn with_fixed_epoch_ms(mut self, epoch_ms: i64) -> Self {
        self.fixed_epoch_ms = Some(epoch_ms);
        self
    }

    async fn import_with_drive(
        &self,
        request: RtcRecordingArtifactImportRequest,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        let content = self
            .content_provider
            .recording_artifact_content(&request)
            .await?;
        let original_file_name = content.original_file_name.clone();
        let content_type = content.content_type.clone();
        let content_length = content.body.len() as i64;
        let upload_profile_code = content
            .upload_profile_code
            .clone()
            .unwrap_or_else(|| "video".to_string());
        let file_fingerprint = content
            .file_fingerprint
            .clone()
            .unwrap_or_else(|| recording_upload_id(&request));
        let chunk_size_bytes = content.chunk_size_bytes.unwrap_or(DEFAULT_CHUNK_SIZE_BYTES);
        let now_epoch_ms = self.fixed_epoch_ms.unwrap_or_else(current_epoch_ms);
        let upload_id = recording_upload_id(&request);
        let task_id = truncate_identifier(format!("task-{upload_id}"));
        let operator_id = request
            .owner_user_id
            .clone()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| RTC_APP_ID.to_string());
        let actor = match request.owner_user_id.clone() {
            Some(user_id) if !user_id.trim().is_empty() => UploaderActor::User { user_id },
            _ => UploaderActor::System {
                operator_id: operator_id.clone(),
            },
        };
        let completed = self
            .uploader
            .upload_bytes(
                self.object_store.as_ref(),
                UploadBytesCommand {
                    prepare: PrepareUploaderUploadCommand {
                        id: upload_id.clone(),
                        task_id,
                        tenant_id: request.tenant_id.clone(),
                        organization_id: request.organization_id.clone(),
                        actor,
                        app_id: RTC_APP_ID.to_string(),
                        app_resource_type: RTC_RECORDING_RESOURCE_TYPE.to_string(),
                        app_resource_id: request.rtc_session_id.clone(),
                        scene: Some("rtc".to_string()),
                        source: Some(format!("provider_{}", safe_identifier(&request.provider))),
                        upload_profile_code,
                        file_fingerprint,
                        original_file_name: original_file_name.clone(),
                        content_type: content_type.clone(),
                        content_length,
                        chunk_size_bytes,
                        target: UploaderTarget::AutoUploadSpace {
                            parent_node_id: None,
                        },
                        retention: UploaderRetention::LongTerm,
                        operator_id,
                        now_epoch_ms,
                    },
                    body: content.body,
                    uploaded_at_epoch_ms: now_epoch_ms.saturating_add(1_000),
                },
            )
            .await
            .map_err(rtc_contract_error_from_drive)?;

        Ok(Some(recording_artifact_from_completed_upload(
            &request,
            original_file_name.as_str(),
            content_type.as_str(),
            &completed.space_id,
            &completed.node_id,
            completed.checksum_sha256_hex.as_deref(),
            completed.content_length,
            completed.id.as_str(),
        )))
    }
}

impl<S, O, C> RtcRecordingArtifactImportPort for RtcDriveRecordingArtifactImporter<S, O, C>
where
    S: DriveUploaderStore + 'static,
    O: DriveObjectStore + 'static,
    C: RtcRecordingArtifactContentProvider + 'static,
{
    fn import_recording_artifact(
        &self,
        _request: RtcRecordingArtifactImportRequest,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
        Err(RtcContractError::Unavailable(
            "Drive recording importer requires the async import boundary".to_string(),
        ))
    }

    fn import_recording_artifact_async<'a>(
        &'a self,
        request: RtcRecordingArtifactImportRequest,
    ) -> RtcRecordingArtifactImportFuture<'a> {
        Box::pin(async move { self.import_with_drive(request).await })
    }
}

fn recording_artifact_from_completed_upload(
    request: &RtcRecordingArtifactImportRequest,
    original_file_name: &str,
    content_type: &str,
    space_id: &str,
    node_id: &str,
    checksum_sha256: Option<&str>,
    content_length: i64,
    upload_item_id: &str,
) -> RtcRecordingArtifact {
    let drive = RtcDriveReference::rtc(space_id, node_id, Some("1".to_string()));
    let checksum_value = checksum_sha256.map(strip_sha256_prefix).map(str::to_string);
    let mut drive_metadata = BTreeMap::new();
    drive_metadata.insert("spaceId".to_string(), json!(drive.space_id));
    drive_metadata.insert("nodeId".to_string(), json!(drive.node_id));
    drive_metadata.insert("spaceType".to_string(), json!(drive.space_type.as_str()));
    drive_metadata.insert("nodeVersion".to_string(), json!(drive.node_version));
    drive_metadata.insert("uploadItemId".to_string(), json!(upload_item_id));

    let mut provider_metadata = BTreeMap::new();
    provider_metadata.insert("provider".to_string(), json!(request.provider));
    provider_metadata.insert(
        "providerProfileId".to_string(),
        json!(request.provider_profile_id),
    );
    provider_metadata.insert(
        "providerSessionId".to_string(),
        json!(request.provider_session_id),
    );
    provider_metadata.insert("recordingId".to_string(), json!(request.recording_id));

    let mut metadata = RtcMediaMetadata::new();
    metadata.insert("drive".to_string(), json!(drive_metadata));
    metadata.insert("provider".to_string(), json!(provider_metadata));

    RtcRecordingArtifact {
        tenant_id: request.tenant_id.clone(),
        rtc_session_id: request.rtc_session_id.clone(),
        resource: RtcMediaResource {
            id: Some(drive.node_id.clone()),
            kind: RtcMediaKind::Video,
            source: RtcMediaSource::Drive,
            url: None,
            public_url: None,
            uri: Some(drive.drive_uri.clone()),
            object_blob_id: None,
            file_name: Some(original_file_name.to_string()),
            mime_type: Some(content_type.to_string()),
            size_bytes: Some(content_length.max(0).to_string()),
            checksum: checksum_value.map(|value| RtcMediaChecksum {
                algorithm: RtcMediaChecksumAlgorithm::Sha256,
                value,
            }),
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
        drive,
        media_role: "rtc_recording".to_string(),
    }
}

fn recording_upload_id(request: &RtcRecordingArtifactImportRequest) -> String {
    let artifact_id = request
        .recording_id
        .as_deref()
        .or(request.provider_session_id.as_deref())
        .unwrap_or(request.provider.as_str());
    truncate_identifier(format!(
        "rtc-recording-{}-{}-{}",
        safe_identifier(request.tenant_id.as_str()),
        safe_identifier(request.rtc_session_id.as_str()),
        safe_identifier(artifact_id),
    ))
}

fn safe_identifier(value: &str) -> String {
    let normalized = value
        .trim()
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '.' | '_' | '@' | '-') {
                ch.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>();
    let normalized = normalized.trim_matches('-');
    if normalized.is_empty() {
        "unknown".to_string()
    } else {
        normalized.chars().take(80).collect()
    }
}

fn truncate_identifier(value: String) -> String {
    if value.len() <= 255 {
        return value;
    }
    let mut boundary = 255;
    while !value.is_char_boundary(boundary) {
        boundary -= 1;
    }
    value[..boundary].to_string()
}

fn current_epoch_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis().min(i64::MAX as u128) as i64)
        .unwrap_or(1)
}

fn strip_sha256_prefix(value: &str) -> &str {
    value.strip_prefix("sha256:").unwrap_or(value)
}

fn rtc_contract_error_from_drive(error: DriveServiceError) -> RtcContractError {
    match error {
        DriveServiceError::Validation(message) | DriveServiceError::Conflict(message) => {
            RtcContractError::Conflict(format!("Drive recording import failed: {message}"))
        }
        DriveServiceError::NotFound(message)
        | DriveServiceError::PermissionDenied(message)
        | DriveServiceError::Internal(message) => {
            RtcContractError::Unavailable(format!("Drive recording import unavailable: {message}"))
        }
    }
}
