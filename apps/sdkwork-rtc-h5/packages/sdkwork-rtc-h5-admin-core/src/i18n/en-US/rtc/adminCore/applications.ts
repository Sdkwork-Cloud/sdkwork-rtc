/**
 * RTC admin domain copy (en-US) — `applications` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcApplicationsEn = {
  "admin.rtc.applications.title": "Provider Applications",
  "admin.rtc.applications.col.code": "Code",
  "admin.rtc.applications.col.name": "Name",
  "admin.rtc.applications.col.status": "Status",
  "admin.rtc.applications.col.appId": "App ID",
  "admin.rtc.applications.col.region": "Region",
  "admin.rtc.applications.col.actions": "Actions",
  "admin.rtc.applications.edit": "Edit",
  "admin.rtc.applications.disable": "Disable",
  "admin.rtc.applications.form.title": "{{name}} Application",
  "admin.rtc.applications.failedLoad": "Failed to load applications",
  "admin.rtc.applications.failedDisable": "Failed to disable application",
  "admin.rtc.applications.noAccounts": "No accounts available",
  "admin.rtc.applications.loading": "Loading applications...",
  "admin.rtc.applications.empty": "No applications for this account.",
} as const;
