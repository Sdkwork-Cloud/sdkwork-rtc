import type { RtcProviderApplication } from "@sdkwork/rtc-backend-sdk";

/** RTC provider application admin view model — the generated SDK `RtcProviderApplication` (contract authority). */
export type ProviderApplication = RtcProviderApplication;

export interface ProviderApplicationCommand {
  code: string;
  name: string;
  status?: "active" | "disabled" | "archived";
  environment: string;
  region?: string;
  providerApplicationId: string;
  providerApplicationIdKind: string;
  accessEndpoint?: string;
  apiEndpoint?: string;
  apiHost?: string;
  apiVersion?: string;
  webhookCallbackUrl?: string;
  configSnapshot: Record<string, unknown>;
}
