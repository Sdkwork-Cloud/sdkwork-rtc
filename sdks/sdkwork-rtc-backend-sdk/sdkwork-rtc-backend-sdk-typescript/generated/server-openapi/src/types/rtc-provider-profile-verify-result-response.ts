import type { RtcProviderProfileVerifyResult } from './rtc-provider-profile-verify-result';

export interface RtcProviderProfileVerifyResultResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcProviderProfileVerifyResult;
}
