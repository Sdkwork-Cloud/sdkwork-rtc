import type { HttpClient } from '../http/client';
import type { RtcProviderProfileCommand, RtcProviderProfileDisableRequest, RtcProviderProfileListResponse, RtcProviderProfileResponse, RtcProviderProfileVerifyRequest, RtcProviderProfileVerifyResultResponse } from '../types';
export interface RtcProviderProfilesRtcProviderProfilesListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderProfilesRtcProviderProfilesApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Profiles list. */
    list(params?: RtcProviderProfilesRtcProviderProfilesListParams): Promise<RtcProviderProfileListResponse>;
    /** Rtc provider Profiles create. */
    create(body: RtcProviderProfileCommand): Promise<RtcProviderProfileResponse>;
    /** Rtc provider Profiles retrieve. */
    retrieve(providerProfileId: string): Promise<RtcProviderProfileResponse>;
    /** Rtc provider Profiles update. */
    update(providerProfileId: string, body?: RtcProviderProfileCommand): Promise<RtcProviderProfileResponse>;
    /** Rtc provider Profiles disable. */
    disable(providerProfileId: string, body: RtcProviderProfileDisableRequest): Promise<RtcProviderProfileResponse>;
    /** Rtc provider Profiles verify. */
    verify(providerProfileId: string, body: RtcProviderProfileVerifyRequest): Promise<RtcProviderProfileVerifyResultResponse>;
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