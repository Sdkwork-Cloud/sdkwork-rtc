import { getRtcAppSdkClient } from "@sdkwork/rtc-pc-core";
import type { SdkworkAppClient } from "@sdkwork/rtc-app-sdk";

import { resolveEnvironment } from "./environment";

export function initAppSdkClient(): SdkworkAppClient {
  const environment = resolveEnvironment();
  return getRtcAppSdkClient(environment.apiBaseUrl);
}

export function getAppSdkClient(): SdkworkAppClient {
  return initAppSdkClient();
}
