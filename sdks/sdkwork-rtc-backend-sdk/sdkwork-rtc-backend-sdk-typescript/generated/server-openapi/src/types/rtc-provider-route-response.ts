import type { RtcProviderRoute } from './rtc-provider-route';

export interface RtcProviderRouteResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
