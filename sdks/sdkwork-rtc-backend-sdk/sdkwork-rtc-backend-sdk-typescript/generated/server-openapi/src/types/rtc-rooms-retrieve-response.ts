import type { RtcRoomResponse } from './rtc-room-response';

export interface RtcRoomsRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
