import type { RtcMediaSession } from './rtc-media-session';

export interface RtcMediaSessionListResponse {
  code: 0;
  data: unknown & { items: RtcMediaSession[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
