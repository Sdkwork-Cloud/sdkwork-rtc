import { useCallback, useMemo, useState } from "react";

import type {
  MediaSessionListParams,
  RtcMediaSession,
  RtcMediaSessionStatus,
} from "../types/mediaSession";
import { exportRowsToCsv, formatDateTime, formatDurationMs } from "../utils/format";

/**
 * Media session (实时会话) list — status/date filtering, search, pagination
 * and CSV export. Sessions are the live "call records" of the RTC center.
 */

export interface MediaSessionListProps {
  sessions: RtcMediaSession[];
  loading?: boolean;
  totalCount?: number;
  filter: MediaSessionFilterState;
  onChangeFilter: (filter: MediaSessionFilterState) => void;
  onResetFilter: () => void;
  onSelect: (session: RtcMediaSession) => void;
  onRefresh: () => void;
  onExportAll?: () => Promise<RtcMediaSession[]>;
}

export interface MediaSessionFilterState {
  search: string;
  status: "all" | RtcMediaSessionStatus;
  dateRange: "all" | "today" | "week" | "month";
}

export const DEFAULT_MEDIA_SESSION_FILTER: MediaSessionFilterState = {
  search: "",
  status: "all",
  dateRange: "all",
};

const SESSION_STATUS_LABELS: Record<RtcMediaSessionStatus, string> = {
  preparing: "Preparing",
  active: "Active",
  closing: "Closing",
  ended: "Ended",
  failed: "Failed",
};

export function mediaSessionDateRangeCreatedAfter(
  dateRange: MediaSessionFilterState["dateRange"],
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

export function MediaSessionList({
  sessions,
  loading,
  totalCount,
  filter,
  onChangeFilter,
  onResetFilter,
  onSelect,
  onRefresh,
  onExportAll,
}: MediaSessionListProps) {
  const [exporting, setExporting] = useState(false);

  const filteredCount = sessions.length;

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const rows = onExportAll ? await onExportAll() : sessions;
      exportRowsToCsv(
        `media-sessions-export-${new Date().toISOString().slice(0, 10)}.csv`,
        ["ID", "Room", "Mode", "Status", "Owner", "Started", "Ended", "Duration", "Participants"],
        rows.map((session) => [
          session.id,
          session.roomId,
          session.mediaMode,
          session.status,
          session.ownerUserId,
          session.startedAt ?? "",
          session.endedAt ?? "",
          session.durationMs ?? "",
          String(session.participantCount ?? ""),
        ]),
      );
    } finally {
      setExporting(false);
    }
  }, [onExportAll, sessions]);

  const statusOptions = useMemo(() => Object.keys(SESSION_STATUS_LABELS) as RtcMediaSessionStatus[], []);

  return (
    <div className="admin-card admin-card-fill">
      <div className="admin-card-header">
        <h2>实时会话</h2>
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
          placeholder="Search by session ID or room ID..."
          value={filter.search}
          onChange={(event) => onChangeFilter({ ...filter, search: event.target.value })}
        />
        <select
          value={filter.status}
          onChange={(event) =>
            onChangeFilter({
              ...filter,
              status: event.target.value as MediaSessionFilterState["status"],
            })
          }
        >
          <option value="all">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {SESSION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          value={filter.dateRange}
          onChange={(event) =>
            onChangeFilter({
              ...filter,
              dateRange: event.target.value as MediaSessionFilterState["dateRange"],
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
              <th>Session</th>
              <th>Room</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Participants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-empty-state">
                  {loading ? "Loading sessions..." : "No media sessions found."}
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id}>
                  <td className="admin-cell-primary">
                    <button className="admin-link" onClick={() => onSelect(session)}>
                      {session.id}
                    </button>
                  </td>
                  <td>{session.roomId}</td>
                  <td>
                    <span className={`admin-badge admin-badge-mode-${session.mediaMode}`}>
                      {session.mediaMode}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge-status-${session.status}`}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </span>
                  </td>
                  <td>{session.ownerUserId}</td>
                  <td>{formatDateTime(session.startedAt)}</td>
                  <td>{formatDurationMs(session.durationMs)}</td>
                  <td>{session.participantCount ?? 0}</td>
                  <td>
                    <button className="admin-action-btn" onClick={() => onSelect(session)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-list-footer">
        <span>
          {filteredCount} session(s) displayed{totalCount !== undefined ? ` of ${totalCount}` : ""}
        </span>
      </div>
    </div>
  );
}

export function buildMediaSessionListParams(filter: MediaSessionFilterState): Pick<
  MediaSessionListParams,
  "search" | "status" | "createdAfter"
> {
  return {
    search: filter.search.trim() || undefined,
    status: filter.status === "all" ? undefined : filter.status,
    createdAfter: mediaSessionDateRangeCreatedAfter(filter.dateRange),
  };
}
