import type { RtcParticipantCredential } from './rtc-participant-credential';

export interface RtcParticipantCredentialResponse {
  code: 0;
  data: unknown & { item: RtcParticipantCredential; };
  /** Server-owned request correlation id. */
  traceId: string;
}
