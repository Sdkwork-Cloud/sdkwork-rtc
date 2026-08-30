/**
 * RTC admin domain copy (zh-CN) — `capabilities` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcCapabilitiesZh = {
  "admin.rtc.capabilities.title": "配置能力",
  "admin.rtc.capabilities.saving": "正在保存能力配置...",
  "admin.rtc.capabilities.configureTitle": "配置 {{name}} 能力",
  "admin.rtc.capabilities.hint": "选择要为该供应商配置启用的能力。",
  "admin.rtc.capabilities.required": "必需",
  "admin.rtc.capabilities.summary": "汇总",
  "admin.rtc.capabilities.enabledCount": "{{count}} 项已启用",
  "admin.rtc.capabilities.disabledCount": "{{count}} 项已停用",
  "admin.rtc.capabilities.requiredCount": "{{count}} 项必需",
  "admin.rtc.capabilities.save": "保存能力",
  "admin.rtc.capabilities.category.core": "核心能力",
  "admin.rtc.capabilities.category.media": "媒体能力",
  "admin.rtc.capabilities.category.advanced": "高级能力",
  "admin.rtc.capabilities.label.audio": "音频",
  "admin.rtc.capabilities.label.video": "视频",
  "admin.rtc.capabilities.label.live": "直播",
  "admin.rtc.capabilities.label.screenShare": "屏幕共享",
  "admin.rtc.capabilities.label.recording": "录制",
  "admin.rtc.capabilities.label.webhook": "Webhook",
  "admin.rtc.capabilities.label.activeQuery": "主动查询",
  "admin.rtc.capabilities.desc.audio": "音频通话能力",
  "admin.rtc.capabilities.desc.video": "视频通话能力",
  "admin.rtc.capabilities.desc.live": "直播推流能力",
  "admin.rtc.capabilities.desc.screenShare": "屏幕共享能力",
  "admin.rtc.capabilities.desc.recording": "录制能力",
  "admin.rtc.capabilities.desc.webhook": "Webhook 回调能力",
  "admin.rtc.capabilities.desc.activeQuery": "主动查询能力",
} as const;
