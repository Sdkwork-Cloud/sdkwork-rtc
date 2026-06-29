import type { RtcProviderApplication } from './rtc-provider-application';

export interface RtcProviderApplicationListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
