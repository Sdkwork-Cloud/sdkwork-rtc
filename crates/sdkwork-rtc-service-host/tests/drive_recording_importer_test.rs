use std::{path::PathBuf, sync::Arc, time::SystemTime};

use sdkwork_communication_rtc_service::{
    RtcMediaSource, RtcRecordingArtifactImportPort, RtcRecordingArtifactImportRequest,
};
use sdkwork_drive_config::DatabaseEngine;
use sdkwork_drive_storage_contract::{DriveObjectLocator, DriveObjectStore, HeadObjectRequest};
use sdkwork_drive_storage_local::LocalDriveObjectStore;
use sdkwork_drive_workspace_service::infrastructure::sql::install_any_schema;
use sdkwork_drive_workspace_service::infrastructure::sql::uploader_store::SqlUploaderStore;
use sdkwork_drive_workspace_service::uploader::DriveUploaderService;
use sdkwork_rtc_service_host::drive_importer::{
    RtcDriveRecordingArtifactImporter, RtcRecordingArtifactContent,
    RtcRecordingArtifactContentFuture, RtcRecordingArtifactContentProvider,
};
use sqlx::any::AnyPoolOptions;

#[tokio::test]
async fn drive_recording_importer_uploads_provider_bytes_through_drive_uploader() {
    let pool = create_drive_pool().await;
    let object_store = Arc::new(LocalDriveObjectStore::new(unique_temp_storage_root(
        "rtc-drive-recording-importer",
    )));
    let importer = RtcDriveRecordingArtifactImporter::new(
        DriveUploaderService::new(SqlUploaderStore::new(pool.clone())),
        object_store.clone(),
        Arc::new(StaticRecordingContentProvider),
    )
    .with_fixed_epoch_ms(1_800_000_000_000);

    let artifact = importer
        .import_recording_artifact_async(RtcRecordingArtifactImportRequest {
            provider: "agora".to_string(),
            tenant_id: "tenant-rtc-drive".to_string(),
            organization_id: Some("org-rtc-drive".to_string()),
            owner_user_id: Some("user-rtc-drive".to_string()),
            rtc_session_id: "rtc-session-drive".to_string(),
            provider_profile_id: Some("profile-agora-default".to_string()),
            provider_session_id: Some("agora:rtc-session-drive".to_string()),
            recording_id: Some("recording-drive-001".to_string()),
            provider_snapshot_json: Some(
                serde_json::json!({ "recordingId": "recording-drive-001" }).to_string(),
            ),
        })
        .await
        .expect("Drive importer should complete")
        .expect("recording artifact should be imported");

    assert_eq!(artifact.tenant_id, "tenant-rtc-drive");
    assert_eq!(artifact.rtc_session_id, "rtc-session-drive");
    assert!(artifact.drive.is_canonical());
    assert_eq!(artifact.resource.source, RtcMediaSource::Drive);
    assert_eq!(
        artifact.resource.uri.as_deref(),
        Some(artifact.drive.drive_uri.as_str())
    );
    assert_eq!(
        artifact.resource.file_name.as_deref(),
        Some("recording-drive-001.mp4")
    );
    assert_eq!(artifact.resource.mime_type.as_deref(), Some("video/mp4"));
    assert_eq!(artifact.resource.size_bytes.as_deref(), Some("26"));
    assert_eq!(
        artifact
            .resource
            .checksum
            .as_ref()
            .map(|checksum| checksum.value.as_str()),
        Some("087f089a60e9963d81035b60b1ce410ee8052f5851d719d3b48c9d9f10527b01")
    );
    let artifact_json = serde_json::to_string(&artifact).expect("artifact should serialize");
    assert!(!artifact_json.contains("bucket-uploader"));
    assert!(!artifact_json.contains("object_key"));
    assert!(!artifact_json.contains("sdkwork-drive/uploader"));

    let stored_upload: (String, String, String, String, String, String) = sqlx::query_as(
        "SELECT id, space_id, node_id, object_bucket, object_key, status
         FROM (
            SELECT ui.id, ui.tenant_id, ui.app_resource_id, ui.space_id, ui.node_id,
                   us.bucket AS object_bucket, us.object_key, ui.status
            FROM dr_drive_upload_item ui
            INNER JOIN dr_drive_upload_session us
               ON us.tenant_id = ui.tenant_id
              AND us.id = ui.upload_session_id
         ) joined_upload
         WHERE tenant_id=?1 AND app_resource_id=?2",
    )
    .bind("tenant-rtc-drive")
    .bind("rtc-session-drive")
    .fetch_one(&pool)
    .await
    .expect("Drive upload item should be persisted");
    assert_eq!(
        stored_upload.0,
        "rtc-recording-tenant-rtc-drive-rtc-session-drive-recording-drive-001"
    );
    assert_eq!(stored_upload.1, artifact.drive.space_id);
    assert_eq!(stored_upload.2, artifact.drive.node_id);
    assert_eq!(stored_upload.5, "completed");

    let stored_space_type: String = sqlx::query_scalar(
        "SELECT space_type
         FROM dr_drive_space
         WHERE tenant_id=?1 AND id=?2",
    )
    .bind("tenant-rtc-drive")
    .bind(&stored_upload.1)
    .fetch_one(&pool)
    .await
    .expect("Drive space should be persisted");
    assert_eq!(stored_space_type, "rtc");

    let head = object_store
        .head_object(HeadObjectRequest {
            locator: DriveObjectLocator {
                bucket: stored_upload.3,
                object_key: stored_upload.4,
            },
        })
        .await
        .expect("uploaded object should be readable through Drive object store");
    assert_eq!(head.content_length, 26);
    assert_eq!(head.content_type.as_deref(), Some("video/mp4"));
}

