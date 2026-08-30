/**
 * RTC admin domain copy (en-US) — `shell` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcShellEn = {
  "admin.rtc.loadingAdmin": "Loading RTC admin data...",
  "admin.rtc.error": "Failed to load real-time AV center data",
  "admin.rtc.back": "Back",
  "admin.rtc.loadMore": "Load more",
  "admin.rtc.loadingShort": "Loading...",
  "admin.rtc.errorFailedLoad": "Failed to load data",
  "admin.rtc.errorFailedLoadMore": "Failed to load more",
  "admin.rtc.errorFailedDashboard": "Failed to load dashboard",
  "admin.rtc.errorFailedSchemas": "Failed to load schemas",
  "admin.rtc.errorFailedPersistWizard": "Failed to persist provider wizard",
  "admin.rtc.errorFailedCapabilities": "Failed to configure capabilities",
  "admin.rtc.errorFailedQueryJobCreate": "Failed to create query job",
  "admin.rtc.errorFailedQueryJobLoad": "Failed to load query job",
  "admin.rtc.errorCompletionUnavailable": "Completion record unavailable",
  "admin.rtc.refresh": "Refresh",
  "admin.rtc.exporting": "Exporting...",
  "admin.rtc.view": "View",
  "admin.rtc.cancel": "Cancel",
  "admin.rtc.status": "Status",
  "admin.rtc.save": "Save",
  "admin.rtc.yes": "Yes",
  "admin.rtc.no": "No",
} as const;
