import type { RtcProviderProfileVerifyResultResponse } from './rtc-provider-profile-verify-result-response';

export interface RtcProviderProfilesVerifyResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
