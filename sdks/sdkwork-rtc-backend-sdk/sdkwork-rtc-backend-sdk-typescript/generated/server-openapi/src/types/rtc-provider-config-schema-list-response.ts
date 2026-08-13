import type { PageInfo } from './page-info';
import type { RtcProviderConfigSchema } from './rtc-provider-config-schema';

export interface RtcProviderConfigSchemaListResponse {
  code: 0;
  data: unknown & { items: RtcProviderConfigSchema[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
