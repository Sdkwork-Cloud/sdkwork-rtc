import { useCallback, useEffect, useState } from "react";

import type { ProviderAccount } from "../types/providerAccount";
import type { ProviderApplication } from "../types/providerApplication";

/**
 * Provider application management page — pick an account, then list, create
 * and disable its applications (nested backend resource).
 */

export interface ProviderApplicationServicePort {
  list(
    providerAccountId: string,
    params?: { page?: number; limit?: number; cursor?: string; search?: string; sort?: string },
  ): Promise<{ items: ProviderApplication[]; nextCursor?: string | null }>;
  disable(applicationId: string, reason?: string): Promise<ProviderApplication>;
}

export interface ProviderApplicationPageProps {
  accounts: ProviderAccount[];
  accountsLoading?: boolean;
  services: ProviderApplicationServicePort;
}

export function ProviderApplicationPage({
  accounts,
  accountsLoading,
  services,
}: ProviderApplicationPageProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAccountId = selectedAccountId || accounts[0]?.id || "";

  const loadApplications = useCallback(
    async (accountId: string) => {
      if (!accountId) {
        setApplications([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const page = await services.list(accountId, { limit: 200 });
        setApplications(page.items);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load applications");
      } finally {
        setLoading(false);
      }
    },
    [services],
  );

  useEffect(() => {
    if (effectiveAccountId) {
      void loadApplications(effectiveAccountId);
    }
  }, [effectiveAccountId, loadApplications]);

  const handleDisable = useCallback(
    async (application: ProviderApplication) => {
      setError(null);
      try {
        await services.disable(application.id);
        await loadApplications(effectiveAccountId);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to disable application");
      }
    },
    [effectiveAccountId, loadApplications, services],
  );

  return (
    <div className="admin-card admin-card-fill">
      <div className="admin-card-header">
        <h2>Provider 应用</h2>
      </div>
      <div className="admin-filter-bar">
        <select
          value={effectiveAccountId}
          onChange={(event) => setSelectedAccountId(event.target.value)}
          disabled={accountsLoading || accounts.length === 0}
        >
          {accounts.length === 0 && <option value="">No accounts available</option>}
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.provider})
            </option>
          ))}
        </select>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p className="admin-muted">Loading applications...</p>
      ) : applications.length === 0 ? (
        <p className="admin-muted">No applications for this account.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Status</th>
                <th>App ID</th>
                <th>Region</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="admin-cell-primary">{application.code}</td>
                  <td>{application.name}</td>
                  <td>
                    <span className={`admin-badge admin-badge-status-${application.status}`}>
                      {application.status}
                    </span>
                  </td>
                  <td>{application.providerApplicationId ?? "-"}</td>
                  <td>{application.region ?? "-"}</td>
                  <td>
                    <button
                      className="admin-action-btn"
                      onClick={() => void handleDisable(application)}
                      disabled={application.status !== "active"}
                    >
                      Disable
                    </button>
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
