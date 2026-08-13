import type { RtcProviderAccount } from './rtc-provider-account';

export interface RtcProviderAccountResponse {
  code: 0;
  data: unknown & { item: RtcProviderAccount; };
  /** Server-owned request correlation id. */
  traceId: string;
}
