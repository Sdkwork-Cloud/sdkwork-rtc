/**
 * RTC quality sample admin domain type — the generated SDK `RtcQualitySample`
 * is the contract authority; the admin surface re-exports it and adds
 * list/filter types only.
 */

import type { RtcQualitySample as SdkRtcQualitySample } from "@sdkwork/rtc-backend-sdk";

export type RtcQualitySample = SdkRtcQualitySample;

export interface QualitySampleListParams {
  search?: string;
  createdAfter?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface QualitySampleListResponse {
  items: RtcQualitySample[];
  nextCursor?: string;
}
