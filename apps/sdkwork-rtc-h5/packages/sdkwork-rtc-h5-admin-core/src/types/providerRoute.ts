import type { RtcProviderRoute } from "@sdkwork/rtc-backend-sdk";

/** RTC provider route admin view model — the generated SDK `RtcProviderRoute` (contract authority). */
export type ProviderRoute = RtcProviderRoute;

export interface ProviderRouteCommand {
  providerProfileId: string;
  routeType: string;
  region?: string;
  priority: number;
  status?: "active" | "disabled";
}
