/**
 * RTC media artifact (recording file) admin domain types — mirror of the
 * backend `RtcMediaArtifact` / `RtcDriveReference` / `MediaResource` schemas.
 */

export type RtcArtifactKind = "recording" | "transcript" | "screen_share" | "snapshot" | "other";
export type RtcArtifactStatus = "pending" | "processing" | "ready" | "failed" | "deleted";

export interface RtcDriveReference {
  driveUri: string;
  spaceId: string;
  spaceType: "rtc";
  nodeId: string;
  nodeVersion?: string | null;
}

export type RtcMediaResourceKind =
  | "image"
  | "video"
  | "audio"
  | "voice"
  | "document"
  | "archive"
  | "model"
  | "other";

export type RtcMediaResourceSource =
  | "drive"
  | "external_url"
  | "data_url"
  | "provider_asset"
  | "generated";

export interface RtcMediaResource {
  id?: string | null;
  kind: RtcMediaResourceKind;
  source: RtcMediaResourceSource;
  url?: string | null;
  publicUrl?: string | null;
  uri?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  checksum?: {
    algorithm: "sha256" | "md5" | "etag";
    value: string;
  } | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface RtcMediaArtifact {
  id: string;
  tenantId: string;
  organizationId: string;
  mediaSessionId: string;
  ownerUserId: string;
  artifactKind: RtcArtifactKind;
  artifactStatus: RtcArtifactStatus;
  mediaRole?: string;
  providerProfileId?: string;
  providerArtifactId?: string;
  drive?: RtcDriveReference | null;
  resource?: RtcMediaResource | null;
  resourceHash?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: string;
  failureReason?: string;
  sourceProviderWebhookEventId?: string;
  sourceProviderQueryJobId?: string;
}

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
