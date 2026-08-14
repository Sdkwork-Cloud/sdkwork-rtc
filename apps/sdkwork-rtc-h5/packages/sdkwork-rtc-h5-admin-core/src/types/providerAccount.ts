import type { RtcProviderAccount } from "@sdkwork/rtc-backend-sdk";

/** RTC provider account admin view model — the generated SDK `RtcProviderAccount` (contract authority). */
export type ProviderAccount = RtcProviderAccount;

export interface ProviderAccountCommand {
  provider: string;
  code: string;
  name: string;
  status?: "active" | "disabled" | "archived";
  environment: string;
  externalTenantId?: string;
  cloudAccountId?: string;
  projectId?: string;
  resourceGroupId?: string;
}
