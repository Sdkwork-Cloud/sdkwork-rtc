import type { SdkworkAppClient } from "@sdkwork/rtc-app-sdk";

import { createRtcAppSdkClient } from "./createAppSdkClient";
import {
  getRtcGlobalTokenManager,
  readRtcIamSessionTokens,
  toRtcAppSession,
} from "../session/iamSession";

let rtcAppSdkClient: SdkworkAppClient | null = null;
let rtcAppSdkClientApiBaseUrl: string | null = null;

export function resetRtcAppSdkClient(): void {
  rtcAppSdkClient = null;
  rtcAppSdkClientApiBaseUrl = null;
}

export function getRtcAppSdkClient(apiBaseUrl: string): SdkworkAppClient {
  if (rtcAppSdkClient && rtcAppSdkClientApiBaseUrl === apiBaseUrl) {
    return rtcAppSdkClient;
  }

  rtcAppSdkClient = createRtcAppSdkClient({
    apiBaseUrl,
    session: toRtcAppSession(readRtcIamSessionTokens()),
    tokenManager: getRtcGlobalTokenManager(),
    platform: "h5",
  });
  rtcAppSdkClientApiBaseUrl = apiBaseUrl;
  return rtcAppSdkClient;
}
