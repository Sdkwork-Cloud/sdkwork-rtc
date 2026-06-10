import type { RtcProviderWebhookEvent } from './rtc-provider-webhook-event';

export interface RtcProviderWebhookEventResponse {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: RtcProviderWebhookEvent;
}
