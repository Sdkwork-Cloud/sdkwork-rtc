import type { RtcRoom } from './rtc-room';

export interface RtcRoomListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
