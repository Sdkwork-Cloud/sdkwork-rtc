import { SdkworkBackendClient } from "sdkwork-rtc-backend-sdk-generated-typescript";
import type { AuthTokenManager } from "@sdkwork/sdk-common";

export interface RtcBackendClientOptions {
  tokenManager?: AuthTokenManager;
  authToken?: string;
  accessToken?: string;
  tenantId?: string;
  organizationId?: string;
  headers?: Record<string, string>;
}

export function createBackendRtcClient(
  baseUrl: string,
  tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  maybeOptions?: RtcBackendClientOptions,
): SdkworkBackendClient {
  const options =
    maybeOptions ??
    (tokenManagerOrOptions && "getAccessToken" in tokenManagerOrOptions
      ? { tokenManager: tokenManagerOrOptions }
      : (tokenManagerOrOptions as RtcBackendClientOptions | undefined));

  const client = new SdkworkBackendClient({
    baseUrl,
    tokenManager: options?.tokenManager,
    authToken: options?.authToken,
    accessToken: options?.accessToken,
    tenantId: options?.tenantId,
    organizationId: options?.organizationId,
    headers: options?.headers,
  });

  if (options?.authToken) {
    client.setAuthToken(options.authToken);
  }
  if (options?.accessToken) {
    client.setAccessToken(options.accessToken);
  }

  return client;
}
