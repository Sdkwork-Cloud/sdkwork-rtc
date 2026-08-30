/**
 * RTC admin domain copy (en-US) — `sessions` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcSessionsEn = {
  "admin.rtc.sessions.loadMore": "Load more sessions",
  "admin.rtc.sessions.title": "Live Sessions",
  "admin.rtc.sessions.exportAll": "Export All",
  "admin.rtc.sessions.status.preparing": "Preparing",
  "admin.rtc.sessions.status.active": "Active",
  "admin.rtc.sessions.status.closing": "Closing",
  "admin.rtc.sessions.status.ended": "Ended",
  "admin.rtc.sessions.status.failed": "Failed",
  "admin.rtc.sessions.filter.search": "Search by session ID or room ID...",
  "admin.rtc.sessions.filter.allStatus": "All Status",
  "admin.rtc.sessions.filter.allTime": "All Time",
  "admin.rtc.sessions.filter.today": "Today",
  "admin.rtc.sessions.filter.week": "Last 7 Days",
  "admin.rtc.sessions.filter.month": "Last 30 Days",
  "admin.rtc.sessions.filter.clear": "Clear Filters",
  "admin.rtc.sessions.col.session": "Session",
  "admin.rtc.sessions.col.room": "Room",
  "admin.rtc.sessions.col.mode": "Mode",
  "admin.rtc.sessions.col.status": "Status",
  "admin.rtc.sessions.col.owner": "Owner",
  "admin.rtc.sessions.col.started": "Started",
  "admin.rtc.sessions.col.duration": "Duration",
  "admin.rtc.sessions.col.participants": "Participants",
  "admin.rtc.sessions.col.actions": "Actions",
  "admin.rtc.sessions.emptyLoading": "Loading sessions...",
  "admin.rtc.sessions.empty": "No media sessions found.",
  "admin.rtc.sessions.csv.id": "ID",
  "admin.rtc.sessions.csv.room": "Room",
  "admin.rtc.sessions.csv.mode": "Mode",
  "admin.rtc.sessions.csv.status": "Status",
  "admin.rtc.sessions.csv.owner": "Owner",
  "admin.rtc.sessions.csv.started": "Started",
  "admin.rtc.sessions.csv.ended": "Ended",
  "admin.rtc.sessions.csv.duration": "Duration",
  "admin.rtc.sessions.csv.participants": "Participants",
  "admin.rtc.sessions.footer": "{{count}} session(s) displayed",
  "admin.rtc.sessions.footerOf": " of {{total}}",
} as const;
