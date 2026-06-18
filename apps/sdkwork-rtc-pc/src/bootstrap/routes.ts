import { AdminRoutes } from "@sdkwork/rtc-pc-admin-shell";
import { createRtcAppRoutes } from "@sdkwork/rtc-pc-shell";

export function createRoutes() {
  return [...createRtcAppRoutes(), ...AdminRoutes().routes];
}
