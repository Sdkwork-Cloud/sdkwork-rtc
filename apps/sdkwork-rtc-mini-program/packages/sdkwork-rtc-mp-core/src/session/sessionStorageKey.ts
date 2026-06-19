export const RTC_MP_SESSION_STORAGE_KEY = "sdkwork-rtc-mini-program:session:v1";

const LEGACY_RTC_MP_SESSION_STORAGE_KEYS = ["sdkwork.rtc.app.session"] as const;

export function listLegacyRtcMpSessionStorageKeys(): readonly string[] {
  return LEGACY_RTC_MP_SESSION_STORAGE_KEYS;
}
