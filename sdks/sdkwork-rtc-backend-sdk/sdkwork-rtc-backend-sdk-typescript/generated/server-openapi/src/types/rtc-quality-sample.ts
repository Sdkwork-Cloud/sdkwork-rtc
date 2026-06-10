export interface RtcQualitySample {
  id: string;
  mediaSessionId: string;
  participantId?: string | null;
  latencyMs?: number | null;
  packetLossRate?: string | null;
  jitterMs?: number | null;
  bitrateKbps?: number | null;
  sampledAt: string;
}
