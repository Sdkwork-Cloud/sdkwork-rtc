use sdkwork_communication_rtc_service::{
    RtcContractError, RtcRecordingArtifact, RtcRecordingArtifactExportRequest,
    RtcRecordingArtifactImportFuture, RtcRecordingArtifactImportPort,
    RtcRecordingArtifactImportRequest,
};

const PROVIDER: &str = "aliyun";
const UNAVAILABLE_MESSAGE: &str =
    "aliyun recording export requires a configured Drive recording importer";

pub(crate) fn export_recording_artifact(
    importer: Option<&dyn RtcRecordingArtifactImportPort>,
    tenant_id: &str,
    rtc_session_id: &str,
) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
    let importer =
        importer.ok_or_else(|| RtcContractError::Unavailable(UNAVAILABLE_MESSAGE.to_string()))?;
    importer.import_recording_artifact(RtcRecordingArtifactImportRequest {
        provider: PROVIDER.to_string(),
        tenant_id: tenant_id.to_string(),
        organization_id: None,
        owner_user_id: None,
        rtc_session_id: rtc_session_id.to_string(),
        provider_profile_id: None,
        provider_session_id: Some(format!("{PROVIDER}:{rtc_session_id}")),
        recording_id: None,
        provider_snapshot_json: None,
    })
}

pub(crate) fn export_recording_artifact_for_query<'a>(
    importer: Option<&'a dyn RtcRecordingArtifactImportPort>,
    request: RtcRecordingArtifactExportRequest,
) -> RtcRecordingArtifactImportFuture<'a> {
    Box::pin(async move {
        let importer = importer
            .ok_or_else(|| RtcContractError::Unavailable(UNAVAILABLE_MESSAGE.to_string()))?;
        importer
            .import_recording_artifact_async(RtcRecordingArtifactImportRequest::from_export(
                PROVIDER, request,
            ))
            .await
    })
}
