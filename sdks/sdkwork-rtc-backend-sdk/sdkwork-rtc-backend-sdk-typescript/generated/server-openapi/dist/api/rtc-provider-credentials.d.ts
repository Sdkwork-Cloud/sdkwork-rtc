import type { HttpClient } from '../http/client';
import type { RtcProviderCredentialCommand, RtcProviderCredentialListResponse, RtcProviderCredentialResponse, RtcProviderCredentialRevokeRequest } from '../types';
export declare class RtcProviderCredentialsRtcProviderCredentialsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Credentials retrieve. */
    retrieve(providerCredentialId: string): Promise<RtcProviderCredentialResponse>;
    /** Rtc provider Credentials update. */
    update(providerCredentialId: string, body?: RtcProviderCredentialCommand): Promise<RtcProviderCredentialResponse>;
    /** Rtc provider Credentials revoke. */
    revoke(providerCredentialId: string, body: RtcProviderCredentialRevokeRequest): Promise<RtcProviderCredentialResponse>;
}
export interface RtcProviderCredentialsRtcProviderApplicationsCredentialsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderCredentialsRtcProviderApplicationsCredentialsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Applications credentials list. */
    list(providerApplicationId: string, params?: RtcProviderCredentialsRtcProviderApplicationsCredentialsListParams): Promise<RtcProviderCredentialListResponse>;
    /** Rtc provider Applications credentials create. */
    create(providerApplicationId: string, body: RtcProviderCredentialCommand): Promise<RtcProviderCredentialResponse>;
}
export declare class RtcProviderCredentialsRtcProviderApplicationsApi {
    private client;
    readonly credentials: RtcProviderCredentialsRtcProviderApplicationsCredentialsApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderCredentialsRtcApi {
    private client;
    readonly providerApplications: RtcProviderCredentialsRtcProviderApplicationsApi;
    readonly providerCredentials: RtcProviderCredentialsRtcProviderCredentialsApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderCredentialsApi {
    private client;
    readonly rtc: RtcProviderCredentialsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcProviderCredentialsApi(client: HttpClient): RtcProviderCredentialsApi;
//# sourceMappingURL=rtc-provider-credentials.d.ts.map