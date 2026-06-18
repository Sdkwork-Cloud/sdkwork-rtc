import { createClient, type SdkworkAppClient } from "sdkwork-rtc-app-sdk-generated-typescript";
import type { AuthTokenManager } from "@sdkwork/sdk-common";

import { resolveAppSdkBaseUrl } from "../config/resolveAppSdkBaseUrl";
import { DEFAULT_APP_PERMISSION_SCOPE, type RtcAppSession } from "../session/appSession";

export interface CreateRtcAppSdkClientOptions {
  apiBaseUrl: string;
  session: RtcAppSession | null;
  tokenManager?: AuthTokenManager;
  platform?: string;
}

export function buildRtcAppSdkHeaders(session: RtcAppSession): Record<string, string> {
  return {
    "x-sdkwork-tenant-id": session.tenantId,
    "x-sdkwork-organization-id": session.organizationId,
    "x-sdkwork-user-id": session.userId,
    "x-sdkwork-actor-id": session.userId,
    "x-sdkwork-permission-scope": DEFAULT_APP_PERMISSION_SCOPE,
  };
}

export function createRtcAppSdkClient({
  apiBaseUrl,
  session,
  tokenManager,
  platform = "pc",
}: CreateRtcAppSdkClientOptions): SdkworkAppClient {
  return createClient({
    baseUrl: resolveAppSdkBaseUrl(apiBaseUrl),
    tokenManager,
    authToken: session?.authToken,
    accessToken: session?.accessToken,
    tenantId: session?.tenantId,
    organizationId: session?.organizationId,
    headers: session ? buildRtcAppSdkHeaders(session) : undefined,
    platform,
  });
}
