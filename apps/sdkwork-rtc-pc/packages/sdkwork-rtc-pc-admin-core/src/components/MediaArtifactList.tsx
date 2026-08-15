import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

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

const ARTIFACT_STATUS_VALUES: RtcArtifactStatus[] = [
  "pending",
  "processing",
  "ready",
  "failed",
  "deleted",
];

function artifactStatusLabel(status: RtcArtifactStatus, t: TFunction): string {
  switch (status) {
    case "pending":
      return t("admin.rtc.artifacts.status.pending", "Pending");
    case "processing":
      return t("admin.rtc.artifacts.status.processing", "Processing");
    case "ready":
      return t("admin.rtc.artifacts.status.ready", "Ready");
    case "failed":
      return t("admin.rtc.artifacts.status.failed", "Failed");
    case "deleted":
      return t("admin.rtc.artifacts.status.deleted", "Deleted");
    default:
      return status;
  }
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
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const rows = onExportAll ? await onExportAll() : artifacts;
      exportRowsToCsv(
        `media-artifacts-export-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          t("admin.rtc.artifacts.csv.id", "ID"),
          t("admin.rtc.artifacts.csv.session", "Session"),
          t("admin.rtc.artifacts.csv.kind", "Kind"),
          t("admin.rtc.artifacts.csv.status", "Status"),
          t("admin.rtc.artifacts.csv.owner", "Owner"),
          t("admin.rtc.artifacts.csv.file", "File"),
          t("admin.rtc.artifacts.csv.started", "Started"),
          t("admin.rtc.artifacts.csv.duration", "Duration"),
        ],
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
  }, [artifacts, onExportAll, t]);

  return (
    <div className="admin-card admin-card-fill">
      <div className="admin-card-header">
        <h2>{t("admin.rtc.artifacts.title", "Recording Files")}</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onRefresh} disabled={loading || exporting}>
            {loading ? t("admin.rtc.loadingShort", "Loading...") : t("admin.rtc.refresh", "Refresh")}
          </button>
          <button type="button" onClick={() => void handleExportAll()} disabled={exporting || loading}>
            {exporting
              ? t("admin.rtc.exporting", "Exporting...")
              : t("admin.rtc.artifacts.exportAll", "Export All")}
          </button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input
          type="search"
          placeholder={t(
            "admin.rtc.artifacts.filter.search",
            "Search by artifact ID or session ID...",
          )}
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
          <option value="all">{t("admin.rtc.artifacts.filter.allStatus", "All Status")}</option>
          {ARTIFACT_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {artifactStatusLabel(status, t)}
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
          <option value="all">{t("admin.rtc.artifacts.filter.allTime", "All Time")}</option>
          <option value="today">{t("admin.rtc.artifacts.filter.today", "Today")}</option>
          <option value="week">{t("admin.rtc.artifacts.filter.week", "Last 7 Days")}</option>
          <option value="month">{t("admin.rtc.artifacts.filter.month", "Last 30 Days")}</option>
        </select>
        <button type="button" onClick={onResetFilter}>
          {t("admin.rtc.artifacts.filter.clear", "Clear Filters")}
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.rtc.artifacts.col.artifact", "Artifact")}</th>
              <th>{t("admin.rtc.artifacts.col.session", "Session")}</th>
              <th>{t("admin.rtc.artifacts.col.kind", "Kind")}</th>
              <th>{t("admin.rtc.artifacts.col.status", "Status")}</th>
              <th>{t("admin.rtc.artifacts.col.file", "File")}</th>
              <th>{t("admin.rtc.artifacts.col.drive", "Drive")}</th>
              <th>{t("admin.rtc.artifacts.col.started", "Started")}</th>
              <th>{t("admin.rtc.artifacts.col.duration", "Duration")}</th>
              <th>{t("admin.rtc.artifacts.col.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-empty-state">
                  {loading
                    ? t("admin.rtc.artifacts.emptyLoading", "Loading artifacts...")
                    : t("admin.rtc.artifacts.empty", "No media artifacts found.")}
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
                    <td>{artifactKindLabel(artifact.artifactKind, t)}</td>
                    <td>
                      <span className={`admin-badge admin-badge-status-${artifact.artifactStatus}`}>
                        {artifactStatusLabel(artifact.artifactStatus, t)}
                      </span>
                    </td>
                    <td title={artifact.resource?.fileName ?? undefined}>
                      {artifact.resource?.fileName ?? "-"}
                    </td>
                    <td className="admin-detail-mono" title={artifact.drive?.driveUri ?? undefined}>
                      {drive
                        ? t("admin.rtc.artifacts.node", "node {{id}}…", {
                            id: drive.nodeId?.slice(0, 12),
                          })
                        : "-"}
                    </td>
                    <td>{formatDateTime(artifact.startedAt)}</td>
                    <td>{formatDurationMs(artifact.durationMs)}</td>
                    <td>
                      <button className="admin-action-btn" onClick={() => onSelect(artifact)}>
                        {t("admin.rtc.view", "View")}
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
        <span>
          {t("admin.rtc.artifacts.footer", "{{count}} artifact(s) displayed", {
            count: artifacts.length,
          })}
        </span>
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
