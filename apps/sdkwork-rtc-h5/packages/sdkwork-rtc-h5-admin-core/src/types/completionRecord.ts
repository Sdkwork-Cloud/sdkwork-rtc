/**
 * RTC media session completion record admin domain types — mirror of the
 * backend `RtcMediaSessionCompletionRecord` schema family.
 */

import type { RtcMediaMode, RtcMediaSessionEndSource, RtcMediaSessionStatus } from "./mediaSession";

export interface RtcCompletionParticipantSummary {
  participantId: string;
  userId: string;
  displayName?: string;
  role: "host" | "guest" | "listener";
  state: "joining" | "joined" | "left" | "kicked" | "timeout";
  joinedAt?: string | null;
  leftAt?: string | null;
  durationMs?: string | null;
  leaveReason?: string | null;
  providerParticipantId?: string | null;
}

export interface RtcCompletionTrackSummary {
  trackId: string;
  participantId: string;
  trackKind: "audio" | "video" | "screen_share" | "data";
  trackSource: "microphone" | "camera" | "screen" | "system" | "custom";
  status: "publishing" | "muted" | "stopped" | "failed";
  startedAt?: string | null;
  endedAt?: string | null;
  durationMs?: string | null;
  mutedDurationMs?: string | null;
  endReason?: string | null;
}

export interface RtcCompletionQualitySummary {
  sampleCount: number;
  participantSampleCount: number;
  avgLatencyMs?: number | null;
  maxLatencyMs?: number | null;
  avgJitterMs?: number | null;
  maxJitterMs?: number | null;
  maxPacketLossRate?: string | null;
  minBitrateKbps?: number | null;
  avgBitrateKbps?: number | null;
  firstSampledAt?: string | null;
  lastSampledAt?: string | null;
}

export interface RtcCompletionRecordingSummary {
  artifactCount: number;
  recordingArtifactCount: number;
  readyArtifactCount: number;
  failedArtifactCount: number;
  processingArtifactCount: number;
  totalDurationMs?: string | null;
  driveResourceCount: number;
}

export interface RtcCompletionArtifactSummary {
  artifactId: string;
  artifactKind: string;
  artifactStatus: string;
  mediaRole?: string;
  durationMs?: string | null;
  driveUri?: string | null;
}

export interface RtcMediaSessionCompletionRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  mediaSessionId: string;
  roomId: string;
  ownerUserId: string;
  providerProfileId?: string | null;
  providerSessionId?: string | null;
  mediaMode: RtcMediaMode;
  sessionStatus: RtcMediaSessionStatus;
  startedAt?: string | null;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationMs?: string | null;
  endReason?: string | null;
  endSource?: RtcMediaSessionEndSource | null;
  participantCount: number;
  maxConcurrentParticipants: number;
  qualitySummary: RtcCompletionQualitySummary;
  recordingSummary: RtcCompletionRecordingSummary;
  participants: RtcCompletionParticipantSummary[];
  tracks: RtcCompletionTrackSummary[];
  artifacts: RtcCompletionArtifactSummary[];
  sourceWebhookEventId?: string | null;
  sourceProviderQueryJobId?: string | null;
  completionSnapshot?: Record<string, unknown>;
  completionSnapshotHash: string;
  recordedAt: string;
}
