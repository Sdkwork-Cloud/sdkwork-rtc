import type { RtcProviderCredentialResponse } from './rtc-provider-credential-response';

export interface RtcProviderApplicationsCredentialsCreateResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
