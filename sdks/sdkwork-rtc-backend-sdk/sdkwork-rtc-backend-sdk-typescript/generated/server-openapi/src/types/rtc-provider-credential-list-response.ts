import type { RtcProviderCredential } from './rtc-provider-credential';

export interface RtcProviderCredentialListResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
