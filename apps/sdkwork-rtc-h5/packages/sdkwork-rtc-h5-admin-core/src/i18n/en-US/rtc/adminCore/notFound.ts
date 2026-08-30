/**
 * RTC admin domain copy (en-US) — `notFound` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcNotFoundEn = {
  "admin.rtc.notFound.title": "Page Not Found",
  "admin.rtc.notFound.unknownRoute": "Unknown admin route: {{route}}",
  "admin.rtc.notFound.goDashboard": "Go to Dashboard",
} as const;
