import type { RtcMediaSession } from './rtc-media-session';

export interface RtcMediaSessionResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcMediaSession;
}
