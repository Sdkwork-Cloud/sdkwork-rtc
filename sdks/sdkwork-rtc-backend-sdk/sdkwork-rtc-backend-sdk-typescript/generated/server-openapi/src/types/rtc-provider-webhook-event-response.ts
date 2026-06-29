import type { RtcProviderWebhookEvent } from './rtc-provider-webhook-event';

export interface RtcProviderWebhookEventResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
