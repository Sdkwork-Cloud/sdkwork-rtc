import type { SdkworkAppClient } from "sdkwork-rtc-app-sdk-generated-typescript";

import { initAppSdkClient } from "./appClient";
import { resolveEnvironment } from "./environment";

export interface RtcSdkClients {
  apiBaseUrl: string;
  backendApiBaseUrl: string;
  app: SdkworkAppClient;
}

export function bootstrapSdkClients(): RtcSdkClients {
  const environment = resolveEnvironment();
  return {
    apiBaseUrl: environment.apiBaseUrl,
    backendApiBaseUrl: environment.backendApiBaseUrl,
    app: initAppSdkClient(),
  };
}

export { getAppSdkClient };
