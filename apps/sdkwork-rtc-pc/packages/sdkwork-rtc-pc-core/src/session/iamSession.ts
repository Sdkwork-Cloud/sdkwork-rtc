import type { IamAppContext } from "@sdkwork/iam-contracts";
import {
  createTokenManager,
  type AuthTokenManager,
  type AuthTokens,
} from "@sdkwork/sdk-common";

import { DEFAULT_APP_SESSION, type RtcAppSession } from "./appSession";

export interface RtcIamSessionUser {
  displayName?: string;
  email?: string;
  id?: string;
  name?: string;
  nickname?: string;
  userId?: string;
  username?: string;
}

export interface RtcIamSession {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  sessionId?: string;
  context?: IamAppContext;
  user?: RtcIamSessionUser;
}

export const RTC_IAM_SESSION_STORAGE_KEY = "sdkwork.rtc.app.session:v1";
export const RTC_LEGACY_SESSION_STORAGE_KEY = "sdkwork.rtc.app.session";
export const RTC_IAM_SESSION_CHANGED_EVENT = "sdkwork-rtc-pc:auth-session-changed";

let rtcGlobalTokenManager: AuthTokenManager | null = null;

function getStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage;
}

function normalizeToken(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function dispatchRtcIamSessionChanged(session: RtcIamSession | null): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(RTC_IAM_SESSION_CHANGED_EVENT, {
      detail: { session },
    }),
  );
}

function readLegacySession(): RtcIamSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(RTC_LEGACY_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<RtcAppSession>;
    const accessToken = normalizeToken(parsed.accessToken);
    if (!accessToken) {
      return null;
    }
    return {
      accessToken,
      authToken: normalizeToken(parsed.authToken) ?? accessToken,
      context: {
        appId: "sdkwork-rtc-pc",
        authLevel: "password",
        dataScope: [],
        deploymentMode: "local",
        environment: "dev",
        organizationId: parsed.organizationId ?? DEFAULT_APP_SESSION.organizationId,
        permissionScope: [],
        sessionId: "legacy-session",
        tenantId: parsed.tenantId ?? DEFAULT_APP_SESSION.tenantId,
        userId: parsed.userId ?? DEFAULT_APP_SESSION.userId,
      },
    };
  } catch {
    return null;
  }
}

export function readRtcIamSessionTokens(): RtcIamSession | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(RTC_IAM_SESSION_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RtcIamSession;
      if (!normalizeToken(parsed.accessToken) && !normalizeToken(parsed.authToken)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  const legacy = readLegacySession();
  if (legacy) {
    applyRtcIamSessionTokens(legacy);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(RTC_LEGACY_SESSION_STORAGE_KEY);
    }
  }
  return legacy;
}

export function applyRtcIamSessionTokens(session: RtcIamSession): RtcIamSession {
  const storage = getStorage();
  const normalized: RtcIamSession = {
    ...(normalizeToken(session.accessToken) ? { accessToken: session.accessToken } : {}),
    ...(normalizeToken(session.authToken) ? { authToken: session.authToken } : {}),
    ...(normalizeToken(session.refreshToken) ? { refreshToken: session.refreshToken } : {}),
    ...(session.sessionId ? { sessionId: session.sessionId } : {}),
    ...(session.context ? { context: session.context } : {}),
    ...(session.user ? { user: session.user } : {}),
  };

  if (storage) {
    storage.setItem(RTC_IAM_SESSION_STORAGE_KEY, JSON.stringify(normalized));
  }

  const tokenManager = getRtcGlobalTokenManager();
  tokenManager.setTokens({
    ...(normalized.accessToken ? { accessToken: normalized.accessToken } : {}),
    ...(normalized.authToken ? { authToken: normalized.authToken } : {}),
    ...(normalized.refreshToken ? { refreshToken: normalized.refreshToken } : {}),
  });

  dispatchRtcIamSessionChanged(normalized);
  return normalized;
}

export function clearRtcIamSessionTokens(): void {
  const storage = getStorage();
  storage?.removeItem(RTC_IAM_SESSION_STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(RTC_LEGACY_SESSION_STORAGE_KEY);
  }
  getRtcGlobalTokenManager().clearTokens();
  dispatchRtcIamSessionChanged(null);
}

export function isRtcIamSessionAuthenticated(session: RtcIamSession | null): boolean {
  return Boolean(normalizeToken(session?.accessToken) && normalizeToken(session?.authToken));
}

export function toRtcAppSession(session: RtcIamSession | null): RtcAppSession | null {
  if (!isRtcIamSessionAuthenticated(session)) {
    return null;
  }
  return {
    accessToken: session!.accessToken!.trim(),
    authToken: session!.authToken!.trim(),
    tenantId: session!.context?.tenantId?.trim() || DEFAULT_APP_SESSION.tenantId,
    organizationId:
      session!.context?.organizationId?.trim() || DEFAULT_APP_SESSION.organizationId,
    userId:
      session!.context?.userId?.trim()
      || session!.user?.userId?.trim()
      || session!.user?.id?.trim()
      || DEFAULT_APP_SESSION.userId,
  };
}

export function getRtcGlobalTokenManager(): AuthTokenManager {
  if (!rtcGlobalTokenManager) {
    rtcGlobalTokenManager = createTokenManager();
    const snapshot = readRtcIamSessionTokens();
    if (snapshot) {
      rtcGlobalTokenManager.setTokens({
        ...(snapshot.accessToken ? { accessToken: snapshot.accessToken } : {}),
        ...(snapshot.authToken ? { authToken: snapshot.authToken } : {}),
        ...(snapshot.refreshToken ? { refreshToken: snapshot.refreshToken } : {}),
      } as AuthTokens);
    }
  }
  return rtcGlobalTokenManager;
}
