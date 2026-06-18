export interface ProviderQueryJob {
  id: string;
  tenantId?: string;
  organizationId?: string;
  provider: string;
  providerProfileId?: string | null;
  queryKind:
    | "room_online_users"
    | "room_state"
    | "media_session_state"
    | "recording_artifacts"
    | "quality_samples";
  targetKind: "room" | "media_session" | "recording" | "quality";
  targetId: string;
  roomId?: string | null;
  mediaSessionId?: string | null;
  status: "requested" | "running" | "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  resultSnapshot?: Record<string, unknown>;
}

export interface ProviderQueryJobCreateCommand {
  provider: string;
  providerProfileId?: string | null;
  queryKind: ProviderQueryJob["queryKind"];
  roomId?: string | null;
  mediaSessionId?: string | null;
  providerSessionId?: string | null;
  cursor?: string | null;
}

export interface ProviderQuerySnapshot {
  id: string;
  providerQueryJobId: string;
  provider: string;
  queryKind: string;
  targetKind: string;
  targetId: string;
  providerSessionId?: string | null;
  snapshotKind: string;
  snapshotPayload: Record<string, unknown>;
  capturedAt: string;
}
