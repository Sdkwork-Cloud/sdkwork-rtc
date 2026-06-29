use super::recording::RtcMediaArtifact;
use crate::error::RtcContractError;

/// Purges Drive-backed bytes for a soft-deleted artifact. RTC metadata remains until a later compaction job.
pub trait RtcRecordingArtifactHardDeletePort: Send + Sync {
    fn hard_delete_recording_artifact(
        &self,
        artifact: &RtcMediaArtifact,
    ) -> Result<(), RtcContractError>;
}

#[derive(Clone, Debug, Default)]
pub struct NoopRtcRecordingArtifactHardDeletePort;

impl RtcRecordingArtifactHardDeletePort for NoopRtcRecordingArtifactHardDeletePort {
    fn hard_delete_recording_artifact(
        &self,
        _artifact: &RtcMediaArtifact,
    ) -> Result<(), RtcContractError> {
        Err(RtcContractError::Unavailable(
            "recording artifact hard delete port is not configured".into(),
        ))
    }
}
