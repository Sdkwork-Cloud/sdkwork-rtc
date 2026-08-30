/**
 * RTC admin domain copy (en-US) — `roomDetail` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcRoomDetailEn = {
  "admin.rtc.roomDetail.title": "Room Details",
  "admin.rtc.roomDetail.loading": "Loading room {{id}}...",
  "admin.rtc.roomDetail.roomId": "Room ID",
  "admin.rtc.roomDetail.titleLabel": "Title",
  "admin.rtc.roomDetail.owner": "Owner",
  "admin.rtc.roomDetail.organization": "Organization",
  "admin.rtc.roomDetail.created": "Created",
  "admin.rtc.roomDetail.sessions": "Room Sessions ({{count}})",
  "admin.rtc.roomDetail.loadingSessions": "Loading sessions...",
  "admin.rtc.roomDetail.noSessions": "No media sessions recorded in this room.",
  "admin.rtc.roomDetail.col.session": "Session",
  "admin.rtc.roomDetail.col.mode": "Mode",
  "admin.rtc.roomDetail.col.status": "Status",
  "admin.rtc.roomDetail.col.started": "Started",
  "admin.rtc.roomDetail.col.duration": "Duration",
  "admin.rtc.roomDetail.col.participants": "Participants",
  "admin.rtc.roomDetail.col.actions": "Actions",
  "admin.rtc.roomDetail.activeSessions": "{{count}} session(s) currently active in this room.",
} as const;
