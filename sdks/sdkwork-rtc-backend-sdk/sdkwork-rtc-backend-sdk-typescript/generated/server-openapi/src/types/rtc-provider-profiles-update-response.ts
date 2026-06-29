import type { RtcProviderProfileResponse } from './rtc-provider-profile-response';

export interface RtcProviderProfilesUpdateResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
