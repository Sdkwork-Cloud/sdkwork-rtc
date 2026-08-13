import type { RtcProviderAccount } from './rtc-provider-account';

export interface RtcProviderAccountListResponse {
  code: 0;
  data: unknown & { items: RtcProviderAccount[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
