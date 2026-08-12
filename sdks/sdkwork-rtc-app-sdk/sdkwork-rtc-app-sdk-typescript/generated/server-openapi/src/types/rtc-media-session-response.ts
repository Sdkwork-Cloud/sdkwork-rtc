import type { RtcMediaSession } from './rtc-media-session';

export interface RtcMediaSessionResponse {
  code: 0;
  data: unknown & { item: RtcMediaSession; };
  /** Server-owned request correlation id. */
  traceId: string;
}
