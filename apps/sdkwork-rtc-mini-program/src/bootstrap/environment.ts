export interface RtcEnvironment {
  apiBaseUrl: string;
  appbaseLoginUrl: string;
  defaultMediaMode: "audio" | "video" | "live";
}

const RUNTIME_CONFIG_KEY = "sdkwork.rtc.runtime.config";

const defaultEnvironment: RtcEnvironment = {
  apiBaseUrl: "http://127.0.0.1:18088/app/v3/api",
  appbaseLoginUrl: "http://127.0.0.1:3900",
  defaultMediaMode: "video",
};

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function readStoredRuntimeConfig(): Partial<RtcEnvironment> {
  try {
    const wxStorage = (globalThis as { wx?: { getStorageSync(key: string): unknown } }).wx;
    const raw = wxStorage?.getStorageSync?.(RUNTIME_CONFIG_KEY);
    if (raw && typeof raw === "object") {
      return raw as Partial<RtcEnvironment>;
    }
    if (typeof raw === "string" && raw.trim()) {
      return JSON.parse(raw) as Partial<RtcEnvironment>;
    }
  } catch {
    return {};
  }
  return {};
}

export function resolveEnvironment(): RtcEnvironment {
  const stored = readStoredRuntimeConfig();
  return {
    apiBaseUrl: normalizeBaseUrl(stored.apiBaseUrl, defaultEnvironment.apiBaseUrl),
    appbaseLoginUrl: normalizeBaseUrl(stored.appbaseLoginUrl, defaultEnvironment.appbaseLoginUrl),
    defaultMediaMode: stored.defaultMediaMode ?? defaultEnvironment.defaultMediaMode,
  };
}

export function saveRuntimeEnvironment(config: Partial<RtcEnvironment>): RtcEnvironment {
  const next = {
    ...resolveEnvironment(),
    ...config,
  };
  const wxStorage = (globalThis as { wx?: { setStorageSync(key: string, value: unknown): void } }).wx;
  wxStorage?.setStorageSync?.(RUNTIME_CONFIG_KEY, next);
  return next;
}
