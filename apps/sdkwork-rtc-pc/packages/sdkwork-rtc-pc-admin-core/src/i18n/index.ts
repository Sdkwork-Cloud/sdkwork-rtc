/**
 * RTC admin domain i18n registry (thin boundary).
 *
 * Authored locale fragments live in `en.ts` / `zh.ts`; the host i18n catalog
 * merges `rtcAdminMessages` (like the Cloud Router RTC shell bundle), and
 * en/zh key parity is enforced by the host merge.
 *
 * `initRtcAdminI18n` is for standalone (non-portal) hosts only — e.g. the
 * RTC PC/H5 dev apps that boot without the SDKWork provider's i18n instance.
 * Portal hosts (Cloud Router) own the i18next instance and MUST NOT call it.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./en";
import { zh } from "./zh";

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
