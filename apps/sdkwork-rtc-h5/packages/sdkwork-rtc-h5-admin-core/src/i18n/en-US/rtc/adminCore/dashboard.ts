/**
 * RTC admin domain copy (en-US) — `dashboard` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcDashboardEn = {
  "admin.rtc.dashboard.title": "Provider Health Dashboard",
  "admin.rtc.dashboard.statProfiles": "Profiles",
  "admin.rtc.dashboard.statActive": "Active",
  "admin.rtc.dashboard.statHealthy": "Healthy",
  "admin.rtc.dashboard.defaultProfile": "Default Profile",
  "admin.rtc.dashboard.lastVerified": "Last verified: {{date}}",
  "admin.rtc.dashboard.verifyNow": "Verify Now",
  "admin.rtc.dashboard.degradedCount": "{{count}} degraded profile(s)",
  "admin.rtc.dashboard.unhealthyCount": "{{count}} unhealthy profile(s)",
  "admin.rtc.dashboard.capabilitiesTitle": "Capabilities Matrix",
  "admin.rtc.dashboard.col.provider": "Provider",
  "admin.rtc.dashboard.col.audio": "Audio",
  "admin.rtc.dashboard.col.video": "Video",
  "admin.rtc.dashboard.col.live": "Live",
  "admin.rtc.dashboard.col.screenShare": "Screen Share",
  "admin.rtc.dashboard.col.recording": "Recording",
  "admin.rtc.dashboard.col.webhook": "Webhook",
  "admin.rtc.dashboard.col.activeQuery": "Active Query",
} as const;
