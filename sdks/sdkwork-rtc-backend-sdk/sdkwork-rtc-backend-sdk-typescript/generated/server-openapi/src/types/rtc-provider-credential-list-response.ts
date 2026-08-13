import type { RtcProviderCredential } from './rtc-provider-credential';

export interface RtcProviderCredentialListResponse {
  code: 0;
  data: unknown & { items: RtcProviderCredential[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
