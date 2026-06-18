import type { AuthTokenManager } from "@sdkwork/sdk-common";

let activeTokenManager: AuthTokenManager | null = null;

export function createTokenManager(getAccessToken: () => string): AuthTokenManager {
  return {
    getAccessToken,
    getAuthToken: getAccessToken,
  };
}

export function setTokenManager(tokenManager: AuthTokenManager): void {
  activeTokenManager = tokenManager;
}

export function getTokenManager(): AuthTokenManager | undefined {
  return activeTokenManager ?? undefined;
}
