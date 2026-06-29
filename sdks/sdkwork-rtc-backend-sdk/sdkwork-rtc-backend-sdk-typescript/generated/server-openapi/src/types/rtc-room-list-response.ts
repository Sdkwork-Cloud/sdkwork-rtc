import type { RtcRoom } from './rtc-room';

export interface RtcRoomListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
