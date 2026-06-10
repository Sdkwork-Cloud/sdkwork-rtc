export interface RtcMediaSessionCompletionArtifactSummary {
  artifactId: string;
  artifactKind: 'recording' | 'transcript' | 'screen_share' | 'snapshot' | 'other';
  artifactStatus: 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';
  mediaRole: string;
  driveUri: string;
  driveSpaceId: string;
  /** Dedicated Drive space type used by SDKWork RTC post-session recording and artifact archives. */
  driveSpaceType: 'rtc';
  driveNodeId: string;
  driveNodeVersion?: string | null;
  providerArtifactId?: string | null;
  startedAt?: string;
  endedAt?: string;
  durationMs?: string | null;
  failureReason?: string | null;
}
