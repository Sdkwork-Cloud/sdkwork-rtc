import type { ProviderQueryJob, ProviderQuerySnapshot } from "../types/providerQueryJob";

interface Props {
  job: ProviderQueryJob | null;
  snapshots: ProviderQuerySnapshot[];
}

export function ProviderQueryJobPanel({ job, snapshots }: Props) {
  return (
    <div className="provider-query-job-panel">
      {job && (
        <div className="query-job-detail">
          <h3>Query Job {job.id}</h3>
          <dl>
            <dt>Provider</dt>
            <dd>{job.provider}</dd>
            <dt>Query Kind</dt>
            <dd>{job.queryKind}</dd>
            <dt>Status</dt>
            <dd>{job.status}</dd>
            <dt>Target</dt>
            <dd>
              {job.targetKind}: {job.targetId}
            </dd>
            <dt>Requested At</dt>
            <dd>{job.requestedAt}</dd>
          </dl>
        </div>
      )}
      {snapshots.length > 0 && (
        <div className="query-job-snapshots">
          <h3>Snapshots</h3>
          <table>
            <thead>
              <tr>
                <th>Kind</th>
                <th>Captured At</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td>{snapshot.snapshotKind}</td>
                  <td>{snapshot.capturedAt}</td>
                  <td>
                    <code>{JSON.stringify(snapshot.snapshotPayload)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
