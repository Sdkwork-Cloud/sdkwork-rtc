import {
  createTokenManager as createSdkworkTokenManager,
  type AuthTokenManager,
} from "@sdkwork/sdk-common";

import { setTokenManager } from "./tokenManager";

export interface RtcAdminSession {
  accessToken: string;
  authToken: string;
  tenantId: string;
  organizationId: string;
  userId: string;
}

export const RTC_ADMIN_SESSION_STORAGE_KEY = "sdkwork-rtc-h5:admin-session:v1";
const LEGACY_RTC_ADMIN_SESSION_STORAGE_KEY = "sdkwork.rtc.admin.session";
export const DEFAULT_ADMIN_PERMISSION_SCOPE = "rtc.*";

export const DEFAULT_ADMIN_SESSION: RtcAdminSession = {
  accessToken: "",
  authToken: "",
  tenantId: "100001",
  organizationId: "default",
  userId: "1",
};

function parseStoredAdminSession(raw: string): RtcAdminSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<RtcAdminSession>;
    if (!parsed.accessToken?.trim()) {
      return null;
    }
    return {
      accessToken: parsed.accessToken.trim(),
      authToken: parsed.authToken?.trim() || parsed.accessToken.trim(),
      tenantId: parsed.tenantId?.trim() || DEFAULT_ADMIN_SESSION.tenantId,
      organizationId: parsed.organizationId?.trim() || DEFAULT_ADMIN_SESSION.organizationId,
      userId: parsed.userId?.trim() || DEFAULT_ADMIN_SESSION.userId,
    };
  } catch {
    return null;
  }
}

function migrateLegacyAdminSession(): RtcAdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(LEGACY_RTC_ADMIN_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const session = parseStoredAdminSession(raw);
  window.sessionStorage.removeItem(LEGACY_RTC_ADMIN_SESSION_STORAGE_KEY);
  if (!session) {
    return null;
  }
  saveAdminSession(session);
  return session;
}

export function loadAdminSession(): RtcAdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const legacyRaw = window.sessionStorage.getItem(RTC_ADMIN_SESSION_STORAGE_KEY);
  const raw = window.localStorage.getItem(RTC_ADMIN_SESSION_STORAGE_KEY) ?? legacyRaw;
  if (legacyRaw && !window.localStorage.getItem(RTC_ADMIN_SESSION_STORAGE_KEY)) {
    window.localStorage.setItem(RTC_ADMIN_SESSION_STORAGE_KEY, legacyRaw);
    window.sessionStorage.removeItem(RTC_ADMIN_SESSION_STORAGE_KEY);
  }
  if (raw) {
    return parseStoredAdminSession(raw);
  }

  return migrateLegacyAdminSession();
}

export function saveAdminSession(session: RtcAdminSession): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(RTC_ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.sessionStorage.removeItem(RTC_ADMIN_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_RTC_ADMIN_SESSION_STORAGE_KEY);
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(RTC_ADMIN_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(RTC_ADMIN_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_RTC_ADMIN_SESSION_STORAGE_KEY);
}

export function buildAdminSdkHeaders(session: RtcAdminSession): Record<string, string> {
  return {
    "x-sdkwork-tenant-id": session.tenantId,
    "x-sdkwork-organization-id": session.organizationId,
    "x-sdkwork-user-id": session.userId,
    "x-sdkwork-actor-id": session.userId,
    "x-sdkwork-permission-scope": DEFAULT_ADMIN_PERMISSION_SCOPE,
  };
}

export function createAdminTokenManager(session: RtcAdminSession): AuthTokenManager {
  const manager = createSdkworkTokenManager();
  manager.setTokens?.({
    accessToken: session.accessToken,
    authToken: session.authToken,
  });
  return manager;
}

export function bootstrapAdminAuth(): RtcAdminSession | null {
  const session = loadAdminSession();
  if (!session) {
    return null;
  }
  setTokenManager(createAdminTokenManager(session));
  return session;
}
