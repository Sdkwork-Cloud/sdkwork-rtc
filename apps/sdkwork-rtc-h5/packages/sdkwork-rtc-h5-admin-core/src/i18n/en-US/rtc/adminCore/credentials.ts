/**
 * RTC admin domain copy (en-US) — `credentials` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcCredentialsEn = {
  "admin.rtc.credentials.title": "Provider Credentials",
  "admin.rtc.credentials.col.role": "Role",
  "admin.rtc.credentials.col.label": "Label",
  "admin.rtc.credentials.col.status": "Status",
  "admin.rtc.credentials.col.expires": "Expires",
  "admin.rtc.credentials.col.actions": "Actions",
  "admin.rtc.credentials.revoke": "Revoke",
  "admin.rtc.credentials.fieldRequired": "{{label}} is required",
  "admin.rtc.credentials.addTitle": "Add Credential",
  "admin.rtc.credentials.selectRole": "Select a credential role to configure:",
  "admin.rtc.credentials.configureTitle": "Configure {{label}}",
  "admin.rtc.credentials.saveCredential": "Save Credential",
  "admin.rtc.credentials.failedLoad": "Failed to load credentials",
  "admin.rtc.credentials.failedRevoke": "Failed to revoke credential",
  "admin.rtc.credentials.noApplications": "No applications",
  "admin.rtc.credentials.loading": "Loading credentials...",
  "admin.rtc.credentials.empty": "No credentials for this application.",
  "admin.rtc.credentials.role.cloud_api_signing": "Cloud API Signing",
  "admin.rtc.credentials.role.open_api_signing": "OpenAPI Signing",
  "admin.rtc.credentials.role.rtc_token_signing": "RTC Token Signing",
  "admin.rtc.credentials.role.usersig_signing": "UserSig Signing",
  "admin.rtc.credentials.role.webhook_signing": "Webhook Signing",
} as const;