struct StaticRecordingContentProvider;

impl RtcRecordingArtifactContentProvider for StaticRecordingContentProvider {
    fn recording_artifact_content<'a>(
        &'a self,
        _request: &'a RtcRecordingArtifactImportRequest,
    ) -> RtcRecordingArtifactContentFuture<'a> {
        Box::pin(async {
            Ok(RtcRecordingArtifactContent {
                body: b"sdkwork rtc recording data".to_vec(),
                original_file_name: "recording-drive-001.mp4".to_string(),
                content_type: "video/mp4".to_string(),
                file_fingerprint: Some(
                    "sha256:087f089a60e9963d81035b60b1ce410ee8052f5851d719d3b48c9d9f10527b01"
                        .to_string(),
                ),
                upload_profile_code: Some("video".to_string()),
                chunk_size_bytes: Some(8 * 1024 * 1024),
            })
        })
    }
}

async fn create_drive_pool() -> sqlx::AnyPool {
    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory pool should be created");
    install_any_schema(&pool, DatabaseEngine::Sqlite)
        .await
        .expect("sqlite schema should be installed");
    seed_storage_provider(&pool).await;
    pool
}

async fn seed_storage_provider(pool: &sqlx::AnyPool) {
    sqlx::query(
        "INSERT INTO dr_drive_storage_provider (
            id, provider_kind, name, endpoint_url, region, bucket, path_style,
            strict_tls, credential_ref, server_side_encryption_mode,
            default_storage_class, status, version, created_by, updated_by
        ) VALUES (
            'provider-uploader', 's3_compatible', 'Uploader Provider',
            'https://s3.example.com', 'us-east-1', 'bucket-uploader', 1,
            1, 'plain:test-access-key:test-secret-key', 'AES256',
            'STANDARD', 'active', 1, 'test', 'test'
        )",
    )
    .execute(pool)
    .await
    .expect("seed storage provider should succeed");
}

fn unique_temp_storage_root(name: &str) -> PathBuf {
    let suffix = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .expect("system time should be after unix epoch")
        .as_nanos();
    std::env::temp_dir().join(format!("{name}-{suffix}"))
}
