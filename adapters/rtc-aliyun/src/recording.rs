use sdkwork_rtc_core::{RtcContractError, RtcRecordingArtifact};

pub(crate) fn export_recording_artifact(
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
