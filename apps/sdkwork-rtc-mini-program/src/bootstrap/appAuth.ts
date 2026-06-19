import type { AuthTokenManager } from "@sdkwork/sdk-common";
import {
  DEFAULT_APP_SESSION,
  listLegacyRtcMpSessionStorageKeys,
  parseAppbaseCallbackSession,
  RTC_MP_SESSION_STORAGE_KEY,
  type RtcAppSession,
} from "@sdkwork/rtc-mp-core";
import {
  createTokenManager,
  setTokenManager,
} from "./tokenManager";

import { getHostAdapters } from "./hostAdapters";

export { DEFAULT_APP_SESSION, RTC_MP_SESSION_STORAGE_KEY, type RtcAppSession };

function parseStoredSession(raw: string): RtcAppSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<RtcAppSession>;
    if (!parsed.accessToken?.trim()) {
      return null;
    }
    return {
      accessToken: parsed.accessToken.trim(),
      authToken: parsed.authToken?.trim() || parsed.accessToken.trim(),
      tenantId: parsed.tenantId?.trim() || DEFAULT_APP_SESSION.tenantId,
      organizationId: parsed.organizationId?.trim() || DEFAULT_APP_SESSION.organizationId,
      userId: parsed.userId?.trim() || DEFAULT_APP_SESSION.userId,
    };
  } catch {
    return null;
  }
}

function migrateLegacyAppSession(storage: NonNullable<ReturnType<typeof getHostAdapters>["secureStorage"]>): RtcAppSession | null {
  for (const legacyKey of listLegacyRtcMpSessionStorageKeys()) {
    const raw = storage.getItem(legacyKey);
    if (!raw) {
      continue;
    }
    const session = parseStoredSession(raw);
    storage.removeItem(legacyKey);
    if (session) {
      storage.setItem(RTC_MP_SESSION_STORAGE_KEY, JSON.stringify(session));
      return session;
    }
  }
  return null;
}

export function loadAppSession(): RtcAppSession | null {
  const storage = getHostAdapters().secureStorage;
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(RTC_MP_SESSION_STORAGE_KEY);
  if (raw) {
    return parseStoredSession(raw);
  }

  return migrateLegacyAppSession(storage);
}

export function saveAppSession(session: RtcAppSession): void {
  getHostAdapters().secureStorage?.setItem(RTC_MP_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAppSession(): void {
  const storage = getHostAdapters().secureStorage;
  if (!storage) {
    return;
  }
  storage.removeItem(RTC_MP_SESSION_STORAGE_KEY);
  for (const legacyKey of listLegacyRtcMpSessionStorageKeys()) {
    storage.removeItem(legacyKey);
  }
}

export function createAppTokenManager(session: RtcAppSession): AuthTokenManager {
  return createTokenManager(() => session.accessToken);
}

export function consumeAppbaseCallbackSession(query: Record<string, string | undefined>): RtcAppSession | null {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }
  const session = parseAppbaseCallbackSession(`?${params.toString()}`, "");
  if (!session) {
    return null;
  }
  saveAppSession(session);
  return session;
}

export function bootstrapAppAuth(): RtcAppSession | null {
  const session = loadAppSession();
  if (!session) {
    return null;
  }
  setTokenManager(createAppTokenManager(session));
  return session;
}
