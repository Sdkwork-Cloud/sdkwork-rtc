import { createRtcAppSdkClient } from "@sdkwork/rtc-mp-core";
import type { SdkworkAppClient } from "sdkwork-rtc-app-sdk-generated-typescript";

import { loadAppSession } from "./appAuth";
import { resolveEnvironment } from "./environment";
import { getTokenManager } from "./tokenManager";

let appSdkClient: SdkworkAppClient | null = null;

export function initAppSdkClient(): SdkworkAppClient {
  const environment = resolveEnvironment();
  appSdkClient = createRtcAppSdkClient({
    apiBaseUrl: environment.apiBaseUrl,
    session: loadAppSession(),
    tokenManager: getTokenManager(),
    platform: "mp-weixin",
  });
  return appSdkClient;
}

export function getAppSdkClient(): SdkworkAppClient {
  return appSdkClient ?? initAppSdkClient();
}
