import type { RtcActiveProviderProfile } from './rtc-active-provider-profile';

export interface RtcActiveProviderProfileListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
