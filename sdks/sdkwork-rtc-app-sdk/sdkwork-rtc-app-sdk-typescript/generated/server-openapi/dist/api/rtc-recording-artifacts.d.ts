import type { HttpClient } from '../http/client';
import type { RtcMediaArtifactListResponse } from '../types';
export interface RtcRecordingArtifactsRtcMediaSessionsRecordingArtifactsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcRecordingArtifactsRtcMediaSessionsRecordingArtifactsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc media Sessions recording Artifacts list. */
    list(mediaSessionId: string, params?: RtcRecordingArtifactsRtcMediaSessionsRecordingArtifactsListParams): Promise<RtcMediaArtifactListResponse>;
}
export declare class RtcRecordingArtifactsRtcMediaSessionsApi {
    private client;
    readonly recordingArtifacts: RtcRecordingArtifactsRtcMediaSessionsRecordingArtifactsApi;
    constructor(client: HttpClient);
}
export declare class RtcRecordingArtifactsRtcApi {
    private client;
    readonly mediaSessions: RtcRecordingArtifactsRtcMediaSessionsApi;
    constructor(client: HttpClient);
}
export declare class RtcRecordingArtifactsApi {
    private client;
    readonly rtc: RtcRecordingArtifactsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcRecordingArtifactsApi(client: HttpClient): RtcRecordingArtifactsApi;
//# sourceMappingURL=rtc-recording-artifacts.d.ts.map