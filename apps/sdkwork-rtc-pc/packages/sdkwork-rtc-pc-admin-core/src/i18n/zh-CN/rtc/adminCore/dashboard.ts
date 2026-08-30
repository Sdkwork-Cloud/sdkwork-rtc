/**
 * RTC admin domain copy (zh-CN) — `dashboard` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcDashboardZh = {
  "admin.rtc.dashboard.title": "供应商健康总览",
  "admin.rtc.dashboard.statProfiles": "配置",
  "admin.rtc.dashboard.statActive": "启用",
  "admin.rtc.dashboard.statHealthy": "健康",
  "admin.rtc.dashboard.defaultProfile": "默认配置",
  "admin.rtc.dashboard.lastVerified": "上次验证：{{date}}",
  "admin.rtc.dashboard.verifyNow": "立即验证",
  "admin.rtc.dashboard.degradedCount": "{{count}} 个降级配置",
  "admin.rtc.dashboard.unhealthyCount": "{{count}} 个不健康配置",
  "admin.rtc.dashboard.capabilitiesTitle": "能力矩阵",
  "admin.rtc.dashboard.col.provider": "供应商",
  "admin.rtc.dashboard.col.audio": "音频",
  "admin.rtc.dashboard.col.video": "视频",
  "admin.rtc.dashboard.col.live": "直播",
  "admin.rtc.dashboard.col.screenShare": "屏幕共享",
  "admin.rtc.dashboard.col.recording": "录制",
  "admin.rtc.dashboard.col.webhook": "Webhook",
  "admin.rtc.dashboard.col.activeQuery": "主动查询",
} as const;
