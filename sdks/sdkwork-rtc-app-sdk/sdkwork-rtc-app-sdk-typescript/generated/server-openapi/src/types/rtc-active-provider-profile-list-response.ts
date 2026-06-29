import type { RtcActiveProviderProfile } from './rtc-active-provider-profile';

export interface RtcActiveProviderProfileListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
