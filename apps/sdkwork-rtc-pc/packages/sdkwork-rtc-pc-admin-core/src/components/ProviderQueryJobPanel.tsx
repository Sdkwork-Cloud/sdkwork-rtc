import { useTranslation } from "react-i18next";

import type { ProviderQueryJob, ProviderQuerySnapshot } from "../types/providerQueryJob";
import { formatDateTime } from "../utils/format";

interface Props {
  job: ProviderQueryJob | null;
  snapshots: ProviderQuerySnapshot[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

function queryKindLabel(kind: string, t: ReturnType<typeof useTranslation>["t"]): string {
  return t(`admin.rtc.queryJobs.kind.${kind}`, kind);
}

function targetKindLabel(kind: string, t: ReturnType<typeof useTranslation>["t"]): string {
  return t(`admin.rtc.queryJobs.targetKind.${kind}`, kind);
}

function statusLabel(status: string, t: ReturnType<typeof useTranslation>["t"]): string {
  return t(`admin.rtc.queryJobs.status.${status}`, status);
}

function snapshotKindLabel(kind: string, t: ReturnType<typeof useTranslation>["t"]): string {
  return t(`admin.rtc.queryJobs.snapshotKind.${kind}`, kind);
}

export function ProviderQueryJobPanel({ job, snapshots, onRefresh, refreshing }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-query-job-panel">
      {!job ? (
        <p className="admin-muted">
          {t(
            "admin.rtc.queryJobs.noJob",
            "No query job loaded. Create a job or enter a job ID to inspect results.",
          )}
        </p>
      ) : (
        <div className="query-job-detail">
          <div className="query-job-detail-header">
            <h3>{t("admin.rtc.queryJobs.jobTitle", "Query Job {{id}}", { id: job.id })}</h3>
            {onRefresh && (
              <button
                type="button"
                className="admin-action-btn"
                onClick={onRefresh}
                disabled={refreshing}
              >
                {refreshing
                  ? t("admin.rtc.queryJobs.refreshing", "Refreshing...")
                  : t("admin.rtc.queryJobs.refresh", "Refresh")}
              </button>
            )}
          </div>
          <dl>
            <dt>{t("admin.rtc.queryJobs.col.provider", "Provider")}</dt>
            <dd>{job.provider}</dd>
            <dt>{t("admin.rtc.queryJobs.col.queryKind", "Query Kind")}</dt>
            <dd>{queryKindLabel(job.queryKind, t)}</dd>
            <dt>{t("admin.rtc.queryJobs.col.status", "Status")}</dt>
            <dd>
              <span className={`admin-badge admin-badge-status-${job.status}`}>
                {statusLabel(job.status, t)}
              </span>
            </dd>
            <dt>{t("admin.rtc.queryJobs.col.target", "Target")}</dt>
            <dd>
              {t("admin.rtc.queryJobs.targetValue", "{{kind}}: {{id}}", {
                kind: targetKindLabel(job.targetKind, t),
                id: job.targetId,
              })}
            </dd>
            <dt>{t("admin.rtc.queryJobs.col.requestedAt", "Requested At")}</dt>
            <dd>{formatDateTime(job.requestedAt)}</dd>
            {job.completedAt && (
              <>
                <dt>{t("admin.rtc.queryJobs.col.completedAt", "Completed At")}</dt>
                <dd>{formatDateTime(job.completedAt)}</dd>
              </>
            )}
            {job.resultSnapshot && (
              <>
                <dt>{t("admin.rtc.queryJobs.col.resultSummary", "Result Summary")}</dt>
                <dd>
                  <pre className="query-job-payload">
                    {JSON.stringify(job.resultSnapshot, null, 2)}
                  </pre>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {job && snapshots.length === 0 ? (
        <p className="admin-muted">
          {t(
            "admin.rtc.queryJobs.noSnapshots",
            "No snapshots recorded for this job yet. Use Refresh to poll for updates.",
          )}
        </p>
      ) : (
        snapshots.length > 0 && (
          <div className="query-job-snapshots">
            <h3>
              {t("admin.rtc.queryJobs.snapshotsTitle", "Snapshots ({{count}})", {
                count: snapshots.length,
              })}
            </h3>
            <div className="query-job-snapshots-table">
              <table>
                <thead>
                  <tr>
                    <th>{t("admin.rtc.queryJobs.col.kind", "Kind")}</th>
                    <th>{t("admin.rtc.queryJobs.col.queryKind", "Query Kind")}</th>
                    <th>{t("admin.rtc.queryJobs.col.capturedAt", "Captured At")}</th>
                    <th>{t("admin.rtc.queryJobs.col.payload", "Payload")}</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snapshot) => (
                    <tr key={snapshot.id}>
                      <td>{snapshotKindLabel(snapshot.snapshotKind, t)}</td>
                      <td>{queryKindLabel(snapshot.queryKind, t)}</td>
                      <td>{formatDateTime(snapshot.capturedAt)}</td>
                      <td>
                        <pre className="query-job-payload">
                          {JSON.stringify(snapshot.snapshotPayload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
