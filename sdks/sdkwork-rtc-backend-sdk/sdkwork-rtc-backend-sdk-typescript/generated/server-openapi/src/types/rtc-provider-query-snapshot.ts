export interface RtcProviderQuerySnapshot {
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
