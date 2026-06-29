import type { RtcProviderAccount } from './rtc-provider-account';

export interface RtcProviderAccountResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
