import { createRtcAppServices, type RtcAppServices } from "@sdkwork/rtc-mp-rtc";

import { getAppSdkClient } from "./appClient";

let appServices: RtcAppServices | null = null;

export function createAppServices(): RtcAppServices {
  appServices = createRtcAppServices(getAppSdkClient());
  return appServices;
}

export function getAppServices(): RtcAppServices {
  return appServices ?? createAppServices();
}
