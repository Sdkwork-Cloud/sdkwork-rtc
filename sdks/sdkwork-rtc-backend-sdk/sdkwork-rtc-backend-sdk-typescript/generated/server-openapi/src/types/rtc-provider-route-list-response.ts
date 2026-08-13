import type { RtcProviderRoute } from './rtc-provider-route';

export interface RtcProviderRouteListResponse {
  code: 0;
  data: unknown & { items: RtcProviderRoute[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
