import { createRtcAppServices, type RtcAppServices } from "@sdkwork/rtc-pc-rtc";

import { getAppSdkClient } from "./appClient";

export function createAppServices(): RtcAppServices {
  return createRtcAppServices(getAppSdkClient());
}
