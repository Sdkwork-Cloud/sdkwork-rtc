export interface RtcMediaSessionCompletionQualitySummary {
  sampleCount: number;
  participantSampleCount: number;
  avgLatencyMs?: number | null;
  maxLatencyMs?: number | null;
  avgJitterMs?: number | null;
  maxJitterMs?: number | null;
  maxPacketLossRate?: string | null;
  minBitrateKbps?: number | null;
  avgBitrateKbps?: number | null;
  firstSampledAt?: string;
  lastSampledAt?: string;
}
