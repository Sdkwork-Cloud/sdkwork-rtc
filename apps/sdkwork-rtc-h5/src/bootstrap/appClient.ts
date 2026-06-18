import { getRtcAppSdkClient } from "@sdkwork/rtc-h5-core";
import type { SdkworkAppClient } from "sdkwork-rtc-app-sdk-generated-typescript";

import { resolveEnvironment } from "./environment";

export function initAppSdkClient(): SdkworkAppClient {
  const environment = resolveEnvironment();
  return getRtcAppSdkClient(environment.apiBaseUrl);
}

export function getAppSdkClient(): SdkworkAppClient {
  return initAppSdkClient();
}
