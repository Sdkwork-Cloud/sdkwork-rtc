import type { HttpClient } from '../http/client';
import type { RtcProviderApplicationCommand, RtcProviderApplicationDisableRequest, RtcProviderApplicationListResponse, RtcProviderApplicationResponse } from '../types';
export declare class RtcProviderApplicationsRtcProviderApplicationsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Applications retrieve. */
    retrieve(providerApplicationId: string): Promise<RtcProviderApplicationResponse>;
    /** Rtc provider Applications update. */
    update(providerApplicationId: string, body?: RtcProviderApplicationCommand): Promise<RtcProviderApplicationResponse>;
    /** Rtc provider Applications disable. */
    disable(providerApplicationId: string, body: RtcProviderApplicationDisableRequest): Promise<RtcProviderApplicationResponse>;
}
export interface RtcProviderApplicationsRtcProviderAccountsApplicationsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderApplicationsRtcProviderAccountsApplicationsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Accounts applications list. */
    list(providerAccountId: string, params?: RtcProviderApplicationsRtcProviderAccountsApplicationsListParams): Promise<RtcProviderApplicationListResponse>;
    /** Rtc provider Accounts applications create. */
    create(providerAccountId: string, body: RtcProviderApplicationCommand): Promise<RtcProviderApplicationResponse>;
}
export declare class RtcProviderApplicationsRtcProviderAccountsApi {
    private client;
    readonly applications: RtcProviderApplicationsRtcProviderAccountsApplicationsApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderApplicationsRtcApi {
    private client;
    readonly providerAccounts: RtcProviderApplicationsRtcProviderAccountsApi;
    readonly providerApplications: RtcProviderApplicationsRtcProviderApplicationsApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderApplicationsApi {
    private client;
    readonly rtc: RtcProviderApplicationsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcProviderApplicationsApi(client: HttpClient): RtcProviderApplicationsApi;
//# sourceMappingURL=rtc-provider-applications.d.ts.map