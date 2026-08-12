import type { RtcMediaParticipant } from './rtc-media-participant';
import type { RtcMediaSessionCompletionQualitySummary } from './rtc-media-session-completion-quality-summary';
import type { RtcMediaSessionCompletionRecordingSummary } from './rtc-media-session-completion-recording-summary';

export interface RtcMediaSession {
  id: string;
  roomId: string;
  tenantId: string;
  organizationId: string;
  ownerUserId: string;
  mediaMode: 'audio' | 'video' | 'live';
  status: 'preparing' | 'active' | 'closing' | 'ended' | 'failed';
  providerProfileId?: string | null;
  providerSessionId?: string | null;
  startedAt?: string | null;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationMs?: string | null;
  endReason?: string | null;
  endSource?: 'manual_close' | 'provider_webhook' | 'active_provider_query' | 'provider_state_sync' | 'timeout' | 'system_reconcile' | 'unknown' | null;
  participantCount?: number;
  maxConcurrentParticipants?: number;
  qualitySummary?: RtcMediaSessionCompletionQualitySummary | null;
  recordingSummary?: RtcMediaSessionCompletionRecordingSummary | null;
  completionRecordedAt?: string | null;
  lastProviderWebhookEventId?: string | null;
  lastProviderQueryJobId?: string | null;
  participants: RtcMediaParticipant[];
}
