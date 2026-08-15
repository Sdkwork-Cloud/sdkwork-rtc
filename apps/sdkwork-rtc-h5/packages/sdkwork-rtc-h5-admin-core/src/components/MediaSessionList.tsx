import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

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

const SESSION_STATUS_VALUES: RtcMediaSessionStatus[] = [
  "preparing",
  "active",
  "closing",
  "ended",
  "failed",
];

function sessionStatusLabel(status: RtcMediaSessionStatus, t: TFunction): string {
  switch (status) {
    case "preparing":
      return t("admin.rtc.sessions.status.preparing", "Preparing");
    case "active":
      return t("admin.rtc.sessions.status.active", "Active");
    case "closing":
      return t("admin.rtc.sessions.status.closing", "Closing");
    case "ended":
      return t("admin.rtc.sessions.status.ended", "Ended");
    case "failed":
      return t("admin.rtc.sessions.status.failed", "Failed");
    default:
      return status;
  }
}

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
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const filteredCount = sessions.length;

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const rows = onExportAll ? await onExportAll() : sessions;
      exportRowsToCsv(
        `media-sessions-export-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          t("admin.rtc.sessions.csv.id", "ID"),
          t("admin.rtc.sessions.csv.room", "Room"),
          t("admin.rtc.sessions.csv.mode", "Mode"),
          t("admin.rtc.sessions.csv.status", "Status"),
          t("admin.rtc.sessions.csv.owner", "Owner"),
          t("admin.rtc.sessions.csv.started", "Started"),
          t("admin.rtc.sessions.csv.ended", "Ended"),
          t("admin.rtc.sessions.csv.duration", "Duration"),
          t("admin.rtc.sessions.csv.participants", "Participants"),
        ],
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
  }, [onExportAll, sessions, t]);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>{t("admin.rtc.sessions.title", "Live Sessions")}</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onRefresh} disabled={loading || exporting}>
            {loading ? t("admin.rtc.loadingShort", "Loading...") : t("admin.rtc.refresh", "Refresh")}
          </button>
          <button type="button" onClick={() => void handleExportAll()} disabled={exporting || loading}>
            {exporting
              ? t("admin.rtc.exporting", "Exporting...")
              : t("admin.rtc.sessions.exportAll", "Export All")}
          </button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input
          type="search"
          placeholder={t("admin.rtc.sessions.filter.search", "Search by session ID or room ID...")}
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
          <option value="all">{t("admin.rtc.sessions.filter.allStatus", "All Status")}</option>
          {SESSION_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {sessionStatusLabel(status, t)}
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
          <option value="all">{t("admin.rtc.sessions.filter.allTime", "All Time")}</option>
          <option value="today">{t("admin.rtc.sessions.filter.today", "Today")}</option>
          <option value="week">{t("admin.rtc.sessions.filter.week", "Last 7 Days")}</option>
          <option value="month">{t("admin.rtc.sessions.filter.month", "Last 30 Days")}</option>
        </select>
        <button type="button" onClick={onResetFilter}>
          {t("admin.rtc.sessions.filter.clear", "Clear Filters")}
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.rtc.sessions.col.session", "Session")}</th>
              <th>{t("admin.rtc.sessions.col.room", "Room")}</th>
              <th>{t("admin.rtc.sessions.col.mode", "Mode")}</th>
              <th>{t("admin.rtc.sessions.col.status", "Status")}</th>
              <th>{t("admin.rtc.sessions.col.owner", "Owner")}</th>
              <th>{t("admin.rtc.sessions.col.started", "Started")}</th>
              <th>{t("admin.rtc.sessions.col.duration", "Duration")}</th>
              <th>{t("admin.rtc.sessions.col.participants", "Participants")}</th>
              <th>{t("admin.rtc.sessions.col.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-empty-state">
                  {loading
                    ? t("admin.rtc.sessions.emptyLoading", "Loading sessions...")
                    : t("admin.rtc.sessions.empty", "No media sessions found.")}
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
                      {sessionStatusLabel(session.status, t)}
                    </span>
                  </td>
                  <td>{session.ownerUserId}</td>
                  <td>{formatDateTime(session.startedAt)}</td>
                  <td>{formatDurationMs(session.durationMs)}</td>
                  <td>{session.participantCount ?? 0}</td>
                  <td>
                    <button className="admin-action-btn" onClick={() => onSelect(session)}>
                      {t("admin.rtc.view", "View")}
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
          {t("admin.rtc.sessions.footer", "{{count}} session(s) displayed", {
            count: filteredCount,
          })}
          {totalCount !== undefined
            ? t("admin.rtc.sessions.footerOf", " of {{total}}", { total: totalCount })
            : ""}
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
