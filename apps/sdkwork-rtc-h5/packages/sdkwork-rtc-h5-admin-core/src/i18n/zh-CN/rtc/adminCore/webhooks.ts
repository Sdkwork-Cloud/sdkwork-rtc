/**
 * RTC admin domain copy (zh-CN) — `webhooks` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcWebhooksZh = {
  "admin.rtc.webhooks.title": "Webhook 事件",
  "admin.rtc.webhooks.loadMore": "加载更多事件",
  "admin.rtc.webhooks.col.provider": "供应商",
  "admin.rtc.webhooks.col.eventType": "事件类型",
  "admin.rtc.webhooks.col.eventKind": "事件种类",
  "admin.rtc.webhooks.col.status": "状态",
  "admin.rtc.webhooks.col.roomId": "房间 ID",
  "admin.rtc.webhooks.col.receivedAt": "接收时间",
} as const;
