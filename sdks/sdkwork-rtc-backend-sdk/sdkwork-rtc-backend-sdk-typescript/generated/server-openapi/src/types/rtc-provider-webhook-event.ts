export interface RtcProviderWebhookEvent {
  id: string;
  tenantId?: string;
  organizationId?: string;
  provider: string;
  providerProfileId?: string | null;
  externalEventId?: string | null;
  eventType: string;
  eventKind: 'room_started' | 'room_ended' | 'participant_joined' | 'participant_left' | 'recording_started' | 'recording_completed' | 'recording_failed' | 'media_track_started' | 'media_track_stopped' | 'quality_sample' | 'unknown';
  roomId?: string | null;
  mediaSessionId?: string | null;
  participantId?: string | null;
  recordingId?: string | null;
  payloadHash: string;
  rawPayload?: Record<string, unknown>;
  normalizedEvent?: Record<string, unknown>;
  signatureHeader?: string | null;
  receivedAt: string;
  processedAt?: string | null;
  status: 'received' | 'processed' | 'duplicate' | 'failed';
}
