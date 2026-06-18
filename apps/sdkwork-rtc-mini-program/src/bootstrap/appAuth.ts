import type { AuthTokenManager } from "@sdkwork/sdk-common";
import {
  DEFAULT_APP_SESSION,
  parseAppbaseCallbackSession,
  type RtcAppSession,
} from "@sdkwork/rtc-mp-core";
import {
  createTokenManager,
  setTokenManager,
} from "./tokenManager";

import { getHostAdapters } from "./hostAdapters";

const SESSION_STORAGE_KEY = "sdkwork.rtc.app.session";

export { DEFAULT_APP_SESSION, type RtcAppSession };

export function loadAppSession(): RtcAppSession | null {
  const storage = getHostAdapters().secureStorage;
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

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

export function saveAppSession(session: RtcAppSession): void {
  getHostAdapters().secureStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAppSession(): void {
  getHostAdapters().secureStorage?.removeItem(SESSION_STORAGE_KEY);
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
