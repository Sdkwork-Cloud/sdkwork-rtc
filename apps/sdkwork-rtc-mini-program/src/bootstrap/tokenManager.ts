import {
  createTokenManager as createSdkTokenManager,
  type AuthTokenManager,
} from "@sdkwork/sdk-common";

let activeTokenManager: AuthTokenManager | undefined;

export function setTokenManager(tokenManager: AuthTokenManager): void {
  activeTokenManager = tokenManager;
}

export function getTokenManager(): AuthTokenManager | undefined {
  return activeTokenManager;
}

export function createTokenManager(): AuthTokenManager {
  return createSdkTokenManager();
}

export type { AuthTokenManager };
