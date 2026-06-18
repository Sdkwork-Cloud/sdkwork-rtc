import {
  createTokenManager,
  setTokenManager,
  type AuthTokenManager,
} from "./tokenManager";

export interface RtcAdminSession {
  accessToken: string;
  authToken: string;
  tenantId: string;
  organizationId: string;
  userId: string;
}

const SESSION_STORAGE_KEY = "sdkwork.rtc.admin.session";
export const DEFAULT_ADMIN_PERMISSION_SCOPE = "rtc.*";

export const DEFAULT_ADMIN_SESSION: RtcAdminSession = {
  accessToken: "dev-access-token",
  authToken: "dev-auth-token",
  tenantId: "default",
  organizationId: "default",
  userId: "admin",
};

export function loadAdminSession(): RtcAdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

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

export function saveAdminSession(session: RtcAdminSession): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
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
  return createTokenManager(() => session.accessToken);
}

export function bootstrapAdminAuth(): RtcAdminSession | null {
  const session = loadAdminSession();
  if (!session) {
    return null;
  }
  setTokenManager(createAdminTokenManager(session));
  return session;
}
