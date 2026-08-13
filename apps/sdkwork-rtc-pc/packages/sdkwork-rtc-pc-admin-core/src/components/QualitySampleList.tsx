import { useCallback, useState } from "react";

import type { QualitySampleListParams, RtcQualitySample } from "../types/qualitySample";
import { exportRowsToCsv, formatDateTime, formatPercentRate } from "../utils/format";

/**
 * Quality sample (质量监控) list — latency/jitter/packet-loss/bitrate columns
 * with time filtering and CSV export.
 */

export interface QualitySampleFilterState {
  search: string;
  dateRange: "all" | "today" | "week" | "month";
}

export const DEFAULT_QUALITY_SAMPLE_FILTER: QualitySampleFilterState = {
  search: "",
  dateRange: "all",
};

export function qualitySampleDateRangeCreatedAfter(
  dateRange: QualitySampleFilterState["dateRange"],
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

export interface QualitySampleListProps {
  samples: RtcQualitySample[];
  loading?: boolean;
  filter: QualitySampleFilterState;
  onChangeFilter: (filter: QualitySampleFilterState) => void;
  onResetFilter: () => void;
  onRefresh: () => void;
  onExportAll?: () => Promise<RtcQualitySample[]>;
}

export function QualitySampleList({
  samples,
  loading,
  filter,
  onChangeFilter,
  onResetFilter,
  onRefresh,
  onExportAll,
}: QualitySampleListProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const rows = onExportAll ? await onExportAll() : samples;
      exportRowsToCsv(
        `quality-samples-export-${new Date().toISOString().slice(0, 10)}.csv`,
        ["ID", "Session", "Participant", "Latency (ms)", "Jitter (ms)", "Packet Loss", "Bitrate (kbps)", "Sampled At"],
        rows.map((sample) => [
          sample.id,
          sample.mediaSessionId,
          sample.participantId ?? "",
          sample.latencyMs != null ? String(sample.latencyMs) : "",
          sample.jitterMs != null ? String(sample.jitterMs) : "",
          sample.packetLossRate ?? "",
          sample.bitrateKbps != null ? String(sample.bitrateKbps) : "",
          sample.sampledAt ?? "",
        ]),
      );
    } finally {
      setExporting(false);
    }
  }, [onExportAll, samples]);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>质量监控</h2>
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
          placeholder="Search by sample ID or session ID..."
          value={filter.search}
          onChange={(event) => onChangeFilter({ ...filter, search: event.target.value })}
        />
        <select
          value={filter.dateRange}
          onChange={(event) =>
            onChangeFilter({
              ...filter,
              dateRange: event.target.value as QualitySampleFilterState["dateRange"],
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
              <th>Participant</th>
              <th>Latency</th>
              <th>Jitter</th>
              <th>Packet Loss</th>
              <th>Bitrate</th>
              <th>Sampled At</th>
            </tr>
          </thead>
          <tbody>
            {samples.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty-state">
                  {loading ? "Loading quality samples..." : "No quality samples found."}
                </td>
              </tr>
            ) : (
              samples.map((sample) => (
                <tr key={sample.id}>
                  <td className="admin-cell-primary">{sample.mediaSessionId}</td>
                  <td>{sample.participantId ?? "-"}</td>
                  <td>{sample.latencyMs != null ? `${sample.latencyMs}ms` : "-"}</td>
                  <td>{sample.jitterMs != null ? `${sample.jitterMs}ms` : "-"}</td>
                  <td>{formatPercentRate(sample.packetLossRate)}</td>
                  <td>{sample.bitrateKbps != null ? `${sample.bitrateKbps}kbps` : "-"}</td>
                  <td>{formatDateTime(sample.sampledAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-list-footer">
        <span>{samples.length} sample(s) displayed</span>
      </div>
    </div>
  );
}

export function buildQualitySampleListParams(
  filter: QualitySampleFilterState,
): Pick<QualitySampleListParams, "search" | "createdAfter"> {
  return {
    search: filter.search.trim() || undefined,
    createdAfter: qualitySampleDateRangeCreatedAfter(filter.dateRange),
  };
}
