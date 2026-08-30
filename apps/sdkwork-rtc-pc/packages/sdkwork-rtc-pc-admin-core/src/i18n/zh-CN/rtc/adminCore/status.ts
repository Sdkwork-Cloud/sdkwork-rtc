/**
 * RTC admin domain copy (zh-CN) — `status` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcStatusZh = {
  "admin.rtc.status.active": "启用",
  "admin.rtc.status.archived": "已归档",
  "admin.rtc.status.disabled": "已停用",
} as const;
