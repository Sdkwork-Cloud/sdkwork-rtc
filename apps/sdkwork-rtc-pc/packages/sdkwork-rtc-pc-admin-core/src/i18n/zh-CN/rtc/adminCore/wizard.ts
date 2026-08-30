/**
 * RTC admin domain copy (zh-CN) — `wizard` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcWizardZh = {
  "admin.rtc.wizard.title": "供应商配置向导",
  "admin.rtc.wizard.hint": "逐步配置新的 RTC 供应商",
  "admin.rtc.wizard.saving": "正在保存供应商配置...",
  "admin.rtc.wizard.step.account": "账户",
  "admin.rtc.wizard.step.application": "应用",
  "admin.rtc.wizard.step.credentials": "凭据",
  "admin.rtc.wizard.step.profile": "配置",
  "admin.rtc.wizard.step.review": "确认",
  "admin.rtc.wizard.configureTitle": "配置 {{name}}",
  "admin.rtc.wizard.accountTitle": "供应商账户",
  "admin.rtc.wizard.accountHint": "为 {{name}} 配置云账户",
  "admin.rtc.wizard.applicationTitle": "供应商应用",
  "admin.rtc.wizard.applicationHint": "为 {{name}} 配置 RTC 应用",
  "admin.rtc.wizard.credentialsTitle": "供应商凭据",
  "admin.rtc.wizard.credentialsHint": "为 {{name}} 选择并配置凭据角色",
  "admin.rtc.wizard.profileTitle": "供应商配置",
  "admin.rtc.wizard.profileHint": "为 {{name}} 配置 RTC 供应商配置",
  "admin.rtc.wizard.reviewTitle": "确认配置",
  "admin.rtc.wizard.reviewAccount": "账户",
  "admin.rtc.wizard.reviewProvider": "供应商",
  "admin.rtc.wizard.reviewCode": "编码",
  "admin.rtc.wizard.reviewName": "名称",
  "admin.rtc.wizard.reviewEnvironment": "环境",
  "admin.rtc.wizard.reviewApplication": "应用",
  "admin.rtc.wizard.reviewAppId": "应用 ID",
  "admin.rtc.wizard.reviewRegion": "区域",
  "admin.rtc.wizard.reviewCredentials": "凭据",
  "admin.rtc.wizard.reviewProfile": "配置",
  "admin.rtc.wizard.reviewDefault": "默认",
  "admin.rtc.wizard.next": "下一步",
  "admin.rtc.wizard.complete": "完成设置",
} as const;
