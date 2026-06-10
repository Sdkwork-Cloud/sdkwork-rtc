import { HttpClient, createHttpClient } from './http/client';
import type { SdkworkBackendConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { RtcMediaArtifactsApi, createRtcMediaArtifactsApi } from './api/rtc-media-artifacts';
import { RtcMediaSessionsApi, createRtcMediaSessionsApi } from './api/rtc-media-sessions';
import { RtcProviderProfilesApi, createRtcProviderProfilesApi } from './api/rtc-provider-profiles';
import { RtcProviderQueryJobsApi, createRtcProviderQueryJobsApi } from './api/rtc-provider-query-jobs';
import { RtcProviderRoutesApi, createRtcProviderRoutesApi } from './api/rtc-provider-routes';
import { RtcProviderWebhooksApi, createRtcProviderWebhooksApi } from './api/rtc-provider-webhooks';
import { RtcQualitySamplesApi, createRtcQualitySamplesApi } from './api/rtc-quality-samples';
import { RtcRoomsApi, createRtcRoomsApi } from './api/rtc-rooms';

export class SdkworkBackendClient {
  private httpClient: HttpClient;

  public readonly rtcMediaArtifacts: RtcMediaArtifactsApi;
  public readonly rtcMediaSessions: RtcMediaSessionsApi;
  public readonly rtcProviderProfiles: RtcProviderProfilesApi;
  public readonly rtcProviderQueryJobs: RtcProviderQueryJobsApi;
  public readonly rtcProviderRoutes: RtcProviderRoutesApi;
  public readonly rtcProviderWebhooks: RtcProviderWebhooksApi;
  public readonly rtcQualitySamples: RtcQualitySamplesApi;
  public readonly rtcRooms: RtcRoomsApi;

  constructor(config: SdkworkBackendConfig) {
    this.httpClient = createHttpClient(config);
    this.rtcMediaArtifacts = createRtcMediaArtifactsApi(this.httpClient);

    this.rtcMediaSessions = createRtcMediaSessionsApi(this.httpClient);

    this.rtcProviderProfiles = createRtcProviderProfilesApi(this.httpClient);

    this.rtcProviderQueryJobs = createRtcProviderQueryJobsApi(this.httpClient);

    this.rtcProviderRoutes = createRtcProviderRoutesApi(this.httpClient);

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
