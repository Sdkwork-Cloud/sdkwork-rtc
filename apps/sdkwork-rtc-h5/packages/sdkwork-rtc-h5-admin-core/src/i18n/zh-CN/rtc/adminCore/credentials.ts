/**
 * RTC admin domain copy (zh-CN) — `credentials` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcCredentialsZh = {
  "admin.rtc.credentials.title": "供应商凭据",
  "admin.rtc.credentials.col.role": "角色",
  "admin.rtc.credentials.col.label": "标签",
  "admin.rtc.credentials.col.status": "状态",
  "admin.rtc.credentials.col.expires": "过期时间",
  "admin.rtc.credentials.col.actions": "操作",
  "admin.rtc.credentials.revoke": "撤销",
  "admin.rtc.credentials.fieldRequired": "{{label}} 为必填项",
  "admin.rtc.credentials.addTitle": "添加凭据",
  "admin.rtc.credentials.selectRole": "请选择要配置的凭据角色：",
  "admin.rtc.credentials.configureTitle": "配置 {{label}}",
  "admin.rtc.credentials.saveCredential": "保存凭据",
  "admin.rtc.credentials.failedLoad": "凭据加载失败",
  "admin.rtc.credentials.failedRevoke": "撤销凭据失败",
  "admin.rtc.credentials.noApplications": "暂无应用",
  "admin.rtc.credentials.loading": "正在加载凭据...",
  "admin.rtc.credentials.empty": "该应用暂无凭据。",
  "admin.rtc.credentials.role.cloud_api_signing": "云API签名",
  "admin.rtc.credentials.role.open_api_signing": "OpenAPI签名",
  "admin.rtc.credentials.role.rtc_token_signing": "RTC Token签名",
  "admin.rtc.credentials.role.usersig_signing": "UserSig签名",
  "admin.rtc.credentials.role.webhook_signing": "Webhook签名",
} as const;
