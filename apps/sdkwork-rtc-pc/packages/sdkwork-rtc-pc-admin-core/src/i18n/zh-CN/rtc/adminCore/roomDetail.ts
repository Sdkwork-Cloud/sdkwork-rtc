/**
 * RTC admin domain copy (zh-CN) — `roomDetail` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcRoomDetailZh = {
  "admin.rtc.roomDetail.title": "通话房间详情",
  "admin.rtc.roomDetail.loading": "正在加载房间 {{id}}...",
  "admin.rtc.roomDetail.roomId": "房间 ID",
  "admin.rtc.roomDetail.titleLabel": "标题",
  "admin.rtc.roomDetail.owner": "所有者",
  "admin.rtc.roomDetail.organization": "组织",
  "admin.rtc.roomDetail.created": "创建时间",
  "admin.rtc.roomDetail.sessions": "房间会话（{{count}}）",
  "admin.rtc.roomDetail.loadingSessions": "正在加载会话...",
  "admin.rtc.roomDetail.noSessions": "该房间暂无媒体会话记录。",
  "admin.rtc.roomDetail.col.session": "会话",
  "admin.rtc.roomDetail.col.mode": "模式",
  "admin.rtc.roomDetail.col.status": "状态",
  "admin.rtc.roomDetail.col.started": "开始时间",
  "admin.rtc.roomDetail.col.duration": "时长",
  "admin.rtc.roomDetail.col.participants": "参与人数",
  "admin.rtc.roomDetail.col.actions": "操作",
  "admin.rtc.roomDetail.activeSessions": "该房间当前有 {{count}} 个进行中的会话。",
} as const;
