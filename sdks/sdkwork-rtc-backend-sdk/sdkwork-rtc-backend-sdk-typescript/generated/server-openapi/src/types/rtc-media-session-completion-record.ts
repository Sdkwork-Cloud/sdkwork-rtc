import type { RtcMediaSessionCompletionArtifactSummary } from './rtc-media-session-completion-artifact-summary';
import type { RtcMediaSessionCompletionParticipantSummary } from './rtc-media-session-completion-participant-summary';
import type { RtcMediaSessionCompletionQualitySummary } from './rtc-media-session-completion-quality-summary';
import type { RtcMediaSessionCompletionRecordingSummary } from './rtc-media-session-completion-recording-summary';
import type { RtcMediaSessionCompletionTrackSummary } from './rtc-media-session-completion-track-summary';

export interface RtcMediaSessionCompletionRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  mediaSessionId: string;
  roomId: string;
  ownerUserId: string;
  providerProfileId?: string | null;
  providerSessionId?: string | null;
  mediaMode: 'audio' | 'video' | 'live';
  sessionStatus: 'preparing' | 'active' | 'closing' | 'ended' | 'failed';
  startedAt?: string | null;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationMs?: string | null;
  endReason?: string | null;
  endSource?: 'manual_close' | 'provider_webhook' | 'active_provider_query' | 'provider_state_sync' | 'timeout' | 'system_reconcile' | 'unknown' | null;
  participantCount: number;
  maxConcurrentParticipants: number;
  qualitySummary: RtcMediaSessionCompletionQualitySummary;
  recordingSummary: RtcMediaSessionCompletionRecordingSummary;
  participants: RtcMediaSessionCompletionParticipantSummary[];
  tracks: RtcMediaSessionCompletionTrackSummary[];
  artifacts: RtcMediaSessionCompletionArtifactSummary[];
  sourceWebhookEventId?: string | null;
  sourceProviderQueryJobId?: string | null;
  completionSnapshot?: Record<string, unknown>;
  completionSnapshotHash: string;
  recordedAt: string;
}
