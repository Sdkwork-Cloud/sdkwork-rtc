import type { RtcQualitySample } from './rtc-quality-sample';

export interface RtcQualitySampleListResponse {
  code: 0;
  data: unknown & { items: RtcQualitySample[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
