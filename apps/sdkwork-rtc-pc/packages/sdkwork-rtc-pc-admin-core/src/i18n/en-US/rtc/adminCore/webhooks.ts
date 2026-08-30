/**
 * RTC admin domain copy (en-US) — `webhooks` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcWebhooksEn = {
  "admin.rtc.webhooks.title": "Webhook Events",
  "admin.rtc.webhooks.loadMore": "Load more events",
  "admin.rtc.webhooks.col.provider": "Provider",
  "admin.rtc.webhooks.col.eventType": "Event Type",
  "admin.rtc.webhooks.col.eventKind": "Event Kind",
  "admin.rtc.webhooks.col.status": "Status",
  "admin.rtc.webhooks.col.roomId": "Room ID",
  "admin.rtc.webhooks.col.receivedAt": "Received At",
} as const;
