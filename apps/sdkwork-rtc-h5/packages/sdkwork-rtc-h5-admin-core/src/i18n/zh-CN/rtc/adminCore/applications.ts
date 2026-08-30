/**
 * RTC admin domain copy (zh-CN) — `applications` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcApplicationsZh = {
  "admin.rtc.applications.title": "供应商应用",
  "admin.rtc.applications.col.code": "编码",
  "admin.rtc.applications.col.name": "名称",
  "admin.rtc.applications.col.status": "状态",
  "admin.rtc.applications.col.appId": "应用 ID",
  "admin.rtc.applications.col.region": "区域",
  "admin.rtc.applications.col.actions": "操作",
  "admin.rtc.applications.edit": "编辑",
  "admin.rtc.applications.disable": "停用",
  "admin.rtc.applications.form.title": "{{name}} 应用",
  "admin.rtc.applications.failedLoad": "应用加载失败",
  "admin.rtc.applications.failedDisable": "停用应用失败",
  "admin.rtc.applications.noAccounts": "暂无可用账户",
  "admin.rtc.applications.loading": "正在加载应用...",
  "admin.rtc.applications.empty": "该账户暂无应用。",
} as const;
