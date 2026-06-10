import type { RtcQualitySample } from './rtc-quality-sample';

export interface RtcQualitySampleListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
