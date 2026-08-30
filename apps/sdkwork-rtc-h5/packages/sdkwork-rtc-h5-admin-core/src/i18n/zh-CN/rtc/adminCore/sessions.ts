/**
 * RTC admin domain copy (zh-CN) — `sessions` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcSessionsZh = {
  "admin.rtc.sessions.loadMore": "加载更多会话",
  "admin.rtc.sessions.title": "实时会话",
  "admin.rtc.sessions.exportAll": "导出全部",
  "admin.rtc.sessions.status.preparing": "准备中",
  "admin.rtc.sessions.status.active": "进行中",
  "admin.rtc.sessions.status.closing": "关闭中",
  "admin.rtc.sessions.status.ended": "已结束",
  "admin.rtc.sessions.status.failed": "失败",
  "admin.rtc.sessions.filter.search": "按会话 ID 或房间 ID 搜索...",
  "admin.rtc.sessions.filter.allStatus": "全部状态",
  "admin.rtc.sessions.filter.allTime": "全部时间",
  "admin.rtc.sessions.filter.today": "今天",
  "admin.rtc.sessions.filter.week": "最近 7 天",
  "admin.rtc.sessions.filter.month": "最近 30 天",
  "admin.rtc.sessions.filter.clear": "清除筛选",
  "admin.rtc.sessions.col.session": "会话",
  "admin.rtc.sessions.col.room": "房间",
  "admin.rtc.sessions.col.mode": "模式",
  "admin.rtc.sessions.col.status": "状态",
  "admin.rtc.sessions.col.owner": "所有者",
  "admin.rtc.sessions.col.started": "开始时间",
  "admin.rtc.sessions.col.duration": "时长",
  "admin.rtc.sessions.col.participants": "参与人数",
  "admin.rtc.sessions.col.actions": "操作",
  "admin.rtc.sessions.emptyLoading": "正在加载会话...",
  "admin.rtc.sessions.empty": "暂无媒体会话。",
  "admin.rtc.sessions.csv.id": "ID",
  "admin.rtc.sessions.csv.room": "房间",
  "admin.rtc.sessions.csv.mode": "模式",
  "admin.rtc.sessions.csv.status": "状态",
  "admin.rtc.sessions.csv.owner": "所有者",
  "admin.rtc.sessions.csv.started": "开始时间",
  "admin.rtc.sessions.csv.ended": "结束时间",
  "admin.rtc.sessions.csv.duration": "时长",
  "admin.rtc.sessions.csv.participants": "参与人数",
  "admin.rtc.sessions.footer": "共 {{count}} 个会话",
  "admin.rtc.sessions.footerOf": " / 共 {{total}} 个",
} as const;
