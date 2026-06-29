import type { RtcParticipantCredentialResponse } from './rtc-participant-credential-response';

export interface RtcMediaSessionsParticipantCredentialsIssueResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
