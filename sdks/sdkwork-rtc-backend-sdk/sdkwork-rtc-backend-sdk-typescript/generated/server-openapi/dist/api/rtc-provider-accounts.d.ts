import type { HttpClient } from '../http/client';
import type { RtcProviderAccountCommand, RtcProviderAccountDisableRequest, RtcProviderAccountListResponse, RtcProviderAccountResponse } from '../types';
export interface RtcProviderAccountsRtcProviderAccountsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderAccountsRtcProviderAccountsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Accounts list. */
    list(params?: RtcProviderAccountsRtcProviderAccountsListParams): Promise<RtcProviderAccountListResponse>;
    /** Rtc provider Accounts create. */
    create(body: RtcProviderAccountCommand): Promise<RtcProviderAccountResponse>;
    /** Rtc provider Accounts retrieve. */
    retrieve(providerAccountId: string): Promise<RtcProviderAccountResponse>;
    /** Rtc provider Accounts update. */
    update(providerAccountId: string, body?: RtcProviderAccountCommand): Promise<RtcProviderAccountResponse>;
    /** Rtc provider Accounts disable. */
    disable(providerAccountId: string, body: RtcProviderAccountDisableRequest): Promise<RtcProviderAccountResponse>;
}
export declare class RtcProviderAccountsRtcApi {
    private client;
    readonly providerAccounts: RtcProviderAccountsRtcProviderAccountsApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderAccountsApi {
    private client;
    readonly rtc: RtcProviderAccountsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcProviderAccountsApi(client: HttpClient): RtcProviderAccountsApi;
//# sourceMappingURL=rtc-provider-accounts.d.ts.map