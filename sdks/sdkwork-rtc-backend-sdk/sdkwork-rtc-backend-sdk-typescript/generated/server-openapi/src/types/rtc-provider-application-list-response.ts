import type { RtcProviderApplication } from './rtc-provider-application';

export interface RtcProviderApplicationListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
