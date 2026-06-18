export interface AuthTokenManager {
  getAccessToken(): string | undefined;
  getRefreshToken?(): string | undefined;
  setTokens?(tokens: { accessToken?: string; refreshToken?: string }): void;
  clearTokens?(): void;
}

let activeTokenManager: AuthTokenManager | undefined;

export function setTokenManager(tokenManager: AuthTokenManager): void {
  activeTokenManager = tokenManager;
}

export function getTokenManager(): AuthTokenManager | undefined {
  return activeTokenManager;
}

export function createTokenManager(getAccessToken: () => string | undefined): AuthTokenManager {
  return {
    getAccessToken,
    getRefreshToken: () => undefined,
    setTokens: () => undefined,
    clearTokens: () => undefined,
  };
}
