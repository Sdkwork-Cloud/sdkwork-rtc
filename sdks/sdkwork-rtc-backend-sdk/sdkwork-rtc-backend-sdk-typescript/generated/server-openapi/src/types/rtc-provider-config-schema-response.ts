import type { RtcProviderConfigSchema } from './rtc-provider-config-schema';

export interface RtcProviderConfigSchemaResponse {
  code: 0;
  data: unknown & { item: RtcProviderConfigSchema; };
  /** Server-owned request correlation id. */
  traceId: string;
}
