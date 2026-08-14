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

const ARTIFACT_KIND_LABELS: Record<string, string> = {
  recording: "Recording",
  transcript: "Transcript",
  screen_share: "Screen Share",
  snapshot: "Snapshot",
  other: "Other",
};

export function MediaArtifactDetailPanel({ artifact, onBack }: MediaArtifactDetailPanelProps) {
  const drive = parseDriveUri(artifact.drive?.driveUri);
  const resource = artifact.resource;

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>记录文件详情</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-item">
          <span className="admin-detail-label">Artifact ID</span>
          <span className="admin-detail-value admin-detail-mono">{artifact.id}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Media Session</span>
          <span className="admin-detail-value">{artifact.mediaSessionId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Kind</span>
          <span className="admin-detail-value">
            {ARTIFACT_KIND_LABELS[artifact.artifactKind] ?? artifact.artifactKind}
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Status</span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-status-${artifact.artifactStatus}`}>
              {artifact.artifactStatus}
            </span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Owner</span>
          <span className="admin-detail-value">{artifact.ownerUserId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Provider Artifact</span>
          <span className="admin-detail-value">{artifact.providerArtifactId ?? "-"}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Started</span>
          <span className="admin-detail-value">{formatDateTime(artifact.startedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Ended</span>
          <span className="admin-detail-value">{formatDateTime(artifact.endedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Duration</span>
          <span className="admin-detail-value">{formatDurationMs(artifact.durationMs)}</span>
        </div>
        {artifact.failureReason && (
          <div className="admin-detail-item">
            <span className="admin-detail-label">Failure Reason</span>
            <span className="admin-detail-value">{artifact.failureReason}</span>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>Drive 引用</h3>
        {artifact.drive ? (
          <div className="admin-detail-grid admin-detail-grid-compact">
            <div className="admin-detail-item admin-detail-item-wide">
              <span className="admin-detail-label">Drive URI</span>
              <span className="admin-detail-value admin-detail-mono">{artifact.drive.driveUri}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Space</span>
              <span className="admin-detail-value">{drive?.spaceId ?? artifact.drive.spaceId}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Node</span>
              <span className="admin-detail-value admin-detail-mono">
                {drive?.nodeId ?? artifact.drive.nodeId}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Node Version</span>
              <span className="admin-detail-value">{artifact.drive.nodeVersion ?? "-"}</span>
            </div>
          </div>
        ) : (
          <p className="admin-muted">No Drive reference attached yet.</p>
        )}
      </div>

      <div className="admin-section">
        <h3>媒体资源</h3>
        {resource ? (
          <>
            <div className="admin-detail-grid admin-detail-grid-compact">
              <div className="admin-detail-item admin-detail-item-wide">
                <span className="admin-detail-label">File Name</span>
                <span className="admin-detail-value">{resource.fileName ?? "-"}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Kind</span>
                <span className="admin-detail-value">{resource.kind}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Source</span>
                <span className="admin-detail-value">{resource.source}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">MIME</span>
                <span className="admin-detail-value">{resource.mimeType ?? "-"}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Size</span>
                <span className="admin-detail-value">
                  {formatBytes(resource.sizeBytes != null ? Number(resource.sizeBytes) : undefined)}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Media Duration</span>
                <span className="admin-detail-value">
                  {resource.durationSeconds != null ? `${resource.durationSeconds}s` : "-"}
                </span>
              </div>
              {resource.checksum && (
                <div className="admin-detail-item admin-detail-item-wide">
                  <span className="admin-detail-label">Checksum ({resource.checksum.algorithm})</span>
                  <span className="admin-detail-value admin-detail-mono">
                    {resource.checksum.value}
                  </span>
                </div>
              )}
            </div>
            {resource.publicUrl && (
              <div className="admin-resource-link">
                <a href={resource.publicUrl} target="_blank" rel="noreferrer">
                  打开文件
                </a>
              </div>
            )}
          </>
        ) : (
          <p className="admin-muted">No media resource metadata attached.</p>
        )}
      </div>
    </div>
  );
}
