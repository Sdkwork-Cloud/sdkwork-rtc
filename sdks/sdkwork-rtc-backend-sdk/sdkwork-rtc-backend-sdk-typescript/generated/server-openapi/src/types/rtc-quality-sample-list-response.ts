import type { RtcQualitySample } from './rtc-quality-sample';

export interface RtcQualitySampleListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
