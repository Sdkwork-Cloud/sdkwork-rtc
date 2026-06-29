import type { RtcProviderProfileVerifyResult } from './rtc-provider-profile-verify-result';

export interface RtcProviderProfileVerifyResultResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
