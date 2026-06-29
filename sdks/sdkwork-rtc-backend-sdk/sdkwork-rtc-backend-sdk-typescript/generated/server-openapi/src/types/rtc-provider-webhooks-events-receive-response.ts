import type { RtcProviderWebhookEventResponse } from './rtc-provider-webhook-event-response';

export interface RtcProviderWebhooksEventsReceiveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
