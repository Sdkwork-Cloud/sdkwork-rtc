import type { RtcProviderQueryJobResponse } from './rtc-provider-query-job-response';

export interface RtcProviderQueryJobsRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
