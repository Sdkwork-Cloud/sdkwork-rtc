import type { RtcProviderCredential } from './rtc-provider-credential';

export interface RtcProviderCredentialResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
