import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const rows = onExportAll ? await onExportAll() : samples;
      exportRowsToCsv(
        `quality-samples-export-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          t("admin.rtc.quality.csv.id", "ID"),
          t("admin.rtc.quality.csv.session", "Session"),
          t("admin.rtc.quality.csv.participant", "Participant"),
          t("admin.rtc.quality.csv.latency", "Latency (ms)"),
          t("admin.rtc.quality.csv.jitter", "Jitter (ms)"),
          t("admin.rtc.quality.csv.packetLoss", "Packet Loss"),
          t("admin.rtc.quality.csv.bitrate", "Bitrate (kbps)"),
          t("admin.rtc.quality.csv.sampledAt", "Sampled At"),
        ],
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
  }, [onExportAll, samples, t]);

  return (
    <div className="admin-card admin-card-fill">
      <div className="admin-card-header">
        <h2>{t("admin.rtc.quality.title", "Quality Monitoring")}</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onRefresh} disabled={loading || exporting}>
            {loading ? t("admin.rtc.loadingShort", "Loading...") : t("admin.rtc.refresh", "Refresh")}
          </button>
          <button type="button" onClick={() => void handleExportAll()} disabled={exporting || loading}>
            {exporting
              ? t("admin.rtc.exporting", "Exporting...")
              : t("admin.rtc.quality.exportAll", "Export All")}
          </button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input
          type="search"
          placeholder={t(
            "admin.rtc.quality.filter.search",
            "Search by sample ID or session ID...",
          )}
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
          <option value="all">{t("admin.rtc.quality.filter.allTime", "All Time")}</option>
          <option value="today">{t("admin.rtc.quality.filter.today", "Today")}</option>
          <option value="week">{t("admin.rtc.quality.filter.week", "Last 7 Days")}</option>
          <option value="month">{t("admin.rtc.quality.filter.month", "Last 30 Days")}</option>
        </select>
        <button type="button" onClick={onResetFilter}>
          {t("admin.rtc.quality.filter.clear", "Clear Filters")}
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.rtc.quality.col.session", "Session")}</th>
              <th>{t("admin.rtc.quality.col.participant", "Participant")}</th>
              <th>{t("admin.rtc.quality.col.latency", "Latency")}</th>
              <th>{t("admin.rtc.quality.col.jitter", "Jitter")}</th>
              <th>{t("admin.rtc.quality.col.packetLoss", "Packet Loss")}</th>
              <th>{t("admin.rtc.quality.col.bitrate", "Bitrate")}</th>
              <th>{t("admin.rtc.quality.col.sampledAt", "Sampled At")}</th>
            </tr>
          </thead>
          <tbody>
            {samples.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty-state">
                  {loading
                    ? t("admin.rtc.quality.emptyLoading", "Loading quality samples...")
                    : t("admin.rtc.quality.empty", "No quality samples found.")}
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
        <span>
          {t("admin.rtc.quality.footer", "{{count}} sample(s) displayed", {
            count: samples.length,
          })}
        </span>
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
