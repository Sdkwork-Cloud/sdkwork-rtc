/**
 * RTC admin domain copy (en-US) — `routes` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcRoutesEn = {
  "admin.rtc.routes.title": "Provider Routes",
  "admin.rtc.routes.loadMore": "Load more routes",
  "admin.rtc.routes.col.profileId": "Profile ID",
  "admin.rtc.routes.col.type": "Type",
  "admin.rtc.routes.col.region": "Region",
  "admin.rtc.routes.col.priority": "Priority",
  "admin.rtc.routes.col.status": "Status",
  "admin.rtc.routes.form.title": "Add Provider Route",
  "admin.rtc.routes.form.profile": "Provider Profile",
  "admin.rtc.routes.form.routeType": "Route Type",
  "admin.rtc.routes.form.region": "Region",
  "admin.rtc.routes.form.regionPlaceholder": "cn-beijing",
  "admin.rtc.routes.form.priority": "Priority",
} as const;
