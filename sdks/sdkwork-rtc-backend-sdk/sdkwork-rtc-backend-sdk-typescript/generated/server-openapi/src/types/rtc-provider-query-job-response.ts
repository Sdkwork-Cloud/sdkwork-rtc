import type { RtcProviderQueryJob } from './rtc-provider-query-job';

export interface RtcProviderQueryJobResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcProviderQueryJob;
}
