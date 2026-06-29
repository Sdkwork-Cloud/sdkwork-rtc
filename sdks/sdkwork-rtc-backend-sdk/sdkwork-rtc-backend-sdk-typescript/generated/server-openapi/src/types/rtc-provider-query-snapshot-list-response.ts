import type { RtcProviderQuerySnapshot } from './rtc-provider-query-snapshot';

export interface RtcProviderQuerySnapshotListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
