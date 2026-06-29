use sdkwork_communication_rtc_service::{
    RtcContractError, RtcRecordingArtifact, RtcRecordingArtifactExportRequest,
    RtcRecordingArtifactImportFuture, RtcRecordingArtifactImportPort,
    export_recording_artifact_for_query_via_drive_importer,
    export_recording_artifact_via_drive_importer,
};

const PROVIDER: &str = "aliyun";

pub(crate) fn export_recording_artifact(
    importer: Option<&dyn RtcRecordingArtifactImportPort>,
    tenant_id: &str,
    rtc_session_id: &str,
) -> Result<Option<RtcRecordingArtifact>, RtcContractError> {
    export_recording_artifact_via_drive_importer(importer, PROVIDER, tenant_id, rtc_session_id)
}

pub(crate) fn export_recording_artifact_for_query<'a>(
    importer: Option<&'a dyn RtcRecordingArtifactImportPort>,
    request: RtcRecordingArtifactExportRequest,
) -> RtcRecordingArtifactImportFuture<'a> {
    export_recording_artifact_for_query_via_drive_importer(importer, PROVIDER, request)
}
