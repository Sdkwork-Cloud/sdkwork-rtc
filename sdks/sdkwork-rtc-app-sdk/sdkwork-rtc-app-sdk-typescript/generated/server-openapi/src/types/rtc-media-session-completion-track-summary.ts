export interface RtcMediaSessionCompletionTrackSummary {
  trackId: string;
  participantId: string;
  trackKind: 'audio' | 'video' | 'screen_share' | 'data';
  trackSource: 'microphone' | 'camera' | 'screen' | 'system' | 'custom';
  status: 'publishing' | 'muted' | 'stopped' | 'failed';
  startedAt?: string;
  endedAt?: string;
  durationMs?: string | null;
  mutedDurationMs?: string | null;
  endReason?: string | null;
}
