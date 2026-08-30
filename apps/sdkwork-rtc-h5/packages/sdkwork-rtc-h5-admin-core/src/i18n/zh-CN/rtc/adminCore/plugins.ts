/**
 * RTC admin domain copy (zh-CN) — `plugins` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcPluginsZh = {
  "admin.rtc.plugins.title": "供应商插件",
  "admin.rtc.plugins.loadMore": "加载更多插件",
  "admin.rtc.plugins.noProfile": "未找到 {{provider}} 的有效供应商配置。",
  "admin.rtc.plugins.noProfileHint": "请先通过配置向导创建。",
  "admin.rtc.plugins.col.provider": "供应商",
  "admin.rtc.plugins.col.displayName": "显示名称",
  "admin.rtc.plugins.col.domain": "域名",
  "admin.rtc.plugins.col.required": "必需能力",
  "admin.rtc.plugins.col.optional": "可选能力",
  "admin.rtc.plugins.col.default": "默认",
  "admin.rtc.plugins.col.actions": "操作",
  "admin.rtc.plugins.default": "默认",
  "admin.rtc.plugins.configure": "配置",
} as const;
