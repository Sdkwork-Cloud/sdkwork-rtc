import type { RtcProviderConfigSchema } from './rtc-provider-config-schema';

export interface RtcProviderConfigSchemaResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
