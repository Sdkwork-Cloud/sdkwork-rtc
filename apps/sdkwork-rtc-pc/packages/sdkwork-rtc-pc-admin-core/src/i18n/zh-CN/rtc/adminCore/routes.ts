/**
 * RTC admin domain copy (zh-CN) — `routes` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcRoutesZh = {
  "admin.rtc.routes.title": "供应商路由",
  "admin.rtc.routes.loadMore": "加载更多路由",
  "admin.rtc.routes.col.profileId": "配置 ID",
  "admin.rtc.routes.col.type": "类型",
  "admin.rtc.routes.col.region": "区域",
  "admin.rtc.routes.col.priority": "优先级",
  "admin.rtc.routes.col.status": "状态",
  "admin.rtc.routes.form.title": "添加供应商路由",
  "admin.rtc.routes.form.profile": "供应商配置",
  "admin.rtc.routes.form.routeType": "路由类型",
  "admin.rtc.routes.form.region": "区域",
  "admin.rtc.routes.form.regionPlaceholder": "cn-beijing",
  "admin.rtc.routes.form.priority": "优先级",
} as const;
