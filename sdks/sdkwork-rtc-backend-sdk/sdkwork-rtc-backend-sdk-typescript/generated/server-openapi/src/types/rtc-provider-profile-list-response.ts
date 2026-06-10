import type { RtcProviderProfile } from './rtc-provider-profile';

export interface RtcProviderProfileListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
