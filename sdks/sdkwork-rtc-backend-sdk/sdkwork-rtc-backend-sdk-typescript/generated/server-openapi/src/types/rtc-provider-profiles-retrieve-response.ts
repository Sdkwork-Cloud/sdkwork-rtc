import type { RtcProviderProfileResponse } from './rtc-provider-profile-response';

export interface RtcProviderProfilesRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
