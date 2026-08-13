import type { RtcProviderQueryJob } from './rtc-provider-query-job';

export interface RtcProviderQueryJobResponse {
  code: 0;
  data: unknown & { item: RtcProviderQueryJob; };
  /** Server-owned request correlation id. */
  traceId: string;
}
