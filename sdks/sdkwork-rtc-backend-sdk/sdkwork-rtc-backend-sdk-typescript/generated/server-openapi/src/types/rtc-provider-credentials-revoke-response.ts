import type { RtcProviderCredentialResponse } from './rtc-provider-credential-response';

export interface RtcProviderCredentialsRevokeResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
