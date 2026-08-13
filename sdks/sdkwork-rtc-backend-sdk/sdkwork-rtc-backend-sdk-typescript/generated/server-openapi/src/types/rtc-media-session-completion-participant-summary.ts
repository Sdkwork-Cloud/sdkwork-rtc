export interface RtcMediaSessionCompletionParticipantSummary {
  participantId: string;
  userId: string;
  displayName: string;
  role: 'host' | 'guest' | 'listener';
  state: 'joining' | 'joined' | 'left' | 'kicked' | 'timeout';
  joinedAt?: string | null;
  leftAt?: string | null;
  durationMs?: string | null;
  leaveReason?: string | null;
  providerParticipantId?: string | null;
}
