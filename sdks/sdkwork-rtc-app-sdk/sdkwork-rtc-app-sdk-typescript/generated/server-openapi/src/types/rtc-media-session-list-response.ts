import type { RtcMediaSession } from './rtc-media-session';

export interface RtcMediaSessionListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
