import type { HttpClient } from '../http/client';
import type { RtcProviderRouteCommand, RtcProviderRouteListResponse, RtcProviderRouteResponse } from '../types';
export interface RtcProviderRoutesRtcProviderRoutesListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderRoutesRtcProviderRoutesApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Routes list. */
    list(params?: RtcProviderRoutesRtcProviderRoutesListParams): Promise<RtcProviderRouteListResponse>;
    /** Rtc provider Routes create. */
    create(body: RtcProviderRouteCommand): Promise<RtcProviderRouteResponse>;
}
export declare class RtcProviderRoutesRtcApi {
    private client;
    readonly providerRoutes: RtcProviderRoutesRtcProviderRoutesApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderRoutesApi {
    private client;
    readonly rtc: RtcProviderRoutesRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcProviderRoutesApi(client: HttpClient): RtcProviderRoutesApi;
//# sourceMappingURL=rtc-provider-routes.d.ts.map