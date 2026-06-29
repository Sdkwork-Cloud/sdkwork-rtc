import type { RtcProviderAccountResponse } from './rtc-provider-account-response';

export interface RtcProviderAccountsDisableResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
