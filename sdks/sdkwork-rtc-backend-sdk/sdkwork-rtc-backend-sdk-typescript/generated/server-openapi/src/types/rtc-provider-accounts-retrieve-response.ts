import type { RtcProviderAccountResponse } from './rtc-provider-account-response';

export interface RtcProviderAccountsRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
