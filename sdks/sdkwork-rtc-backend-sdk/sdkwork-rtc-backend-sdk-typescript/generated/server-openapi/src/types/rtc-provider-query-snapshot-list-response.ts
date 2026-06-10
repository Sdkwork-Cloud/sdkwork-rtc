import type { RtcProviderQuerySnapshot } from './rtc-provider-query-snapshot';

export interface RtcProviderQuerySnapshotListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
