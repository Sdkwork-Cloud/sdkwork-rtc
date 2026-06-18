import { AdminRoutes } from "@sdkwork/rtc-h5-admin-shell";
import { createRtcAppRoutes } from "@sdkwork/rtc-h5-shell";

export function createRoutes() {
  return [...createRtcAppRoutes(), ...AdminRoutes().routes];
}
