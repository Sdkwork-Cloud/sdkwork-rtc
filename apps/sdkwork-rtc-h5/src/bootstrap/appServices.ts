import { createRtcAppServices, type RtcAppServices } from "@sdkwork/rtc-h5-rtc";

import { getAppSdkClient } from "./appClient";

export function createAppServices(): RtcAppServices {
  return createRtcAppServices(getAppSdkClient());
}
