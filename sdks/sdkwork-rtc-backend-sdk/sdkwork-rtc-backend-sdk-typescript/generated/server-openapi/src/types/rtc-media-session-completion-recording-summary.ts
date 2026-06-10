export interface RtcMediaSessionCompletionRecordingSummary {
  artifactCount: number;
  recordingArtifactCount: number;
  readyArtifactCount: number;
  failedArtifactCount: number;
  processingArtifactCount: number;
  totalDurationMs?: string | null;
  driveResourceCount: number;
}
