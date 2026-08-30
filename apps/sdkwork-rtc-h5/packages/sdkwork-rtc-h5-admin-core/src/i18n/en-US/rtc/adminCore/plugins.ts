/**
 * RTC admin domain copy (en-US) — `plugins` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcPluginsEn = {
  "admin.rtc.plugins.title": "Provider Plugins",
  "admin.rtc.plugins.loadMore": "Load more plugins",
  "admin.rtc.plugins.noProfile": "No active provider profile found for {{provider}}.",
  "admin.rtc.plugins.noProfileHint": "Create one via the Setup Wizard first.",
  "admin.rtc.plugins.col.provider": "Provider",
  "admin.rtc.plugins.col.displayName": "Display Name",
  "admin.rtc.plugins.col.domain": "Domain",
  "admin.rtc.plugins.col.required": "Required Capabilities",
  "admin.rtc.plugins.col.optional": "Optional Capabilities",
  "admin.rtc.plugins.col.default": "Default",
  "admin.rtc.plugins.col.actions": "Actions",
  "admin.rtc.plugins.default": "Default",
  "admin.rtc.plugins.configure": "Configure",
} as const;
