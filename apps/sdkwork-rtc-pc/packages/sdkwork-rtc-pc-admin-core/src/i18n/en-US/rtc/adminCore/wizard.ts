/**
 * RTC admin domain copy (en-US) — `wizard` capability fragment.
 *
 * Flat `admin.rtc.*` keys shared with the Cloud Router host catalog; every
 * key must also exist in the matching en/zh fragment (host merge enforces
 * en/zh key parity).
 */
export const adminRtcWizardEn = {
  "admin.rtc.wizard.title": "Provider Setup Wizard",
  "admin.rtc.wizard.hint": "Configure a new RTC provider step by step",
  "admin.rtc.wizard.saving": "Persisting provider configuration...",
  "admin.rtc.wizard.step.account": "Account",
  "admin.rtc.wizard.step.application": "Application",
  "admin.rtc.wizard.step.credentials": "Credentials",
  "admin.rtc.wizard.step.profile": "Profile",
  "admin.rtc.wizard.step.review": "Review",
  "admin.rtc.wizard.configureTitle": "Configure {{name}}",
  "admin.rtc.wizard.accountTitle": "Provider Account",
  "admin.rtc.wizard.accountHint": "Configure the cloud account for {{name}}",
  "admin.rtc.wizard.applicationTitle": "Provider Application",
  "admin.rtc.wizard.applicationHint": "Configure the RTC application for {{name}}",
  "admin.rtc.wizard.credentialsTitle": "Provider Credentials",
  "admin.rtc.wizard.credentialsHint": "Select and configure credential roles for {{name}}",
  "admin.rtc.wizard.profileTitle": "Provider Profile",
  "admin.rtc.wizard.profileHint": "Configure the RTC provider profile for {{name}}",
  "admin.rtc.wizard.reviewTitle": "Review Configuration",
  "admin.rtc.wizard.reviewAccount": "Account",
  "admin.rtc.wizard.reviewProvider": "Provider",
  "admin.rtc.wizard.reviewCode": "Code",
  "admin.rtc.wizard.reviewName": "Name",
  "admin.rtc.wizard.reviewEnvironment": "Environment",
  "admin.rtc.wizard.reviewApplication": "Application",
  "admin.rtc.wizard.reviewAppId": "App ID",
  "admin.rtc.wizard.reviewRegion": "Region",
  "admin.rtc.wizard.reviewCredentials": "Credentials",
  "admin.rtc.wizard.reviewProfile": "Profile",
  "admin.rtc.wizard.reviewDefault": "Default",
  "admin.rtc.wizard.next": "Next",
  "admin.rtc.wizard.complete": "Complete Setup",
} as const;
