import type { RtcRoom } from './rtc-room';

export interface RtcRoomResponse {
  code: 0;
  data: unknown & { item: RtcRoom; };
  /** Server-owned request correlation id. */
  traceId: string;
}
