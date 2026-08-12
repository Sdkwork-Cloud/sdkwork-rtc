import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  RTC_CALL_EN_US,
  RTC_CALL_ZH_CN,
  resolveRtcCallLocale,
  type RtcCallI18nTexts,
} from "./dictionaries";

export type RtcCallLocale = "zh-CN" | "en-US";

interface RtcCallI18nContextValue {
  locale: RtcCallLocale;
  texts: RtcCallI18nTexts;
}

const RtcCallI18nContext = createContext<RtcCallI18nContextValue | null>(null);

function detectBrowserLocale(): RtcCallLocale {
  if (typeof navigator === "undefined") {
    return "en-US";
  }
  return resolveRtcCallLocale(navigator.language);
}

export interface RtcCallI18nProviderProps {
  children: ReactNode;
  locale?: RtcCallLocale;
  texts?: Partial<RtcCallI18nTexts>;
}

/**
 * Optional i18n provider. Without it the call surface falls back to the
 * browser language with built-in dictionaries; hosts may pin a locale and
 * override individual strings.
 */
export function RtcCallI18nProvider({
  children,
  locale,
  texts,
}: RtcCallI18nProviderProps) {
  const [browserLocale, setBrowserLocale] = useState<RtcCallLocale>(detectBrowserLocale);

  useEffect(() => {
    if (locale) {
      return;
    }
    const handleLanguageChange = () => setBrowserLocale(detectBrowserLocale());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, [locale]);

  const value = useMemo<RtcCallI18nContextValue>(() => {
    const resolvedLocale = locale ?? browserLocale;
    const base = resolvedLocale === "zh-CN" ? RTC_CALL_ZH_CN : RTC_CALL_EN_US;
    return {
      locale: resolvedLocale,
      texts: texts
        ? {
            ...base,
            ...texts,
            call: { ...base.call, ...texts.call },
            status: { ...base.status, ...texts.status },
            media: { ...base.media, ...texts.media },
            actions: { ...base.actions, ...texts.actions },
            toast: { ...base.toast, ...texts.toast },
          }
        : base,
    };
  }, [browserLocale, locale, texts]);

  return (
    <RtcCallI18nContext.Provider value={value}>
      {children}
    </RtcCallI18nContext.Provider>
  );
}

export function useRtcCallI18n(): RtcCallI18nTexts {
  const context = useContext(RtcCallI18nContext);
  if (context) {
    return context.texts;
  }
  return detectBrowserLocale() === "zh-CN" ? RTC_CALL_ZH_CN : RTC_CALL_EN_US;
}
