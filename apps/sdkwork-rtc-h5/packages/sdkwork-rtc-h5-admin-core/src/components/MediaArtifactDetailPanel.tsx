import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import type { RtcMediaArtifact } from "../types/mediaArtifact";
import { parseDriveUri } from "../types/mediaArtifact";
import { formatBytes, formatDateTime, formatDurationMs } from "../utils/format";

/**
 * Media artifact detail — artifact facts, Drive reference, media resource
 * metadata and checksum. Recording files are Drive-backed by contract.
 */

export interface MediaArtifactDetailPanelProps {
  artifact: RtcMediaArtifact;
  onBack: () => void;
}

function artifactKindLabel(kind: string, t: TFunction): string {
  switch (kind) {
    case "recording":
      return t("admin.rtc.artifacts.kind.recording", "Recording");
    case "transcript":
      return t("admin.rtc.artifacts.kind.transcript", "Transcript");
    case "screen_share":
      return t("admin.rtc.artifacts.kind.screenShare", "Screen Share");
    case "snapshot":
      return t("admin.rtc.artifacts.kind.snapshot", "Snapshot");
    case "other":
      return t("admin.rtc.artifacts.kind.other", "Other");
    default:
      return kind;
  }
}

export function MediaArtifactDetailPanel({ artifact, onBack }: MediaArtifactDetailPanelProps) {
  const { t } = useTranslation();
  const drive = parseDriveUri(artifact.drive?.driveUri);
  const resource = artifact.resource;

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>{t("admin.rtc.artifactDetail.title", "Artifact Details")}</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onBack}>
            {t("admin.rtc.back", "Back")}
          </button>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.artifactDetail.col.artifactId", "Artifact ID")}
          </span>
          <span className="admin-detail-value admin-detail-mono">{artifact.id}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.artifactDetail.col.mediaSession", "Media Session")}
          </span>
          <span className="admin-detail-value">{artifact.mediaSessionId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.artifactDetail.col.kind", "Kind")}</span>
          <span className="admin-detail-value">
            {artifactKindLabel(artifact.artifactKind, t)}
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.artifactDetail.col.status", "Status")}</span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-status-${artifact.artifactStatus}`}>
              {artifact.artifactStatus}
            </span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.artifactDetail.col.owner", "Owner")}</span>
          <span className="admin-detail-value">{artifact.ownerUserId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.artifactDetail.col.providerArtifact", "Provider Artifact")}
          </span>
          <span className="admin-detail-value">{artifact.providerArtifactId ?? "-"}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.artifactDetail.col.started", "Started")}
          </span>
          <span className="admin-detail-value">{formatDateTime(artifact.startedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.artifactDetail.col.ended", "Ended")}</span>
          <span className="admin-detail-value">{formatDateTime(artifact.endedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.artifactDetail.col.duration", "Duration")}
          </span>
          <span className="admin-detail-value">{formatDurationMs(artifact.durationMs)}</span>
        </div>
        {artifact.failureReason && (
          <div className="admin-detail-item">
            <span className="admin-detail-label">
              {t("admin.rtc.artifactDetail.col.failureReason", "Failure Reason")}
            </span>
            <span className="admin-detail-value">{artifact.failureReason}</span>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>{t("admin.rtc.artifactDetail.driveTitle", "Drive Reference")}</h3>
        {artifact.drive ? (
          <div className="admin-detail-grid admin-detail-grid-compact">
            <div className="admin-detail-item admin-detail-item-wide">
              <span className="admin-detail-label">
                {t("admin.rtc.artifactDetail.col.driveUri", "Drive URI")}
              </span>
              <span className="admin-detail-value admin-detail-mono">{artifact.drive.driveUri}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.artifactDetail.col.space", "Space")}
              </span>
              <span className="admin-detail-value">{drive?.spaceId ?? artifact.drive.spaceId}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.artifactDetail.col.node", "Node")}
              </span>
              <span className="admin-detail-value admin-detail-mono">
                {drive?.nodeId ?? artifact.drive.nodeId}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.artifactDetail.col.nodeVersion", "Node Version")}
              </span>
              <span className="admin-detail-value">{artifact.drive.nodeVersion ?? "-"}</span>
            </div>
          </div>
        ) : (
          <p className="admin-muted">
            {t("admin.rtc.artifactDetail.noDrive", "No Drive reference attached yet.")}
          </p>
        )}
      </div>

      <div className="admin-section">
        <h3>{t("admin.rtc.artifactDetail.resourceTitle", "Media Resource")}</h3>
        {resource ? (
          <>
            <div className="admin-detail-grid admin-detail-grid-compact">
              <div className="admin-detail-item admin-detail-item-wide">
                <span className="admin-detail-label">
                  {t("admin.rtc.artifactDetail.col.fileName", "File Name")}
                </span>
                <span className="admin-detail-value">{resource.fileName ?? "-"}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.artifactDetail.col.kind", "Kind")}
                </span>
                <span className="admin-detail-value">{resource.kind}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.artifactDetail.col.source", "Source")}
                </span>
                <span className="admin-detail-value">{resource.source}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.artifactDetail.col.mime", "MIME")}
                </span>
                <span className="admin-detail-value">{resource.mimeType ?? "-"}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.artifactDetail.col.size", "Size")}
                </span>
                <span className="admin-detail-value">
                  {formatBytes(resource.sizeBytes != null ? Number(resource.sizeBytes) : undefined)}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.artifactDetail.col.mediaDuration", "Media Duration")}
                </span>
                <span className="admin-detail-value">
                  {resource.durationSeconds != null ? `${resource.durationSeconds}s` : "-"}
                </span>
              </div>
              {resource.checksum && (
                <div className="admin-detail-item admin-detail-item-wide">
                  <span className="admin-detail-label">
                    {t("admin.rtc.artifactDetail.checksum", "Checksum ({{algorithm}})", {
                      algorithm: resource.checksum.algorithm,
                    })}
                  </span>
                  <span className="admin-detail-value admin-detail-mono">
                    {resource.checksum.value}
                  </span>
                </div>
              )}
            </div>
            {resource.publicUrl && (
              <div className="admin-resource-link">
                <a href={resource.publicUrl} target="_blank" rel="noreferrer">
                  {t("admin.rtc.artifactDetail.openFile", "Open File")}
                </a>
              </div>
            )}
          </>
        ) : (
          <p className="admin-muted">
            {t("admin.rtc.artifactDetail.noResource", "No media resource metadata attached.")}
          </p>
        )}
      </div>
    </div>
  );
}
