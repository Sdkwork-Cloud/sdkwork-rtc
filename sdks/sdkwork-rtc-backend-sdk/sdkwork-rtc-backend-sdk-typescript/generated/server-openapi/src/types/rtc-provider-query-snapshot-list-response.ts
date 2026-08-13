import type { RtcProviderQuerySnapshot } from './rtc-provider-query-snapshot';

export interface RtcProviderQuerySnapshotListResponse {
  code: 0;
  data: unknown & { items: RtcProviderQuerySnapshot[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
