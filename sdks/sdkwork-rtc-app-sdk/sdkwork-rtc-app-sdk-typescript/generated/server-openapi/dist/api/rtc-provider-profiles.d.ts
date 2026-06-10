import type { HttpClient } from '../http/client';
import type { RtcActiveProviderProfileListResponse } from '../types';
export interface RtcProviderProfilesRtcProviderProfilesActiveListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderProfilesRtcProviderProfilesActiveApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Profiles active list. */
    list(params?: RtcProviderProfilesRtcProviderProfilesActiveListParams): Promise<RtcActiveProviderProfileListResponse>;
}
export declare class RtcProviderProfilesRtcProviderProfilesApi {
    private client;
    readonly active: RtcProviderProfilesRtcProviderProfilesActiveApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderProfilesRtcApi {
    private client;
    readonly providerProfiles: RtcProviderProfilesRtcProviderProfilesApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderProfilesApi {
    private client;
    readonly rtc: RtcProviderProfilesRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcProviderProfilesApi(client: HttpClient): RtcProviderProfilesApi;
//# sourceMappingURL=rtc-provider-profiles.d.ts.map