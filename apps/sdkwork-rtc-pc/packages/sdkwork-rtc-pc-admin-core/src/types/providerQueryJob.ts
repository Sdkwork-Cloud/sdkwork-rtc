import type {
  RtcProviderQueryJob,
  RtcProviderQuerySnapshot,
} from "@sdkwork/rtc-backend-sdk";

/** RTC provider query job admin view model — the generated SDK `RtcProviderQueryJob` (contract authority). */
export type ProviderQueryJob = RtcProviderQueryJob;

/** RTC provider query snapshot admin view model — the generated SDK `RtcProviderQuerySnapshot` (contract authority). */
export type ProviderQuerySnapshot = RtcProviderQuerySnapshot;

export interface ProviderQueryJobCreateCommand {
  provider: string;
  providerProfileId?: string | null;
  queryKind: ProviderQueryJob["queryKind"];
  roomId?: string | null;
  mediaSessionId?: string | null;
  providerSessionId?: string | null;
  cursor?: string | null;
}
