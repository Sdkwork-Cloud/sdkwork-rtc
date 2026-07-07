import type { RtcProviderPluginDescriptor } from './rtc-provider-plugin-descriptor';

export interface RtcProviderPluginResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
