import type { RtcProviderProfileVerifyResult } from './rtc-provider-profile-verify-result';

export interface RtcProviderProfileVerifyResultResponse {
  code: 0;
  data: unknown & { item: RtcProviderProfileVerifyResult; };
  /** Server-owned request correlation id. */
  traceId: string;
}
