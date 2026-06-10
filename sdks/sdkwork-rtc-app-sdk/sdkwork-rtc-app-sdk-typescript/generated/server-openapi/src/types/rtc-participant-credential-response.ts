import type { RtcParticipantCredential } from './rtc-participant-credential';

export interface RtcParticipantCredentialResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcParticipantCredential;
}
