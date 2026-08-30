/**
 * RTC call surface i18n thin registry.
 *
 * Aggregates the zh-CN / en-US call locale fragments and locale resolver so
 * host applications can embed the call surface without dictionary merges.
 */
export type { RtcCallI18nTexts } from "./en-US/rtc/call/dictionaries";
export { RTC_CALL_EN_US } from "./en-US/rtc/call/dictionaries";
export { RTC_CALL_ZH_CN } from "./zh-CN/rtc/call/dictionaries";

export function resolveRtcCallLocale(language: string | undefined): "zh-CN" | "en-US" {
  return language?.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}
