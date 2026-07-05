import type { SdkworkAppClient } from "@sdkwork/rtc-app-sdk";

import { getAppSdkClient, initAppSdkClient } from "./appClient";
import { resolveEnvironment } from "./environment";
import { createTokenManager, getTokenManager, setTokenManager } from "./tokenManager";

export interface RtcSdkClients {
  apiBaseUrl: string;
  backendApiBaseUrl: string;
  app: SdkworkAppClient;
}

export function bootstrapSdkClients(): RtcSdkClients {
  const environment = resolveEnvironment();
  if (!getTokenManager()) {
    setTokenManager(
      createTokenManager(() => {
        if (typeof window === "undefined") {
          return undefined;
        }
        return window.sessionStorage.getItem("sdkwork.accessToken") ?? undefined;
      }),
    );
  }

  return {
    apiBaseUrl: environment.apiBaseUrl,
    backendApiBaseUrl: environment.backendApiBaseUrl,
    app: initAppSdkClient(),
  };
}

export { getAppSdkClient };
