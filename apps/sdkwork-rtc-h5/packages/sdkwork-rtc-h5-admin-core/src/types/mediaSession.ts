/**
 * RTC media session admin domain types — the generated SDK `RtcMediaSession`
 * family is the contract authority; the admin surface re-exports it and adds
 * list/filter types only.
 */

import type {
  RtcMediaParticipant as SdkRtcMediaParticipant,
  RtcMediaSession as SdkRtcMediaSession,
} from "@sdkwork/rtc-backend-sdk";

export type RtcMediaMode = "audio" | "video" | "live";
export type RtcMediaSessionStatus = "preparing" | "active" | "closing" | "ended" | "failed";
export type RtcMediaSessionEndSource =
  | "manual_close"
  | "provider_webhook"
  | "active_provider_query"
  | "provider_state_sync"
  | "timeout"
  | "system_reconcile"
  | "unknown";

export type RtcMediaParticipant = SdkRtcMediaParticipant;
export type RtcMediaSession = SdkRtcMediaSession;

export interface MediaSessionListParams {
  search?: string;
  status?: RtcMediaSessionStatus;
  ownerUserId?: string;
  createdAfter?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface MediaSessionListResponse {
  items: RtcMediaSession[];
  nextCursor?: string;
}
