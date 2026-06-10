import type { HttpClient } from '../http/client';
import type { RtcMediaArtifactListResponse, RtcMediaArtifactResponse } from '../types';
export interface RtcMediaArtifactsRtcMediaArtifactsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcMediaArtifactsRtcMediaArtifactsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc media Artifacts list. */
    list(params?: RtcMediaArtifactsRtcMediaArtifactsListParams): Promise<RtcMediaArtifactListResponse>;
    /** Rtc media Artifacts retrieve. */
    retrieve(mediaArtifactId: string): Promise<RtcMediaArtifactResponse>;
}
export declare class RtcMediaArtifactsRtcApi {
    private client;
    readonly mediaArtifacts: RtcMediaArtifactsRtcMediaArtifactsApi;
    constructor(client: HttpClient);
}
export declare class RtcMediaArtifactsApi {
    private client;
    readonly rtc: RtcMediaArtifactsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcMediaArtifactsApi(client: HttpClient): RtcMediaArtifactsApi;
//# sourceMappingURL=rtc-media-artifacts.d.ts.map