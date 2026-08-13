import type { RtcProviderWebhookEvent } from './rtc-provider-webhook-event';

export interface RtcProviderWebhookEventListResponse {
  code: 0;
  data: unknown & { items: RtcProviderWebhookEvent[]; pageInfo: { mode: 'cursor'; nextCursor?: string | null; hasMore: boolean; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
