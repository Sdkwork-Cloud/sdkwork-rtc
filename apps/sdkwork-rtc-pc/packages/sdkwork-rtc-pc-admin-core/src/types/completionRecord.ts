/**
 * RTC media session completion record admin domain types — the generated SDK
 * `RtcMediaSessionCompletionRecord` schema family is the contract authority;
 * the admin surface re-exports it under the legacy local names.
 */

import type {
  RtcMediaSessionCompletionArtifactSummary,
  RtcMediaSessionCompletionParticipantSummary,
  RtcMediaSessionCompletionQualitySummary,
  RtcMediaSessionCompletionRecord as SdkRtcMediaSessionCompletionRecord,
  RtcMediaSessionCompletionRecordingSummary,
  RtcMediaSessionCompletionTrackSummary,
} from "@sdkwork/rtc-backend-sdk";

export type RtcCompletionParticipantSummary = RtcMediaSessionCompletionParticipantSummary;
export type RtcCompletionTrackSummary = RtcMediaSessionCompletionTrackSummary;
export type RtcCompletionQualitySummary = RtcMediaSessionCompletionQualitySummary;
export type RtcCompletionRecordingSummary = RtcMediaSessionCompletionRecordingSummary;
export type RtcCompletionArtifactSummary = RtcMediaSessionCompletionArtifactSummary;
export type RtcMediaSessionCompletionRecord = SdkRtcMediaSessionCompletionRecord;
