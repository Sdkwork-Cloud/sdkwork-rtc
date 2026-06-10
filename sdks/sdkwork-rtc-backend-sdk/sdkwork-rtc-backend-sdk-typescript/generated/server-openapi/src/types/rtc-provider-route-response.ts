import type { RtcProviderRoute } from './rtc-provider-route';

export interface RtcProviderRouteResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcProviderRoute;
}
