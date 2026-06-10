export interface RtcCreateMediaSessionRequest {
  roomId: string;
  mediaMode: 'audio' | 'video' | 'live';
  providerProfileId?: string | null;
  provider?: string | null;
  region?: string | null;
  recordingRequested?: boolean;
  metadata?: Record<string, unknown>;
}
