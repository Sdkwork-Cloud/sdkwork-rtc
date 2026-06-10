import { HttpClient, createHttpClient } from './http/client';
import type { SdkworkAppConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { RtcMediaSessionsApi, createRtcMediaSessionsApi } from './api/rtc-media-sessions';
import { RtcParticipantCredentialsApi, createRtcParticipantCredentialsApi } from './api/rtc-participant-credentials';
import { RtcRecordingArtifactsApi, createRtcRecordingArtifactsApi } from './api/rtc-recording-artifacts';
import { RtcProviderProfilesApi, createRtcProviderProfilesApi } from './api/rtc-provider-profiles';
import { RtcRoomsApi, createRtcRoomsApi } from './api/rtc-rooms';

export class SdkworkAppClient {
  private httpClient: HttpClient;

  public readonly rtcMediaSessions: RtcMediaSessionsApi;
  public readonly rtcParticipantCredentials: RtcParticipantCredentialsApi;
  public readonly rtcRecordingArtifacts: RtcRecordingArtifactsApi;
  public readonly rtcProviderProfiles: RtcProviderProfilesApi;
  public readonly rtcRooms: RtcRoomsApi;

  constructor(config: SdkworkAppConfig) {
    this.httpClient = createHttpClient(config);
    this.rtcMediaSessions = createRtcMediaSessionsApi(this.httpClient);

    this.rtcParticipantCredentials = createRtcParticipantCredentialsApi(this.httpClient);

    this.rtcRecordingArtifacts = createRtcRecordingArtifactsApi(this.httpClient);

    this.rtcProviderProfiles = createRtcProviderProfilesApi(this.httpClient);

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

export function createClient(config: SdkworkAppConfig): SdkworkAppClient {
  return new SdkworkAppClient(config);
}

export default SdkworkAppClient;
