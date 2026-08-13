/**
 * RTC quality sample admin domain type — mirror of the backend
 * `RtcQualitySample` schema.
 */

export interface RtcQualitySample {
  id: string;
  mediaSessionId: string;
  participantId?: string;
  latencyMs?: number;
  packetLossRate?: string;
  jitterMs?: number;
  bitrateKbps?: number;
  sampledAt?: string;
}

export interface QualitySampleListParams {
  search?: string;
  createdAfter?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface QualitySampleListResponse {
  items: RtcQualitySample[];
  nextCursor?: string;
}
