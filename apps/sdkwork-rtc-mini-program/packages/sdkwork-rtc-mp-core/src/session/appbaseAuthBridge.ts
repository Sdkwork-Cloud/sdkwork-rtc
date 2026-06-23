import type { RtcAppSession } from "./appSession";

const CALLBACK_KEYS = {
  accessToken: ["accessToken", "access_token"],
  authToken: ["authToken", "auth_token", "token"],
  tenantId: ["tenantId", "tenant_id", "x-sdkwork-tenant-id"],
  organizationId: ["organizationId", "organization_id", "x-sdkwork-organization-id"],
  userId: ["userId", "user_id", "x-sdkwork-user-id", "actorId", "actor_id"],
} as const;

function readParam(params: URLSearchParams, keys: readonly string[]): string {
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

export function buildAppbaseLoginUrl(loginUrl: string, returnUrl: string): string {
  const target = new URL(loginUrl, window.location.origin);
  target.searchParams.set("returnUrl", returnUrl);
  return target.toString();
}

export function parseAppbaseCallbackFromQuery(
  query: Record<string, string | undefined>,
): RtcAppSession | null {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }
  return parseAppbaseCallbackFromSearchParams(params);
}

function parseAppbaseCallbackFromSearchParams(
  params: URLSearchParams,
): RtcAppSession | null {
  const accessToken = readParam(params, CALLBACK_KEYS.accessToken);
  if (!accessToken) {
    return null;
  }

  const authToken = readParam(params, CALLBACK_KEYS.authToken) || accessToken;
  const tenantId = readParam(params, CALLBACK_KEYS.tenantId);
  const organizationId = readParam(params, CALLBACK_KEYS.organizationId);
  const userId = readParam(params, CALLBACK_KEYS.userId);
  if (!tenantId || !organizationId || !userId) {
    return null;
  }

  return {
    accessToken,
    authToken,
    tenantId,
    organizationId,
    userId,
  };
}

export function parseAppbaseCallbackSession(
  search = window.location.search,
  hash = window.location.hash,
): RtcAppSession | null {
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash.replace(/^#/, "");
  const params = new URLSearchParams(search);
  for (const [key, value] of new URLSearchParams(hashQuery)) {
    if (!params.has(key)) {
      params.set(key, value);
    }
  }
  return parseAppbaseCallbackFromSearchParams(params);
}

export function stripAppbaseCallbackFromLocation(): void {
  const url = new URL(window.location.href);
  for (const key of [
    ...CALLBACK_KEYS.accessToken,
    ...CALLBACK_KEYS.authToken,
    ...CALLBACK_KEYS.tenantId,
    ...CALLBACK_KEYS.organizationId,
    ...CALLBACK_KEYS.userId,
  ]) {
    url.searchParams.delete(key);
  }

  if (url.hash.includes("?")) {
    const [hashPath = "", hashQuery = ""] = url.hash.split("?");
    const hashParams = new URLSearchParams(hashQuery);
    for (const key of [
      ...CALLBACK_KEYS.accessToken,
      ...CALLBACK_KEYS.authToken,
      ...CALLBACK_KEYS.tenantId,
      ...CALLBACK_KEYS.organizationId,
      ...CALLBACK_KEYS.userId,
    ]) {
      hashParams.delete(key);
    }
    const nextHashQuery = hashParams.toString();
    url.hash = nextHashQuery ? `${hashPath}?${nextHashQuery}` : hashPath;
  }

  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}
