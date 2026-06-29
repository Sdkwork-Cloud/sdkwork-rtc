import type { RtcProviderApplicationResponse } from './rtc-provider-application-response';

export interface RtcProviderApplicationsUpdateResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
