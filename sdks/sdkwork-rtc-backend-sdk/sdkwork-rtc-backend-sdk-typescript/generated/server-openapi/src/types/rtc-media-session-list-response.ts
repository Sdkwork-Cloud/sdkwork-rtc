import type { RtcMediaSession } from './rtc-media-session';

export interface RtcMediaSessionListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
