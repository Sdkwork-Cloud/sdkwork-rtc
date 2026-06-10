import type { HttpClient } from '../http/client';
import type { RtcQualitySampleListResponse } from '../types';
export interface RtcQualitySamplesRtcQualitySamplesListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcQualitySamplesRtcQualitySamplesApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc quality Samples list. */
    list(params?: RtcQualitySamplesRtcQualitySamplesListParams): Promise<RtcQualitySampleListResponse>;
}
export declare class RtcQualitySamplesRtcApi {
    private client;
    readonly qualitySamples: RtcQualitySamplesRtcQualitySamplesApi;
    constructor(client: HttpClient);
}
export declare class RtcQualitySamplesApi {
    private client;
    readonly rtc: RtcQualitySamplesRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcQualitySamplesApi(client: HttpClient): RtcQualitySamplesApi;
//# sourceMappingURL=rtc-quality-samples.d.ts.map