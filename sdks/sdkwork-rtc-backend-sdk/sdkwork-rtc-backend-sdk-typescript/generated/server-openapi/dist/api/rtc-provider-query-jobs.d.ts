import type { HttpClient } from '../http/client';
import type { RtcProviderQueryJobCreateRequest, RtcProviderQueryJobResponse, RtcProviderQuerySnapshotListResponse } from '../types';
export interface RtcProviderQueryJobsRtcProviderQueryJobsSnapshotsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderQueryJobsRtcProviderQueryJobsSnapshotsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Query Jobs snapshots list. */
    list(providerQueryJobId: string, params?: RtcProviderQueryJobsRtcProviderQueryJobsSnapshotsListParams): Promise<RtcProviderQuerySnapshotListResponse>;
}
export declare class RtcProviderQueryJobsRtcProviderQueryJobsApi {
    private client;
    readonly snapshots: RtcProviderQueryJobsRtcProviderQueryJobsSnapshotsApi;
    constructor(client: HttpClient);
    /** Rtc provider Query Jobs create. */
    create(body: RtcProviderQueryJobCreateRequest): Promise<RtcProviderQueryJobResponse>;
    /** Rtc provider Query Jobs retrieve. */
    retrieve(providerQueryJobId: string): Promise<RtcProviderQueryJobResponse>;
}
export declare class RtcProviderQueryJobsRtcApi {
    private client;
    readonly providerQueryJobs: RtcProviderQueryJobsRtcProviderQueryJobsApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderQueryJobsApi {
    private client;
    readonly rtc: RtcProviderQueryJobsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcProviderQueryJobsApi(client: HttpClient): RtcProviderQueryJobsApi;
//# sourceMappingURL=rtc-provider-query-jobs.d.ts.map