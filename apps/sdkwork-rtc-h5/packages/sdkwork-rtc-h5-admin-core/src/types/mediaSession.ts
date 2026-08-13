/**
 * RTC media session admin domain types (mirror of the backend OpenAPI
 * `RtcMediaSession*` schemas, hand-mapped for the admin surface).
 */

export type RtcMediaMode = "audio" | "video" | "live";
export type RtcMediaSessionStatus = "preparing" | "active" | "closing" | "ended" | "failed";
export type RtcMediaSessionEndSource =
  | "manual_close"
  | "provider_webhook"
  | "active_provider_query"
  | "provider_state_sync"
  | "timeout"
  | "system_reconcile"
  | "unknown";

export interface RtcMediaParticipant {
  id: string;
  mediaSessionId: string;
  userId: string;
  displayName?: string;
  role: "host" | "guest" | "listener";
  state: "joining" | "joined" | "left" | "kicked" | "timeout";
  audioMuted: boolean;
  videoMuted: boolean;
  screenShareActive: boolean;
  providerParticipantId?: string;
  joinedAt?: string;
  leftAt?: string;
  durationMs?: string;
  leaveReason?: string;
  lastSeenAt?: string;
}

export interface RtcMediaSessionQualitySummary {
  sampleCount?: number;
  avgLatencyMs?: number | null;
  maxLatencyMs?: number | null;
  avgJitterMs?: number | null;
  maxJitterMs?: number | null;
  maxPacketLossRate?: string | null;
  avgBitrateKbps?: number | null;
}

export interface RtcMediaSessionRecordingSummary {
  artifactCount?: number;
  readyArtifactCount?: number;
  failedArtifactCount?: number;
  totalDurationMs?: string | null;
  driveResourceCount?: number;
}

export interface RtcMediaSession {
  id: string;
  roomId: string;
  tenantId: string;
  organizationId: string;
  ownerUserId: string;
  mediaMode: RtcMediaMode;
  status: RtcMediaSessionStatus;
  providerProfileId?: string;
  providerSessionId?: string;
  startedAt?: string;
  connectedAt?: string;
  endedAt?: string;
  durationMs?: string;
  endReason?: string;
  endSource?: RtcMediaSessionEndSource;
  participantCount: number;
  maxConcurrentParticipants?: number;
  qualitySummary?: RtcMediaSessionQualitySummary;
  recordingSummary?: RtcMediaSessionRecordingSummary;
  completionRecordedAt?: string;
  lastProviderWebhookEventId?: string;
  lastProviderQueryJobId?: string;
  participants?: RtcMediaParticipant[];
}

export interface MediaSessionListParams {
  search?: string;
  status?: RtcMediaSessionStatus;
  ownerUserId?: string;
  createdAfter?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface MediaSessionListResponse {
  items: RtcMediaSession[];
  nextCursor?: string;
}
