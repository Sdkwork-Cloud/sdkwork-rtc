import type { RtcProviderCredential } from './rtc-provider-credential';

export interface RtcProviderCredentialListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
