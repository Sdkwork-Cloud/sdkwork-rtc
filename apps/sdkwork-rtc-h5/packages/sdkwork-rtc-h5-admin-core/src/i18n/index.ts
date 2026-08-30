/**
 * RTC admin domain i18n registry (thin boundary).
 *
 * Authored locale fragments live under `en-US/rtc/adminCore/*` and
 * `zh-CN/rtc/adminCore/*`; this registry only aggregates and re-exports them.
 * The host i18n catalog merges `rtcAdminMessages`, and en/zh key parity is
 * enforced by the host merge.
 *
 * `initRtcAdminI18n` is for standalone (non-portal) hosts only — e.g. the
 * RTC PC/H5 dev apps that boot without the SDKWork provider's i18n instance.
 * Portal hosts (Cloud Router) own the i18next instance and MUST NOT call it.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { adminRtcAccountsEn } from "./en-US/rtc/adminCore/accounts";
import { adminRtcApplicationsEn } from "./en-US/rtc/adminCore/applications";
import { adminRtcArtifactDetailEn } from "./en-US/rtc/adminCore/artifactDetail";
import { adminRtcArtifactsEn } from "./en-US/rtc/adminCore/artifacts";
import { adminRtcCapabilitiesEn } from "./en-US/rtc/adminCore/capabilities";
import { adminRtcCredentialsEn } from "./en-US/rtc/adminCore/credentials";
import { adminRtcDashboardEn } from "./en-US/rtc/adminCore/dashboard";
import { adminRtcNotFoundEn } from "./en-US/rtc/adminCore/notFound";
import { adminRtcPluginsEn } from "./en-US/rtc/adminCore/plugins";
import { adminRtcProfilesEn } from "./en-US/rtc/adminCore/profiles";
import { adminRtcQualityEn } from "./en-US/rtc/adminCore/quality";
import { adminRtcQueryJobsEn } from "./en-US/rtc/adminCore/queryJobs";
import { adminRtcRoomDetailEn } from "./en-US/rtc/adminCore/roomDetail";
import { adminRtcRoomsEn } from "./en-US/rtc/adminCore/rooms";
import { adminRtcRoutesEn } from "./en-US/rtc/adminCore/routes";
import { adminRtcSchemaEn } from "./en-US/rtc/adminCore/schema";
import { adminRtcSessionDetailEn } from "./en-US/rtc/adminCore/sessionDetail";
import { adminRtcSessionsEn } from "./en-US/rtc/adminCore/sessions";
import { adminRtcShellEn } from "./en-US/rtc/adminCore/shell";
import { adminRtcStatusEn } from "./en-US/rtc/adminCore/status";
import { adminRtcWebhooksEn } from "./en-US/rtc/adminCore/webhooks";
import { adminRtcWizardEn } from "./en-US/rtc/adminCore/wizard";
import { adminRtcAccountsZh } from "./zh-CN/rtc/adminCore/accounts";
import { adminRtcApplicationsZh } from "./zh-CN/rtc/adminCore/applications";
import { adminRtcArtifactDetailZh } from "./zh-CN/rtc/adminCore/artifactDetail";
import { adminRtcArtifactsZh } from "./zh-CN/rtc/adminCore/artifacts";
import { adminRtcCapabilitiesZh } from "./zh-CN/rtc/adminCore/capabilities";
import { adminRtcCredentialsZh } from "./zh-CN/rtc/adminCore/credentials";
import { adminRtcDashboardZh } from "./zh-CN/rtc/adminCore/dashboard";
import { adminRtcNotFoundZh } from "./zh-CN/rtc/adminCore/notFound";
import { adminRtcPluginsZh } from "./zh-CN/rtc/adminCore/plugins";
import { adminRtcProfilesZh } from "./zh-CN/rtc/adminCore/profiles";
import { adminRtcQualityZh } from "./zh-CN/rtc/adminCore/quality";
import { adminRtcQueryJobsZh } from "./zh-CN/rtc/adminCore/queryJobs";
import { adminRtcRoomDetailZh } from "./zh-CN/rtc/adminCore/roomDetail";
import { adminRtcRoomsZh } from "./zh-CN/rtc/adminCore/rooms";
import { adminRtcRoutesZh } from "./zh-CN/rtc/adminCore/routes";
import { adminRtcSchemaZh } from "./zh-CN/rtc/adminCore/schema";
import { adminRtcSessionDetailZh } from "./zh-CN/rtc/adminCore/sessionDetail";
import { adminRtcSessionsZh } from "./zh-CN/rtc/adminCore/sessions";
import { adminRtcShellZh } from "./zh-CN/rtc/adminCore/shell";
import { adminRtcStatusZh } from "./zh-CN/rtc/adminCore/status";
import { adminRtcWebhooksZh } from "./zh-CN/rtc/adminCore/webhooks";
import { adminRtcWizardZh } from "./zh-CN/rtc/adminCore/wizard";

export const en = {
  ...adminRtcAccountsEn,
  ...adminRtcApplicationsEn,
  ...adminRtcArtifactDetailEn,
  ...adminRtcArtifactsEn,
  ...adminRtcCapabilitiesEn,
  ...adminRtcCredentialsEn,
  ...adminRtcDashboardEn,
  ...adminRtcNotFoundEn,
  ...adminRtcPluginsEn,
  ...adminRtcProfilesEn,
  ...adminRtcQualityEn,
  ...adminRtcQueryJobsEn,
  ...adminRtcRoomDetailEn,
  ...adminRtcRoomsEn,
  ...adminRtcRoutesEn,
  ...adminRtcSchemaEn,
  ...adminRtcSessionDetailEn,
  ...adminRtcSessionsEn,
  ...adminRtcShellEn,
  ...adminRtcStatusEn,
  ...adminRtcWebhooksEn,
  ...adminRtcWizardEn,
} as const;

export const zh = {
  ...adminRtcAccountsZh,
  ...adminRtcApplicationsZh,
  ...adminRtcArtifactDetailZh,
  ...adminRtcArtifactsZh,
  ...adminRtcCapabilitiesZh,
  ...adminRtcCredentialsZh,
  ...adminRtcDashboardZh,
  ...adminRtcNotFoundZh,
  ...adminRtcPluginsZh,
  ...adminRtcProfilesZh,
  ...adminRtcQualityZh,
  ...adminRtcQueryJobsZh,
  ...adminRtcRoomDetailZh,
  ...adminRtcRoomsZh,
  ...adminRtcRoutesZh,
  ...adminRtcSchemaZh,
  ...adminRtcSessionDetailZh,
  ...adminRtcSessionsZh,
  ...adminRtcShellZh,
  ...adminRtcStatusZh,
  ...adminRtcWebhooksZh,
  ...adminRtcWizardZh,
} as const;

export const rtcAdminMessages = { en, zh };

export interface RtcAdminI18nInitOptions {
  /** Explicit language; defaults to a browser-language detection (`zh` -> zh-CN, otherwise en). */
  lng?: string;
}

export function initRtcAdminI18n(options: RtcAdminI18nInitOptions = {}): void {
  const detected = typeof navigator !== "undefined" ? navigator.language?.toLowerCase() : undefined;
  const lng = options.lng ?? (detected?.startsWith("zh") ? "zh" : "en");
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}
