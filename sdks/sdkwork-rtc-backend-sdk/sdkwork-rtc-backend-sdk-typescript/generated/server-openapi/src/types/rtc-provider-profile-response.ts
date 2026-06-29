import type { RtcProviderProfile } from './rtc-provider-profile';

export interface RtcProviderProfileResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
