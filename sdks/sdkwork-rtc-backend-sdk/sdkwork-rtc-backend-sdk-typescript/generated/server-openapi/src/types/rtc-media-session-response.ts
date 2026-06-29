import type { RtcMediaSession } from './rtc-media-session';

export interface RtcMediaSessionResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
