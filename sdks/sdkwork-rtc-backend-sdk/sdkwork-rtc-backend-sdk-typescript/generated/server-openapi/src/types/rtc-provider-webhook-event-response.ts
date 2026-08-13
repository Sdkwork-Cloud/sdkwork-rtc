import type { RtcProviderWebhookEvent } from './rtc-provider-webhook-event';

export interface RtcProviderWebhookEventResponse {
  code: 0;
  data: unknown & { item: RtcProviderWebhookEvent; };
  /** Server-owned request correlation id. */
  traceId: string;
}
