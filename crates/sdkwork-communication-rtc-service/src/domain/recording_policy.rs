use serde::{Deserialize, Serialize};

use super::recording::{RtcMediaArtifact, RtcRecordingArtifactStatus};
use crate::time::rfc3339_age_ms;

pub const PLATFORM_DEFAULT_RECORDING_POLICY_JSON: &str =
    include_str!("../../../../specs/recording-policy/platform-default.json");

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcRecordingPolicyManifest {
    pub schema_version: String,
    pub interface_version: String,
    pub default_policy: RtcRecordingPolicySettings,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcRecordingPolicySettings {
    pub ready_retention_days: u32,
    pub soft_delete_after_days: u32,
    pub hard_delete_after_days: u32,
    pub reconcile_batch_size: u32,
}

impl RtcRecordingPolicySettings {
    pub fn validate(&self) -> Result<(), String> {
        if self.soft_delete_after_days < self.ready_retention_days {
            return Err(format!(
                "softDeleteAfterDays ({}) must be >= readyRetentionDays ({})",
                self.soft_delete_after_days, self.ready_retention_days
            ));
        }
        if self.hard_delete_after_days < self.soft_delete_after_days {
            return Err(format!(
                "hardDeleteAfterDays ({}) must be >= softDeleteAfterDays ({})",
                self.hard_delete_after_days, self.soft_delete_after_days
            ));
        }
        if self.reconcile_batch_size == 0 {
            return Err("reconcileBatchSize must be greater than zero".into());
        }
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RtcRecordingLifecycleAction {
    Retain,
    SoftDelete,
    HardDelete,
}

pub fn platform_default_recording_policy_settings() -> RtcRecordingPolicySettings {
    platform_default_recording_policy_manifest().default_policy
}

pub fn platform_default_recording_policy_manifest() -> RtcRecordingPolicyManifest {
    load_recording_policy_manifest(PLATFORM_DEFAULT_RECORDING_POLICY_JSON)
        .expect("platform-default recording policy manifest must be valid")
}

pub fn load_recording_policy_manifest(json: &str) -> Result<RtcRecordingPolicyManifest, String> {
    let manifest: RtcRecordingPolicyManifest = serde_json::from_str(json)
        .map_err(|error| format!("invalid recording policy json: {error}"))?;
    manifest.default_policy.validate()?;
    Ok(manifest)
}

pub fn load_recording_policy_settings_from_env() -> Result<RtcRecordingPolicySettings, String> {
    if let Ok(path) = std::env::var("SDKWORK_RTC_RECORDING_POLICY_PATH") {
        let json = std::fs::read_to_string(path.as_str()).map_err(|error| {
            format!("failed to read SDKWORK_RTC_RECORDING_POLICY_PATH: {error}")
        })?;
        return Ok(load_recording_policy_manifest(json.as_str())?.default_policy);
    }
    Ok(platform_default_recording_policy_settings())
}

pub fn recording_lifecycle_cutoff_rfc3339(days: u32) -> String {
    let cutoff_ms = sdkwork_utils_rust::now().timestamp_millis()
        - i64::from(days) * 86_400_000;
    let cutoff = sdkwork_utils_rust::from_unix_millis(cutoff_ms)
        .expect("recording lifecycle cutoff must fit chrono range");
    sdkwork_utils_rust::format_datetime(cutoff, None)
}

pub fn artifact_reference_timestamp(artifact: &RtcMediaArtifact) -> Option<&str> {
    artifact
        .ended_at
        .as_deref()
        .or(artifact.started_at.as_deref())
}

pub fn artifact_age_days(artifact: &RtcMediaArtifact) -> Option<u32> {
    let reference = artifact_reference_timestamp(artifact)?;
    let age_ms = rfc3339_age_ms(reference)?;
    Some((age_ms / 86_400_000) as u32)
}

pub fn evaluate_recording_lifecycle_action(
    policy: &RtcRecordingPolicySettings,
    artifact: &RtcMediaArtifact,
) -> RtcRecordingLifecycleAction {
    let Some(age_days) = artifact_age_days(artifact) else {
        return RtcRecordingLifecycleAction::Retain;
    };

    match artifact.artifact_status {
        RtcRecordingArtifactStatus::Deleted => {
            if age_days >= policy.hard_delete_after_days {
                RtcRecordingLifecycleAction::HardDelete
            } else {
                RtcRecordingLifecycleAction::Retain
            }
        }
        RtcRecordingArtifactStatus::Ready | RtcRecordingArtifactStatus::Failed => {
            if age_days >= policy.soft_delete_after_days {
                RtcRecordingLifecycleAction::SoftDelete
            } else {
                RtcRecordingLifecycleAction::Retain
            }
        }
        RtcRecordingArtifactStatus::Pending | RtcRecordingArtifactStatus::Processing => {
            RtcRecordingLifecycleAction::Retain
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::recording::{
        RtcMediaArtifactDescriptor, RtcRecordingArtifact, RtcRecordingArtifactKind,
    };

    fn sample_artifact(status: RtcRecordingArtifactStatus, ended_at: &str) -> RtcMediaArtifact {
        RtcRecordingArtifact::drive_backed_recording("100001", "session-1", "space-1", "node-1", Some("1".into()))
            .into_media_artifact(RtcMediaArtifactDescriptor {
                id: "artifact-1".into(),
                owner_user_id: "200001".into(),
                artifact_kind: RtcRecordingArtifactKind::Recording,
                artifact_status: status,
                media_role: "mixed".into(),
                started_at: ended_at.into(),
                ended_at: ended_at.into(),
            })
    }

    #[test]
    fn platform_default_manifest_is_valid() {
        let manifest = platform_default_recording_policy_manifest();
        assert_eq!(manifest.interface_version, "recording-policy/v1");
        manifest
            .default_policy
            .validate()
            .expect("policy must validate");
    }

    #[test]
    fn soft_delete_applies_to_old_ready_artifacts() {
        let policy = RtcRecordingPolicySettings {
            ready_retention_days: 30,
            soft_delete_after_days: 40,
            hard_delete_after_days: 50,
            reconcile_batch_size: 100,
        };
        let artifact = sample_artifact(
            RtcRecordingArtifactStatus::Ready,
            "2020-01-01T00:00:00.000Z",
        );
        assert_eq!(
            evaluate_recording_lifecycle_action(&policy, &artifact),
            RtcRecordingLifecycleAction::SoftDelete
        );
    }

    #[test]
    fn hard_delete_applies_to_old_deleted_artifacts() {
        let policy = RtcRecordingPolicySettings {
            ready_retention_days: 30,
            soft_delete_after_days: 40,
            hard_delete_after_days: 50,
            reconcile_batch_size: 100,
        };
        let artifact = sample_artifact(
            RtcRecordingArtifactStatus::Deleted,
            "2020-01-01T00:00:00.000Z",
        );
        assert_eq!(
            evaluate_recording_lifecycle_action(&policy, &artifact),
            RtcRecordingLifecycleAction::HardDelete
        );
    }
}
