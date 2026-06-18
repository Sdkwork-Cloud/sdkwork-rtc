import { HttpClient, createHttpClient } from './http/client';
import type { SdkworkBackendConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { RtcMediaArtifactsApi, createRtcMediaArtifactsApi } from './api/rtc-media-artifacts';
import { RtcMediaSessionsApi, createRtcMediaSessionsApi } from './api/rtc-media-sessions';
import { RtcProviderAccountsApi, createRtcProviderAccountsApi } from './api/rtc-provider-accounts';
import { RtcProviderApplicationsApi, createRtcProviderApplicationsApi } from './api/rtc-provider-applications';
import { RtcProviderCredentialsApi, createRtcProviderCredentialsApi } from './api/rtc-provider-credentials';
import { RtcProviderPluginsApi, createRtcProviderPluginsApi } from './api/rtc-provider-plugins';
import { RtcProviderProfilesApi, createRtcProviderProfilesApi } from './api/rtc-provider-profiles';
import { RtcProviderQueryJobsApi, createRtcProviderQueryJobsApi } from './api/rtc-provider-query-jobs';
import { RtcProviderRoutesApi, createRtcProviderRoutesApi } from './api/rtc-provider-routes';
import { RtcProviderSchemasApi, createRtcProviderSchemasApi } from './api/rtc-provider-schemas';
import { RtcProviderWebhooksApi, createRtcProviderWebhooksApi } from './api/rtc-provider-webhooks';
import { RtcQualitySamplesApi, createRtcQualitySamplesApi } from './api/rtc-quality-samples';
import { RtcRoomsApi, createRtcRoomsApi } from './api/rtc-rooms';

export class SdkworkBackendClient {
  private httpClient: HttpClient;

  public readonly rtcMediaArtifacts: RtcMediaArtifactsApi;
  public readonly rtcMediaSessions: RtcMediaSessionsApi;
  public readonly rtcProviderAccounts: RtcProviderAccountsApi;
  public readonly rtcProviderApplications: RtcProviderApplicationsApi;
  public readonly rtcProviderCredentials: RtcProviderCredentialsApi;
  public readonly rtcProviderPlugins: RtcProviderPluginsApi;
  public readonly rtcProviderProfiles: RtcProviderProfilesApi;
  public readonly rtcProviderQueryJobs: RtcProviderQueryJobsApi;
  public readonly rtcProviderRoutes: RtcProviderRoutesApi;
  public readonly rtcProviderSchemas: RtcProviderSchemasApi;
  public readonly rtcProviderWebhooks: RtcProviderWebhooksApi;
  public readonly rtcQualitySamples: RtcQualitySamplesApi;
  public readonly rtcRooms: RtcRoomsApi;

  constructor(config: SdkworkBackendConfig) {
    this.httpClient = createHttpClient(config);
    this.rtcMediaArtifacts = createRtcMediaArtifactsApi(this.httpClient);

    this.rtcMediaSessions = createRtcMediaSessionsApi(this.httpClient);

    this.rtcProviderAccounts = createRtcProviderAccountsApi(this.httpClient);

    this.rtcProviderApplications = createRtcProviderApplicationsApi(this.httpClient);

    this.rtcProviderCredentials = createRtcProviderCredentialsApi(this.httpClient);

    this.rtcProviderPlugins = createRtcProviderPluginsApi(this.httpClient);

    this.rtcProviderProfiles = createRtcProviderProfilesApi(this.httpClient);

    this.rtcProviderQueryJobs = createRtcProviderQueryJobsApi(this.httpClient);

    this.rtcProviderRoutes = createRtcProviderRoutesApi(this.httpClient);

    this.rtcProviderSchemas = createRtcProviderSchemasApi(this.httpClient);

    this.rtcProviderWebhooks = createRtcProviderWebhooksApi(this.httpClient);

    this.rtcQualitySamples = createRtcQualitySamplesApi(this.httpClient);

    this.rtcRooms = createRtcRoomsApi(this.httpClient);
  }
  setAuthToken(token: string): this {
    this.httpClient.setAuthToken(token);
    return this;
  }

  setAccessToken(token: string): this {
    this.httpClient.setAccessToken(token);
    return this;
  }

  setTokenManager(manager: AuthTokenManager): this {
    this.httpClient.setTokenManager(manager);
    return this;
  }

  get http(): HttpClient {
    return this.httpClient;
  }
}

export function createClient(config: SdkworkBackendConfig): SdkworkBackendClient {
  return new SdkworkBackendClient(config);
}

export default SdkworkBackendClient;
