export interface RtcMediaParticipant {
  id: string;
  mediaSessionId: string;
  userId: string;
  displayName: string;
  role: 'host' | 'guest' | 'listener';
  state: 'joining' | 'joined' | 'left' | 'kicked' | 'timeout';
  audioMuted?: boolean;
  videoMuted?: boolean;
  screenShareActive?: boolean;
  providerParticipantId?: string | null;
  joinedAt?: string;
  leftAt?: string;
  durationMs?: string | null;
  leaveReason?: string | null;
  lastSeenAt?: string;
}
