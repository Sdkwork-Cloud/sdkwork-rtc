import type { RtcProviderApplication } from './rtc-provider-application';

export interface RtcProviderApplicationListResponse {
  code: 0;
  data: unknown & { items: RtcProviderApplication[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
