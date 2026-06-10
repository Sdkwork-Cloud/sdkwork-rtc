import { HttpClient } from './http/client';
import type { SdkworkAppConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';
import { RtcMediaSessionsApi } from './api/rtc-media-sessions';
import { RtcParticipantCredentialsApi } from './api/rtc-participant-credentials';
import { RtcRecordingArtifactsApi } from './api/rtc-recording-artifacts';
import { RtcProviderProfilesApi } from './api/rtc-provider-profiles';
import { RtcRoomsApi } from './api/rtc-rooms';
export declare class SdkworkAppClient {
    private httpClient;
    readonly rtcMediaSessions: RtcMediaSessionsApi;
    readonly rtcParticipantCredentials: RtcParticipantCredentialsApi;
    readonly rtcRecordingArtifacts: RtcRecordingArtifactsApi;
    readonly rtcProviderProfiles: RtcProviderProfilesApi;
    readonly rtcRooms: RtcRoomsApi;
    constructor(config: SdkworkAppConfig);
    setAuthToken(token: string): this;
    setAccessToken(token: string): this;
    setTokenManager(manager: AuthTokenManager): this;
    get http(): HttpClient;
}
export declare function createClient(config: SdkworkAppConfig): SdkworkAppClient;
export default SdkworkAppClient;
//# sourceMappingURL=sdk.d.ts.map