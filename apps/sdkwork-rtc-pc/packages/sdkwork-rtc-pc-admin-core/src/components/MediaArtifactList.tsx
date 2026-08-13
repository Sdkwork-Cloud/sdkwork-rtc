import { useCallback, useState } from "react";

import type {
  MediaArtifactListParams,
  RtcArtifactStatus,
  RtcMediaArtifact,
} from "../types/mediaArtifact";
import { parseDriveUri } from "../types/mediaArtifact";
import { exportRowsToCsv, formatDateTime, formatDurationMs } from "../utils/format";

/**
 * Media artifact (通话记录文件) list — kind/status filtering, search,
 * pagination and CSV export. Artifacts are the Drive-backed recording files.
 */

export interface MediaArtifactFilterState {
  search: string;
  status: "all" | RtcArtifactStatus;
  dateRange: "all" | "today" | "week" | "month";
}

export const DEFAULT_MEDIA_ARTIFACT_FILTER: MediaArtifactFilterState = {
  search: "",
  status: "all",
  dateRange: "all",
};

const ARTIFACT_STATUS_LABELS: Record<RtcArtifactStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  deleted: "Deleted",
};

const ARTIFACT_KIND_LABELS: Record<string, string> = {
  recording: "Recording",
  transcript: "Transcript",
  screen_share: "Screen Share",
  snapshot: "Snapshot",
  other: "Other",
};

export function mediaArtifactDateRangeCreatedAfter(
  dateRange: MediaArtifactFilterState["dateRange"],
): string | undefined {
  if (dateRange === "all") {
    return undefined;
  }
  const now = new Date();
  const start = new Date(now);
  if (dateRange === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (dateRange === "week") {
    start.setDate(now.getDate() - 7);
  } else {
    start.setMonth(now.getMonth() - 1);
  }
  return start.toISOString();
}

export interface MediaArtifactListProps {
  artifacts: RtcMediaArtifact[];
  loading?: boolean;
  filter: MediaArtifactFilterState;
  onChangeFilter: (filter: MediaArtifactFilterState) => void;
  onResetFilter: () => void;
  onSelect: (artifact: RtcMediaArtifact) => void;
  onRefresh: () => void;
  onExportAll?: () => Promise<RtcMediaArtifact[]>;
}

export function MediaArtifactList({
  artifacts,
  loading,
  filter,
  onChangeFilter,
  onResetFilter,
  onSelect,
  onRefresh,
  onExportAll,
}: MediaArtifactListProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const rows = onExportAll ? await onExportAll() : artifacts;
      exportRowsToCsv(
        `media-artifacts-export-${new Date().toISOString().slice(0, 10)}.csv`,
        ["ID", "Session", "Kind", "Status", "Owner", "File", "Started", "Duration"],
        rows.map((artifact) => [
          artifact.id,
          artifact.mediaSessionId,
          artifact.artifactKind,
          artifact.artifactStatus,
          artifact.ownerUserId,
          artifact.resource?.fileName ?? artifact.drive?.nodeId ?? "",
          artifact.startedAt ?? "",
          artifact.durationMs ?? "",
        ]),
      );
    } finally {
      setExporting(false);
    }
  }, [artifacts, onExportAll]);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>通话记录文件</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onRefresh} disabled={loading || exporting}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button type="button" onClick={() => void handleExportAll()} disabled={exporting || loading}>
            {exporting ? "Exporting..." : "Export All"}
          </button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input
          type="search"
          placeholder="Search by artifact ID or session ID..."
          value={filter.search}
          onChange={(event) => onChangeFilter({ ...filter, search: event.target.value })}
        />
        <select
          value={filter.status}
          onChange={(event) =>
            onChangeFilter({
              ...filter,
              status: event.target.value as MediaArtifactFilterState["status"],
            })
          }
        >
          <option value="all">All Status</option>
          {Object.entries(ARTIFACT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filter.dateRange}
          onChange={(event) =>
            onChangeFilter({
              ...filter,
              dateRange: event.target.value as MediaArtifactFilterState["dateRange"],
            })
          }
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
        <button type="button" onClick={onResetFilter}>
          Clear Filters
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Artifact</th>
              <th>Session</th>
              <th>Kind</th>
              <th>Status</th>
              <th>File</th>
              <th>Drive</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-empty-state">
                  {loading ? "Loading artifacts..." : "No media artifacts found."}
                </td>
              </tr>
            ) : (
              artifacts.map((artifact) => {
                const drive = parseDriveUri(artifact.drive?.driveUri);
                return (
                  <tr key={artifact.id}>
                    <td className="admin-cell-primary">
                      <button className="admin-link" onClick={() => onSelect(artifact)}>
                        {artifact.id}
                      </button>
                    </td>
                    <td>{artifact.mediaSessionId}</td>
                    <td>{ARTIFACT_KIND_LABELS[artifact.artifactKind] ?? artifact.artifactKind}</td>
                    <td>
                      <span className={`admin-badge admin-badge-status-${artifact.artifactStatus}`}>
                        {ARTIFACT_STATUS_LABELS[artifact.artifactStatus]}
                      </span>
                    </td>
                    <td title={artifact.resource?.fileName ?? undefined}>
                      {artifact.resource?.fileName ?? "-"}
                    </td>
                    <td className="admin-detail-mono" title={artifact.drive?.driveUri ?? undefined}>
                      {drive ? `node ${drive.nodeId?.slice(0, 12)}…` : "-"}
                    </td>
                    <td>{formatDateTime(artifact.startedAt)}</td>
                    <td>{formatDurationMs(artifact.durationMs)}</td>
                    <td>
                      <button className="admin-action-btn" onClick={() => onSelect(artifact)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-list-footer">
        <span>{artifacts.length} artifact(s) displayed</span>
      </div>
    </div>
  );
}

export function buildMediaArtifactListParams(
  filter: MediaArtifactFilterState,
): Pick<MediaArtifactListParams, "search" | "status" | "createdAfter"> {
  return {
    search: filter.search.trim() || undefined,
    status: filter.status === "all" ? undefined : filter.status,
    createdAfter: mediaArtifactDateRangeCreatedAfter(filter.dateRange),
  };
}
