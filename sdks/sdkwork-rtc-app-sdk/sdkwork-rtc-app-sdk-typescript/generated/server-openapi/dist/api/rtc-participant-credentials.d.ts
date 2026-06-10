import type { HttpClient } from '../http/client';
import type { RtcOperationCommand, RtcParticipantCredentialResponse } from '../types';
export declare class RtcParticipantCredentialsRtcMediaSessionsParticipantCredentialsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc media Sessions participant Credentials issue. */
    issue(mediaSessionId: string, participantId: string, body: RtcOperationCommand): Promise<RtcParticipantCredentialResponse>;
}
export declare class RtcParticipantCredentialsRtcMediaSessionsApi {
    private client;
    readonly participantCredentials: RtcParticipantCredentialsRtcMediaSessionsParticipantCredentialsApi;
    constructor(client: HttpClient);
}
export declare class RtcParticipantCredentialsRtcApi {
    private client;
    readonly mediaSessions: RtcParticipantCredentialsRtcMediaSessionsApi;
    constructor(client: HttpClient);
}
export declare class RtcParticipantCredentialsApi {
    private client;
    readonly rtc: RtcParticipantCredentialsRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcParticipantCredentialsApi(client: HttpClient): RtcParticipantCredentialsApi;
//# sourceMappingURL=rtc-participant-credentials.d.ts.map