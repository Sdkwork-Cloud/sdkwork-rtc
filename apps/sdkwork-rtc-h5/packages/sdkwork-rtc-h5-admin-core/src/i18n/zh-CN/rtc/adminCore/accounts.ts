/**
 * RTC admin domain copy (zh-CN) — `accounts` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcAccountsZh = {
  "admin.rtc.accounts.title": "供应商账户",
  "admin.rtc.accounts.loadMore": "加载更多账户",
  "admin.rtc.accounts.col.provider": "供应商",
  "admin.rtc.accounts.col.code": "编码",
  "admin.rtc.accounts.col.name": "名称",
  "admin.rtc.accounts.col.status": "状态",
  "admin.rtc.accounts.col.environment": "环境",
  "admin.rtc.accounts.col.actions": "操作",
  "admin.rtc.accounts.edit": "编辑",
  "admin.rtc.accounts.disable": "停用",
  "admin.rtc.accounts.form.title": "{{name}} 账户",
} as const;
