/**
 * RTC admin domain copy (zh-CN) — `shell` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcShellZh = {
  "admin.rtc.loadingAdmin": "正在加载实时音视频管理数据...",
  "admin.rtc.error": "加载实时音视频中心数据失败",
  "admin.rtc.back": "返回",
  "admin.rtc.loadMore": "加载更多",
  "admin.rtc.loadingShort": "加载中...",
  "admin.rtc.errorFailedLoad": "数据加载失败",
  "admin.rtc.errorFailedLoadMore": "加载更多失败",
  "admin.rtc.errorFailedDashboard": "总览加载失败",
  "admin.rtc.errorFailedSchemas": "Schema 加载失败",
  "admin.rtc.errorFailedPersistWizard": "保存供应商向导失败",
  "admin.rtc.errorFailedCapabilities": "能力配置保存失败",
  "admin.rtc.errorFailedQueryJobCreate": "创建查询任务失败",
  "admin.rtc.errorFailedQueryJobLoad": "加载查询任务失败",
  "admin.rtc.errorCompletionUnavailable": "会话结算记录不可用",
  "admin.rtc.refresh": "刷新",
  "admin.rtc.exporting": "正在导出...",
  "admin.rtc.view": "查看",
  "admin.rtc.cancel": "取消",
  "admin.rtc.status": "状态",
  "admin.rtc.save": "保存",
  "admin.rtc.yes": "是",
  "admin.rtc.no": "否",
} as const;
