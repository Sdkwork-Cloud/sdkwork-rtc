/**
 * RTC media artifact (recording file) admin domain types — the generated SDK
 * `RtcMediaArtifact` / `RtcDriveReference` / `MediaResource` schemas are the
 * contract authority; the admin surface re-exports them and adds list/filter
 * types plus a drive URI helper.
 */

import type {
  MediaResource as SdkMediaResource,
  RtcDriveReference as SdkRtcDriveReference,
  RtcMediaArtifact as SdkRtcMediaArtifact,
} from "@sdkwork/rtc-backend-sdk";

export type RtcArtifactKind = "recording" | "transcript" | "screen_share" | "snapshot" | "other";
export type RtcArtifactStatus = "pending" | "processing" | "ready" | "failed" | "deleted";

export type RtcDriveReference = SdkRtcDriveReference;
export type RtcMediaResource = SdkMediaResource;
export type RtcMediaArtifact = SdkRtcMediaArtifact;

export interface MediaArtifactListParams {
  search?: string;
  status?: RtcArtifactStatus;
  createdAfter?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface MediaArtifactListResponse {
  items: RtcMediaArtifact[];
  nextCursor?: string;
}

export function parseDriveUri(driveUri: string | undefined): {
  spaceId?: string;
  nodeId?: string;
} | null {
  if (!driveUri) {
    return null;
  }
  const match = /^drive:\/\/spaces\/([^/]+)\/nodes\/([^/]+)$/u.exec(driveUri.trim());
  if (!match) {
    return null;
  }
  return { spaceId: match[1], nodeId: match[2] };
}
