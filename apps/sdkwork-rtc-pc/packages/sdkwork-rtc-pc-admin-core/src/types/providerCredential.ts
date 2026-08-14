import type { RtcProviderCredential } from "@sdkwork/rtc-backend-sdk";

/** RTC provider credential admin view model — the generated SDK `RtcProviderCredential` (contract authority). */
export type ProviderCredential = RtcProviderCredential;

export interface ProviderCredentialCommand {
  credentialRole: string;
  credentialLabel: string;
  credentialRef: string;
  credentialFingerprint?: string;
  secretVersion?: string;
  status?: "active" | "pending" | "disabled";
  validFrom?: string;
  expiresAt?: string;
  rotationDueAt?: string;
}
