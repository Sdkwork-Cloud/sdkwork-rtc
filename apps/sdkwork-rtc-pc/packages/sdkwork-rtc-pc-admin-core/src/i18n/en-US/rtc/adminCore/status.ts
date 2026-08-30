/**
 * RTC admin domain copy (en-US) — `status` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcStatusEn = {
  "admin.rtc.status.active": "Active",
  "admin.rtc.status.archived": "Archived",
  "admin.rtc.status.disabled": "Disabled",
} as const;
