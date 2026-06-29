import type { RtcProviderRouteResponse } from './rtc-provider-route-response';

export interface RtcProviderRoutesCreateResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
