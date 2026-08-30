/**
 * RTC admin domain copy (en-US) — `profiles` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcProfilesEn = {
  "admin.rtc.profiles.title": "Provider Profiles",
  "admin.rtc.profiles.loadMore": "Load more profiles",
  "admin.rtc.profiles.col.provider": "Provider",
  "admin.rtc.profiles.col.code": "Code",
  "admin.rtc.profiles.col.name": "Name",
  "admin.rtc.profiles.col.status": "Status",
  "admin.rtc.profiles.col.health": "Health",
  "admin.rtc.profiles.col.default": "Default",
  "admin.rtc.profiles.col.region": "Region",
  "admin.rtc.profiles.col.actions": "Actions",
  "admin.rtc.profiles.edit": "Edit",
  "admin.rtc.profiles.verify": "Verify",
  "admin.rtc.profiles.disable": "Disable",
  "admin.rtc.profiles.form.title": "{{name}} Profile",
} as const;
