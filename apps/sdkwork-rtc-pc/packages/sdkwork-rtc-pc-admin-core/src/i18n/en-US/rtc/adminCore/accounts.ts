/**
 * RTC admin domain copy (en-US) — `accounts` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcAccountsEn = {
  "admin.rtc.accounts.title": "Provider Accounts",
  "admin.rtc.accounts.loadMore": "Load more accounts",
  "admin.rtc.accounts.col.provider": "Provider",
  "admin.rtc.accounts.col.code": "Code",
  "admin.rtc.accounts.col.name": "Name",
  "admin.rtc.accounts.col.status": "Status",
  "admin.rtc.accounts.col.environment": "Environment",
  "admin.rtc.accounts.col.actions": "Actions",
  "admin.rtc.accounts.edit": "Edit",
  "admin.rtc.accounts.disable": "Disable",
  "admin.rtc.accounts.form.title": "{{name}} Account",
} as const;
