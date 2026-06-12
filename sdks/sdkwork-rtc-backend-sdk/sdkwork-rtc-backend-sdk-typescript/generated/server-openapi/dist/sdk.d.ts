import { HttpClient } from './http/client';
import type { SdkworkBackendConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';
import { RtcMediaArtifactsApi } from './api/rtc-media-artifacts';
import { RtcMediaSessionsApi } from './api/rtc-media-sessions';
import { RtcProviderAccountsApi } from './api/rtc-provider-accounts';
import { RtcProviderApplicationsApi } from './api/rtc-provider-applications';
import { RtcProviderCredentialsApi } from './api/rtc-provider-credentials';
import { RtcProviderProfilesApi } from './api/rtc-provider-profiles';
import { RtcProviderQueryJobsApi } from './api/rtc-provider-query-jobs';
import { RtcProviderRoutesApi } from './api/rtc-provider-routes';
import { RtcProviderWebhooksApi } from './api/rtc-provider-webhooks';
import { RtcQualitySamplesApi } from './api/rtc-quality-samples';
import { RtcRoomsApi } from './api/rtc-rooms';
export declare class SdkworkBackendClient {
    private httpClient;
    readonly rtcMediaArtifacts: RtcMediaArtifactsApi;
    readonly rtcMediaSessions: RtcMediaSessionsApi;
    readonly rtcProviderAccounts: RtcProviderAccountsApi;
    readonly rtcProviderApplications: RtcProviderApplicationsApi;
    readonly rtcProviderCredentials: RtcProviderCredentialsApi;
    readonly rtcProviderProfiles: RtcProviderProfilesApi;
    readonly rtcProviderQueryJobs: RtcProviderQueryJobsApi;
    readonly rtcProviderRoutes: RtcProviderRoutesApi;
    readonly rtcProviderWebhooks: RtcProviderWebhooksApi;
    readonly rtcQualitySamples: RtcQualitySamplesApi;
    readonly rtcRooms: RtcRoomsApi;
    constructor(config: SdkworkBackendConfig);
    setAuthToken(token: string): this;
    setAccessToken(token: string): this;
    setTokenManager(manager: AuthTokenManager): this;
    get http(): HttpClient;
}
export declare function createClient(config: SdkworkBackendConfig): SdkworkBackendClient;
export default SdkworkBackendClient;
//# sourceMappingURL=sdk.d.ts.map