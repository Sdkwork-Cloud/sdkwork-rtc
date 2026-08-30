/**
 * RTC admin domain copy (en-US) — `capabilities` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcCapabilitiesEn = {
  "admin.rtc.capabilities.title": "Configure Capabilities",
  "admin.rtc.capabilities.saving": "Saving capabilities...",
  "admin.rtc.capabilities.configureTitle": "Configure {{name}} Capabilities",
  "admin.rtc.capabilities.hint": "Select which capabilities to enable for this provider profile.",
  "admin.rtc.capabilities.required": "Required",
  "admin.rtc.capabilities.summary": "Summary",
  "admin.rtc.capabilities.enabledCount": "{{count}} Enabled",
  "admin.rtc.capabilities.disabledCount": "{{count}} Disabled",
  "admin.rtc.capabilities.requiredCount": "{{count}} Required",
  "admin.rtc.capabilities.save": "Save Capabilities",
  "admin.rtc.capabilities.category.core": "Core Capabilities",
  "admin.rtc.capabilities.category.media": "Media Capabilities",
  "admin.rtc.capabilities.category.advanced": "Advanced Capabilities",
  "admin.rtc.capabilities.label.audio": "Audio",
  "admin.rtc.capabilities.label.video": "Video",
  "admin.rtc.capabilities.label.live": "Live Streaming",
  "admin.rtc.capabilities.label.screenShare": "Screen Share",
  "admin.rtc.capabilities.label.recording": "Recording",
  "admin.rtc.capabilities.label.webhook": "Webhook",
  "admin.rtc.capabilities.label.activeQuery": "Active Query",
  "admin.rtc.capabilities.desc.audio": "Audio calling capability",
  "admin.rtc.capabilities.desc.video": "Video calling capability",
  "admin.rtc.capabilities.desc.live": "Live streaming capability",
  "admin.rtc.capabilities.desc.screenShare": "Screen sharing capability",
  "admin.rtc.capabilities.desc.recording": "Recording capability",
  "admin.rtc.capabilities.desc.webhook": "Webhook callback capability",
  "admin.rtc.capabilities.desc.activeQuery": "Active query capability",
} as const;
