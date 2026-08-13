import type { RtcProviderProfile } from './rtc-provider-profile';

export interface RtcProviderProfileListResponse {
  code: 0;
  data: unknown & { items: RtcProviderProfile[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
