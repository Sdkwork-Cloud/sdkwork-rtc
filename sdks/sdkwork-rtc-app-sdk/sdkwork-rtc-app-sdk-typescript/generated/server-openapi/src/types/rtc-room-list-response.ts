import type { RtcRoom } from './rtc-room';

export interface RtcRoomListResponse {
  code: 0;
  data: unknown & { items: RtcRoom[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
