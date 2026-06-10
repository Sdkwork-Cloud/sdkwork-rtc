import type { HttpClient } from '../http/client';
import type { RtcCreateMediaSessionRequest, RtcMediaSessionCompletionRecordResponse, RtcMediaSessionListResponse, RtcMediaSessionResponse } from '../types';
export declare class RtcMediaSessionsRtcMediaSessionsCompletionRecordApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc media Sessions completion Record retrieve. */
    retrieve(mediaSessionId: string): Promise<RtcMediaSessionCompletionRecordResponse>;
}
export interface RtcMediaSessionsRtcMediaSessionsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcMediaSessionsRtcMediaSessionsApi {
    private client;
    readonly completionRecord: RtcMediaSessionsRtcMediaSessionsCompletionRecordApi;
    constructor(client: HttpClient);
    /** Rtc media Sessions list. */
    list(params?: RtcMediaSessionsRtcMediaSessionsListParams): Promise<RtcMediaSessionListResponse>;
    /** Rtc media Sessions create. */
    create(body: RtcCreateMediaSessionRequest): Promise<RtcMediaSessionResponse>;
    /** Rtc media Sessions retrieve. */
    retrieve(mediaSessionId: string): Promise<RtcMediaSessionResponse>;
}
export declare class RtcMediaSessionsRtcApi {
    private client;
    readonly mediaSessions: RtcMediaSessionsRtcMediaSessionsApi;
    constructor(client: HttpClient);
}
export declare class RtcMediaSessionsApi {
    private client;
    readonly rtc: RtcMediaSessionsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcMediaSessionsApi(client: HttpClient): RtcMediaSessionsApi;
//# sourceMappingURL=rtc-media-sessions.d.ts.map