import type { RtcProviderApplication } from './rtc-provider-application';

export interface RtcProviderApplicationResponse {
  code: 0;
  data: unknown & { item: RtcProviderApplication; };
  /** Server-owned request correlation id. */
  traceId: string;
}
