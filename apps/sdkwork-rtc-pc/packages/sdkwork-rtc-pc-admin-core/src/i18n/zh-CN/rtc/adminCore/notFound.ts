/**
 * RTC admin domain copy (zh-CN) — `notFound` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcNotFoundZh = {
  "admin.rtc.notFound.title": "页面未找到",
  "admin.rtc.notFound.unknownRoute": "未知的管理路由：{{route}}",
  "admin.rtc.notFound.goDashboard": "前往总览",
} as const;
