import type { HttpClient } from '../http/client';
import type { RtcRoomListResponse, RtcRoomResponse } from '../types';
export interface RtcRoomsRtcRoomsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcRoomsRtcRoomsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc rooms list. */
    list(params?: RtcRoomsRtcRoomsListParams): Promise<RtcRoomListResponse>;
    /** Rtc rooms retrieve. */
    retrieve(roomId: string): Promise<RtcRoomResponse>;
}
export declare class RtcRoomsRtcApi {
    private client;
    readonly rooms: RtcRoomsRtcRoomsApi;
    constructor(client: HttpClient);
}
export declare class RtcRoomsApi {
    private client;
    readonly rtc: RtcRoomsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcRoomsApi(client: HttpClient): RtcRoomsApi;
//# sourceMappingURL=rtc-rooms.d.ts.map