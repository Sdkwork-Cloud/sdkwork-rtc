import { useCallback, useEffect, useState } from "react";

import type { ProviderAccount } from "../types/providerAccount";
import type { ProviderApplication } from "../types/providerApplication";
import type { ProviderCredential } from "../types/providerCredential";

/**
 * Provider credential management page — pick an account, then an
 * application, then list and revoke its credentials (nested backend
 * resource: account → application → credentials).
 */

export interface ProviderCredentialApplicationPort {
  list(
    providerAccountId: string,
    params?: { page?: number; limit?: number; cursor?: string; search?: string; sort?: string },
  ): Promise<{ items: ProviderApplication[]; nextCursor?: string | null }>;
}

export interface ProviderCredentialServicePort {
  list(
    providerApplicationId: string,
    params?: { page?: number; limit?: number; cursor?: string; search?: string; sort?: string },
  ): Promise<{ items: ProviderCredential[]; nextCursor?: string | null }>;
  revoke(credentialId: string, reason?: string): Promise<ProviderCredential>;
}

export interface ProviderCredentialPageProps {
  accounts: ProviderAccount[];
  accountsLoading?: boolean;
  applicationService: ProviderCredentialApplicationPort;
  services: ProviderCredentialServicePort;
}

export function ProviderCredentialPage({
  accounts,
  accountsLoading,
  applicationService,
  services,
}: ProviderCredentialPageProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [credentials, setCredentials] = useState<ProviderCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAccountId = selectedAccountId || accounts[0]?.id || "";

  const loadApplications = useCallback(
    async (accountId: string) => {
      if (!accountId) {
        setApplications([]);
        setCredentials([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const page = await applicationService.list(accountId, { limit: 200 });
        setApplications(page.items);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load applications");
        setApplications([]);
      } finally {
        setLoading(false);
      }
    },
    [applicationService],
  );

  const loadCredentials = useCallback(
    async (applicationId: string) => {
      if (!applicationId) {
        setCredentials([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const page = await services.list(applicationId, { limit: 200 });
        setCredentials(page.items);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load credentials");
        setCredentials([]);
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

  useEffect(() => {
    const effectiveApplicationId =
      selectedApplicationId || applications[0]?.id || "";
    if (effectiveApplicationId) {
      void loadCredentials(effectiveApplicationId);
    }
  }, [applications, loadCredentials, selectedApplicationId]);

  const handleRevoke = useCallback(
    async (credential: ProviderCredential) => {
      setError(null);
      try {
        await services.revoke(credential.id);
        await loadCredentials(selectedApplicationId || applications[0]?.id || "");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to revoke credential");
      }
    },
    [applications, loadCredentials, selectedApplicationId, services],
  );

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>Provider 凭据</h2>
      </div>
      <div className="admin-filter-bar">
        <select
          value={effectiveAccountId}
          onChange={(event) => {
            setSelectedAccountId(event.target.value);
            setSelectedApplicationId("");
          }}
          disabled={accountsLoading || accounts.length === 0}
        >
          {accounts.length === 0 && <option value="">No accounts available</option>}
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.provider})
            </option>
          ))}
        </select>
        <select
          value={selectedApplicationId || applications[0]?.id || ""}
          onChange={(event) => setSelectedApplicationId(event.target.value)}
          disabled={loading || applications.length === 0}
        >
          {applications.length === 0 && <option value="">No applications</option>}
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.name} ({application.code})
            </option>
          ))}
        </select>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p className="admin-muted">Loading credentials...</p>
      ) : credentials.length === 0 ? (
        <p className="admin-muted">No credentials for this application.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Label</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((credential) => (
                <tr key={credential.id}>
                  <td className="admin-cell-primary">{credential.credentialRole}</td>
                  <td>{credential.credentialLabel ?? "-"}</td>
                  <td>
                    <span className={`admin-badge admin-badge-status-${credential.status}`}>
                      {credential.status}
                    </span>
                  </td>
                  <td>{credential.expiresAt ? new Date(credential.expiresAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <button
                      className="admin-action-btn"
                      onClick={() => void handleRevoke(credential)}
                      disabled={credential.status !== "active"}
                    >
                      Revoke
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
