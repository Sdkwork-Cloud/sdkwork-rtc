import type { RtcProviderRoute } from './rtc-provider-route';

export interface RtcProviderRouteListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
