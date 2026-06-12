import type { RtcProviderAccount } from './rtc-provider-account';

export interface RtcProviderAccountResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcProviderAccount;
}
