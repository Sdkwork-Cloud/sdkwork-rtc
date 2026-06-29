import type { RtcProviderQueryJobResponse } from './rtc-provider-query-job-response';

export interface RtcProviderQueryJobsCreateResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
