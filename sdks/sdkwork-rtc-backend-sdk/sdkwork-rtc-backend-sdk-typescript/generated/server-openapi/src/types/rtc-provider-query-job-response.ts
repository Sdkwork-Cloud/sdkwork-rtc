import type { RtcProviderQueryJob } from './rtc-provider-query-job';

export interface RtcProviderQueryJobResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
