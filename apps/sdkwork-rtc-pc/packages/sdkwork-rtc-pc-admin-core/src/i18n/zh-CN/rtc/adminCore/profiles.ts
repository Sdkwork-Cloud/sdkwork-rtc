/**
 * RTC admin domain copy (zh-CN) — `profiles` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcProfilesZh = {
  "admin.rtc.profiles.title": "供应商配置",
  "admin.rtc.profiles.loadMore": "加载更多配置",
  "admin.rtc.profiles.col.provider": "供应商",
  "admin.rtc.profiles.col.code": "编码",
  "admin.rtc.profiles.col.name": "名称",
  "admin.rtc.profiles.col.status": "状态",
  "admin.rtc.profiles.col.health": "健康状态",
  "admin.rtc.profiles.col.default": "默认",
  "admin.rtc.profiles.col.region": "区域",
  "admin.rtc.profiles.col.actions": "操作",
  "admin.rtc.profiles.edit": "编辑",
  "admin.rtc.profiles.verify": "验证",
  "admin.rtc.profiles.disable": "停用",
  "admin.rtc.profiles.form.title": "{{name}} 配置",
} as const;
