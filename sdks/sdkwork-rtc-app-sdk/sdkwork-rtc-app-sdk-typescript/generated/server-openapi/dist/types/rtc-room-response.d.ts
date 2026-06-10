import type { RtcRoom } from './rtc-room';
export interface RtcRoomResponse {
    code: string;
    message: string;
    /** Server-owned request correlation id. */
    requestId: string;
    data: RtcRoom;
}
//# sourceMappingURL=rtc-room-response.d.ts.map