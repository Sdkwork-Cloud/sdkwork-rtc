use crate::provider_webhook_parse::format_provider_session_id;
use crate::{
    RtcContractError, RtcRecordingArtifact, RtcRecordingArtifactExportRequest,
    RtcRecordingArtifactImportFuture, RtcRecordingArtifactImportPort,
    RtcRecordingArtifactImportRequest,
};

pub fn recording_export_unavailable_message(provider: &str) -> String {
    format!("{provider} recording export requires a configured Drive recording importer")
}

pub fn export_recording_artifact_via_drive_importer(
    importer: Option<&dyn RtcRecordingArtifactImportPort>,
    provider: &str,
    tenant_id: &str,
    rtc_session_id: &str,
) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
    let importer = importer.ok_or_else(|| {
        RtcContractError::Unavailable(recording_export_unavailable_message(provider))
    })?;
    importer.import_recording_artifact(RtcRecordingArtifactImportRequest {
        provider: provider.to_string(),
        tenant_id: tenant_id.to_string(),
        organization_id: None,
        owner_user_id: None,
        rtc_session_id: rtc_session_id.to_string(),
        provider_profile_id: None,
        provider_session_id: Some(format_provider_session_id(provider, rtc_session_id)),
        recording_id: None,
        provider_snapshot_json: None,
    })
}

pub fn export_recording_artifact_for_query_via_drive_importer<'a>(
    importer: Option<&'a dyn RtcRecordingArtifactImportPort>,
    provider: &'a str,
    request: RtcRecordingArtifactExportRequest,
) -> RtcRecordingArtifactImportFuture<'a> {
    Box::pin(async move {
        let importer = importer.ok_or_else(|| {
            RtcContractError::Unavailable(recording_export_unavailable_message(provider))
        })?;
        importer
            .import_recording_artifact_async(RtcRecordingArtifactImportRequest::from_export(
                provider, request,
            ))
            .await
    })
}
