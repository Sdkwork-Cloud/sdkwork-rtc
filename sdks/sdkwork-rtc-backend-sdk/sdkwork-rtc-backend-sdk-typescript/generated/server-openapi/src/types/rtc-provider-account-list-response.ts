import type { RtcProviderAccount } from './rtc-provider-account';

export interface RtcProviderAccountListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
