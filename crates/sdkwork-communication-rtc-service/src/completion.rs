use serde::{Deserialize, Serialize};
use serde_json::{Value as JsonValue, json};

use crate::{
    RtcDriveSpaceType, RtcMediaArtifact, RtcMediaSession, RtcMediaSessionMode,
    RtcMediaSessionStatus, RtcParticipantRole, RtcParticipantState, rtc_provider_payload_hash,
};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaSessionEndSource {
    ManualClose,
    ProviderWebhook,
    ActiveProviderQuery,
    ProviderStateSync,
    Timeout,
    SystemReconcile,
    Unknown,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaTrackKind {
    Audio,
    Video,
    ScreenShare,
    Data,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaTrackSource {
    Microphone,
    Camera,
    Screen,
    System,
    Custom,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaTrackStatus {
    Publishing,
    Muted,
    Stopped,
    Failed,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaTrack {
    pub id: String,
    pub session_id: String,
    pub participant_id: String,
    pub track_kind: RtcMediaTrackKind,
    pub track_source: RtcMediaTrackSource,
    pub provider_track_id: Option<String>,
    pub status: RtcMediaTrackStatus,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub muted_duration_ms: Option<u64>,
    pub end_reason: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcQualitySample {
    pub id: String,
    pub session_id: String,
    pub participant_id: Option<String>,
    pub latency_ms: Option<u32>,
    pub packet_loss_rate: Option<String>,
    pub jitter_ms: Option<u32>,
    pub bitrate_kbps: Option<u32>,
    pub sampled_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionCompletionQualitySummary {
    pub sample_count: u32,
    pub participant_sample_count: u32,
    pub avg_latency_ms: Option<u32>,
    pub max_latency_ms: Option<u32>,
    pub avg_jitter_ms: Option<u32>,
    pub max_jitter_ms: Option<u32>,
    pub max_packet_loss_rate: Option<String>,
    pub min_bitrate_kbps: Option<u32>,
    pub avg_bitrate_kbps: Option<u32>,
    pub first_sampled_at: Option<String>,
    pub last_sampled_at: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionCompletionRecordingSummary {
    pub artifact_count: u32,
    pub recording_artifact_count: u32,
    pub ready_artifact_count: u32,
    pub failed_artifact_count: u32,
    pub processing_artifact_count: u32,
    pub total_duration_ms: Option<u64>,
    pub drive_resource_count: u32,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionCompletionParticipantSummary {
    pub participant_id: String,
    pub user_id: String,
    pub display_name: String,
    pub role: RtcParticipantRole,
    pub state: RtcParticipantState,
    pub joined_at: Option<String>,
    pub left_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub leave_reason: Option<String>,
    pub provider_participant_id: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionCompletionTrackSummary {
    pub track_id: String,
    pub participant_id: String,
    pub track_kind: RtcMediaTrackKind,
    pub track_source: RtcMediaTrackSource,
    pub status: RtcMediaTrackStatus,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub muted_duration_ms: Option<u64>,
    pub end_reason: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionCompletionArtifactSummary {
    pub artifact_id: String,
    pub artifact_kind: String,
    pub artifact_status: String,
    pub media_role: String,
    pub drive_uri: String,
    pub drive_space_id: String,
    pub drive_space_type: RtcDriveSpaceType,
    pub drive_node_id: String,
    pub drive_node_version: Option<String>,
    pub provider_artifact_id: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub failure_reason: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcMediaSessionCompletionInput {
    pub session: RtcMediaSession,
    pub tracks: Vec<RtcMediaTrack>,
    pub artifacts: Vec<RtcMediaArtifact>,
    pub quality_samples: Vec<RtcQualitySample>,
    pub source_webhook_event_id: Option<String>,
    pub source_provider_query_job_id: Option<String>,
    pub recorded_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionCompletionRecord {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub media_session_id: String,
    pub room_id: String,
    pub owner_user_id: String,
    pub provider_profile_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub media_mode: RtcMediaSessionMode,
    pub session_status: RtcMediaSessionStatus,
    pub started_at: Option<String>,
    pub connected_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub end_reason: Option<String>,
    pub end_source: Option<RtcMediaSessionEndSource>,
    pub participant_count: u32,
    pub max_concurrent_participants: u32,
    pub quality_summary: RtcMediaSessionCompletionQualitySummary,
    pub recording_summary: RtcMediaSessionCompletionRecordingSummary,
    pub participants: Vec<RtcMediaSessionCompletionParticipantSummary>,
    pub tracks: Vec<RtcMediaSessionCompletionTrackSummary>,
    pub artifacts: Vec<RtcMediaSessionCompletionArtifactSummary>,
    pub source_webhook_event_id: Option<String>,
    pub source_provider_query_job_id: Option<String>,
    pub completion_snapshot: JsonValue,
    pub completion_snapshot_hash: String,
    pub recorded_at: String,
}

impl RtcMediaSessionCompletionRecord {
    pub fn from_input(input: RtcMediaSessionCompletionInput) -> Self {
        let session = input.session;
        let participant_count = if session.participant_count == 0 {
            session.participants.len() as u32
        } else {
            session.participant_count
        };
        let max_concurrent_participants =
            session.max_concurrent_participants.max(participant_count);
        let quality_summary = session
            .quality_summary
            .clone()
            .unwrap_or_else(|| summarize_quality_samples(&input.quality_samples));
        let recording_summary = session
            .recording_summary
            .clone()
            .unwrap_or_else(|| summarize_recording_artifacts(&input.artifacts));
        let participants = session
            .participants
            .iter()
            .map(|participant| RtcMediaSessionCompletionParticipantSummary {
                participant_id: participant.id.clone(),
                user_id: participant.user_id.clone(),
                display_name: participant.display_name.clone(),
                role: participant.role.clone(),
                state: participant.state.clone(),
                joined_at: participant.joined_at.clone(),
                left_at: participant.left_at.clone(),
                duration_ms: participant.duration_ms,
                leave_reason: participant.leave_reason.clone(),
                provider_participant_id: participant.provider_participant_id.clone(),
            })
            .collect::<Vec<_>>();
        let tracks = input
            .tracks
            .iter()
            .map(|track| RtcMediaSessionCompletionTrackSummary {
                track_id: track.id.clone(),
                participant_id: track.participant_id.clone(),
                track_kind: track.track_kind.clone(),
                track_source: track.track_source.clone(),
                status: track.status.clone(),
                started_at: track.started_at.clone(),
                ended_at: track.ended_at.clone(),
                duration_ms: track.duration_ms,
                muted_duration_ms: track.muted_duration_ms,
                end_reason: track.end_reason.clone(),
            })
            .collect::<Vec<_>>();
        let artifacts = input
            .artifacts
            .iter()
            .map(|artifact| RtcMediaSessionCompletionArtifactSummary {
                artifact_id: artifact.id.clone(),
                artifact_kind: format!("{:?}", artifact.artifact_kind).to_lowercase(),
                artifact_status: format!("{:?}", artifact.artifact_status).to_lowercase(),
                media_role: artifact.media_role.clone(),
                drive_uri: artifact.drive.drive_uri.clone(),
                drive_space_id: artifact.drive.space_id.clone(),
                drive_space_type: artifact.drive.space_type.clone(),
                drive_node_id: artifact.drive.node_id.clone(),
                drive_node_version: artifact.drive.node_version.clone(),
                provider_artifact_id: artifact.provider_artifact_id.clone(),
                started_at: artifact.started_at.clone(),
                ended_at: artifact.ended_at.clone(),
                duration_ms: artifact.duration_ms,
                failure_reason: artifact.failure_reason.clone(),
            })
            .collect::<Vec<_>>();
        let source_webhook_event_id = input
            .source_webhook_event_id
            .or_else(|| session.last_provider_webhook_event_id.clone());
        let source_provider_query_job_id = input
            .source_provider_query_job_id
            .or_else(|| session.last_provider_query_job_id.clone());
        let completion_snapshot = json!({
            "mediaSessionId": session.id,
            "roomId": session.room_id,
            "providerProfileId": session.provider_profile_id,
            "providerSessionId": session.provider_session_id,
            "mediaMode": session.media_mode,
            "sessionStatus": session.status,
            "startedAt": session.started_at,
            "connectedAt": session.connected_at,
            "endedAt": session.ended_at,
            "durationMs": session.duration_ms,
            "endReason": session.end_reason,
            "endSource": session.end_source,
            "participantCount": participant_count,
            "maxConcurrentParticipants": max_concurrent_participants,
            "qualitySummary": quality_summary,
            "recordingSummary": recording_summary,
            "participants": participants,
            "tracks": tracks,
            "artifacts": artifacts,
            "sourceWebhookEventId": source_webhook_event_id,
            "sourceProviderQueryJobId": source_provider_query_job_id,
            "recordedAt": input.recorded_at,
        });
        let completion_snapshot_hash = rtc_provider_payload_hash(
            &serde_json::to_string(&completion_snapshot).unwrap_or_default(),
        );

        Self {
            id: format!("completion-{}", session.id),
            tenant_id: session.tenant_id,
            organization_id: session.organization_id,
            media_session_id: session.id,
            room_id: session.room_id,
            owner_user_id: session.owner_user_id,
            provider_profile_id: session.provider_profile_id,
            provider_session_id: session.provider_session_id,
            media_mode: session.media_mode,
            session_status: session.status,
            started_at: session.started_at,
            connected_at: session.connected_at,
            ended_at: session.ended_at,
            duration_ms: session.duration_ms,
            end_reason: session.end_reason,
            end_source: session.end_source,
            participant_count,
            max_concurrent_participants,
            quality_summary,
            recording_summary,
            participants,
            tracks,
            artifacts,
            source_webhook_event_id,
            source_provider_query_job_id,
            completion_snapshot,
            completion_snapshot_hash,
            recorded_at: input.recorded_at,
        }
    }
}

pub fn summarize_quality_samples(
    samples: &[RtcQualitySample],
) -> RtcMediaSessionCompletionQualitySummary {
    let latency_values = samples
        .iter()
        .filter_map(|sample| sample.latency_ms)
        .collect::<Vec<_>>();
    let jitter_values = samples
        .iter()
        .filter_map(|sample| sample.jitter_ms)
        .collect::<Vec<_>>();
    let bitrate_values = samples
        .iter()
        .filter_map(|sample| sample.bitrate_kbps)
        .collect::<Vec<_>>();
    let max_packet_loss_rate = samples
        .iter()
        .filter_map(|sample| sample.packet_loss_rate.as_deref())
        .filter_map(|value| value.parse::<f64>().ok().map(|parsed| (parsed, value)))
        .max_by(|left, right| left.0.total_cmp(&right.0))
        .map(|(_, value)| value.to_string());
    let mut participant_ids = samples
        .iter()
        .filter_map(|sample| sample.participant_id.as_deref())
        .collect::<Vec<_>>();
    participant_ids.sort_unstable();
    participant_ids.dedup();

    RtcMediaSessionCompletionQualitySummary {
        sample_count: samples.len() as u32,
        participant_sample_count: participant_ids.len() as u32,
        avg_latency_ms: average_u32(&latency_values),
        max_latency_ms: latency_values.iter().copied().max(),
        avg_jitter_ms: average_u32(&jitter_values),
        max_jitter_ms: jitter_values.iter().copied().max(),
        max_packet_loss_rate,
        min_bitrate_kbps: bitrate_values.iter().copied().min(),
        avg_bitrate_kbps: average_u32(&bitrate_values),
        first_sampled_at: samples
            .iter()
            .map(|sample| sample.sampled_at.as_str())
            .min()
            .map(str::to_string),
        last_sampled_at: samples
            .iter()
            .map(|sample| sample.sampled_at.as_str())
            .max()
            .map(str::to_string),
    }
}

pub fn summarize_recording_artifacts(
    artifacts: &[RtcMediaArtifact],
) -> RtcMediaSessionCompletionRecordingSummary {
    let artifact_count = artifacts.len() as u32;
    let recording_artifact_count = artifacts
        .iter()
        .filter(|artifact| {
            matches!(
                artifact.artifact_kind,
                crate::RtcRecordingArtifactKind::Recording
            )
        })
        .count() as u32;
    let ready_artifact_count = artifacts
        .iter()
        .filter(|artifact| {
            matches!(
                artifact.artifact_status,
                crate::RtcRecordingArtifactStatus::Ready
            )
        })
        .count() as u32;
    let failed_artifact_count = artifacts
        .iter()
        .filter(|artifact| {
            matches!(
                artifact.artifact_status,
                crate::RtcRecordingArtifactStatus::Failed
            )
        })
        .count() as u32;
    let processing_artifact_count = artifacts
        .iter()
        .filter(|artifact| {
            matches!(
                artifact.artifact_status,
                crate::RtcRecordingArtifactStatus::Pending
                    | crate::RtcRecordingArtifactStatus::Processing
            )
        })
        .count() as u32;
    let total_duration_ms = artifacts
        .iter()
        .filter_map(|artifact| artifact.duration_ms)
        .reduce(|left, right| left + right);
    let drive_resource_count = artifacts
        .iter()
        .filter(|artifact| {
            artifact.drive.is_canonical()
                && artifact.resource.source == crate::RtcMediaSource::Drive
        })
        .count() as u32;

    RtcMediaSessionCompletionRecordingSummary {
        artifact_count,
        recording_artifact_count,
        ready_artifact_count,
        failed_artifact_count,
        processing_artifact_count,
        total_duration_ms,
        drive_resource_count,
    }
}

fn average_u32(values: &[u32]) -> Option<u32> {
    if values.is_empty() {
        return None;
    }

    Some((values.iter().map(|value| u64::from(*value)).sum::<u64>() / values.len() as u64) as u32)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        RtcMediaArtifactDescriptor, RtcMediaParticipant, RtcRecordingArtifact,
        RtcRecordingArtifactKind, RtcRecordingArtifactStatus,
    };

    #[test]
    fn completion_record_summarizes_post_session_media_facts_without_signaling_state() {
        let session = RtcMediaSession {
            id: "session-1".to_string(),
            room_id: "room-1".to_string(),
            tenant_id: "tenant-1".to_string(),
            organization_id: "org-1".to_string(),
            owner_user_id: "user-1".to_string(),
            media_mode: RtcMediaSessionMode::Video,
            status: RtcMediaSessionStatus::Ended,
            provider_profile_id: Some("provider-volcengine".to_string()),
            provider_session_id: Some("volc-session-1".to_string()),
            started_at: Some("2026-06-06T00:00:00.000Z".to_string()),
            connected_at: Some("2026-06-06T00:00:02.000Z".to_string()),
            ended_at: Some("2026-06-06T00:10:00.000Z".to_string()),
            duration_ms: Some(600_000),
            end_reason: Some("host_closed".to_string()),
            end_source: Some(RtcMediaSessionEndSource::ProviderWebhook),
            participant_count: 2,
            max_concurrent_participants: 2,
            quality_summary: None,
            recording_summary: None,
            completion_recorded_at: None,
            last_provider_webhook_event_id: Some("webhook-1".to_string()),
            last_provider_query_job_id: Some("query-1".to_string()),
            participants: vec![
                RtcMediaParticipant {
                    id: "participant-1".to_string(),
                    session_id: "session-1".to_string(),
                    user_id: "user-1".to_string(),
                    display_name: "Host".to_string(),
                    role: RtcParticipantRole::Host,
                    state: RtcParticipantState::Left,
                    audio_muted: false,
                    video_muted: false,
                    screen_share_active: false,
                    provider_participant_id: Some("volc-user-1".to_string()),
                    joined_at: Some("2026-06-06T00:00:02.000Z".to_string()),
                    left_at: Some("2026-06-06T00:10:00.000Z".to_string()),
                    duration_ms: Some(598_000),
                    leave_reason: Some("host_closed".to_string()),
                    last_seen_at: Some("2026-06-06T00:10:00.000Z".to_string()),
                },
                RtcMediaParticipant {
                    id: "participant-2".to_string(),
                    session_id: "session-1".to_string(),
                    user_id: "user-2".to_string(),
                    display_name: "Guest".to_string(),
                    role: RtcParticipantRole::Guest,
                    state: RtcParticipantState::Left,
                    audio_muted: true,
                    video_muted: false,
                    screen_share_active: false,
                    provider_participant_id: Some("volc-user-2".to_string()),
                    joined_at: Some("2026-06-06T00:00:30.000Z".to_string()),
                    left_at: Some("2026-06-06T00:09:50.000Z".to_string()),
                    duration_ms: Some(560_000),
                    leave_reason: Some("user_left".to_string()),
                    last_seen_at: Some("2026-06-06T00:09:50.000Z".to_string()),
                },
            ],
        };

        let recording = RtcRecordingArtifact::drive_backed_recording(
            "tenant-1",
            "session-1",
            "space-rtc-user-1",
            "node-recording-1",
            Some("1".to_string()),
        )
        .into_media_artifact(RtcMediaArtifactDescriptor {
            id: "artifact-1".into(),
            owner_user_id: "user-1".into(),
            artifact_kind: RtcRecordingArtifactKind::Recording,
            artifact_status: RtcRecordingArtifactStatus::Ready,
            media_role: "rtc_recording".into(),
            started_at: "2026-06-06T00:00:00.000Z".into(),
            ended_at: "2026-06-06T00:10:00.000Z".into(),
        });

        let completion =
            RtcMediaSessionCompletionRecord::from_input(RtcMediaSessionCompletionInput {
                session,
                tracks: vec![RtcMediaTrack {
                    id: "track-1".to_string(),
                    session_id: "session-1".to_string(),
                    participant_id: "participant-1".to_string(),
                    track_kind: RtcMediaTrackKind::Video,
                    track_source: RtcMediaTrackSource::Camera,
                    provider_track_id: Some("volc-track-1".to_string()),
                    status: RtcMediaTrackStatus::Stopped,
                    started_at: Some("2026-06-06T00:00:02.000Z".to_string()),
                    ended_at: Some("2026-06-06T00:10:00.000Z".to_string()),
                    duration_ms: Some(598_000),
                    muted_duration_ms: Some(0),
                    end_reason: Some("session_ended".to_string()),
                }],
                artifacts: vec![recording],
                quality_samples: vec![
                    RtcQualitySample {
                        id: "quality-1".to_string(),
                        session_id: "session-1".to_string(),
                        participant_id: Some("participant-1".to_string()),
                        latency_ms: Some(40),
                        packet_loss_rate: Some("0.010000".to_string()),
                        jitter_ms: Some(8),
                        bitrate_kbps: Some(900),
                        sampled_at: "2026-06-06T00:05:00.000Z".to_string(),
                    },
                    RtcQualitySample {
                        id: "quality-2".to_string(),
                        session_id: "session-1".to_string(),
                        participant_id: Some("participant-2".to_string()),
                        latency_ms: Some(80),
                        packet_loss_rate: Some("0.030000".to_string()),
                        jitter_ms: Some(12),
                        bitrate_kbps: Some(700),
                        sampled_at: "2026-06-06T00:06:00.000Z".to_string(),
                    },
                ],
                source_webhook_event_id: Some("webhook-1".to_string()),
                source_provider_query_job_id: Some("query-1".to_string()),
                recorded_at: "2026-06-06T00:10:05.000Z".to_string(),
            });

        assert_eq!(completion.id, "completion-session-1");
        assert_eq!(completion.media_session_id, "session-1");
        assert_eq!(completion.duration_ms, Some(600_000));
        assert_eq!(
            completion.end_source,
            Some(RtcMediaSessionEndSource::ProviderWebhook)
        );
        assert_eq!(completion.participant_count, 2);
        assert_eq!(completion.max_concurrent_participants, 2);
        assert_eq!(completion.quality_summary.sample_count, 2);
        assert_eq!(completion.quality_summary.avg_latency_ms, Some(60));
        assert_eq!(completion.recording_summary.ready_artifact_count, 1);
        assert_eq!(completion.artifacts[0].drive_space_id, "space-rtc-user-1");
        assert_eq!(
            completion.artifacts[0].drive_space_type,
            crate::RtcDriveSpaceType::Rtc
        );
        assert_eq!(completion.artifacts[0].drive_node_id, "node-recording-1");
        assert_eq!(
            completion.artifacts[0].drive_node_version.as_deref(),
            Some("1")
        );
        assert!(completion.completion_snapshot_hash.starts_with("sha256:"));

        assert_eq!(
            completion.completion_snapshot["artifacts"][0]["driveSpaceType"],
            "rtc"
        );
        assert_eq!(
            completion.completion_snapshot["artifacts"][0]["driveNodeId"],
            "node-recording-1"
        );

        let serialized =
            serde_json::to_string(&completion).expect("completion record should serialize");
        for forbidden in ["signal", "invite", "ringing", "conversation"] {
            assert!(
                !serialized.contains(forbidden),
                "completion record must not include signaling term {forbidden}"
            );
        }
    }
}
