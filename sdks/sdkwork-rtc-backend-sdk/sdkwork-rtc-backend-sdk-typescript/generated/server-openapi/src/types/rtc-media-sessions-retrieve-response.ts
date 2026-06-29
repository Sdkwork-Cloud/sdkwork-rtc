import type { RtcMediaSessionResponse } from './rtc-media-session-response';

export interface RtcMediaSessionsRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
