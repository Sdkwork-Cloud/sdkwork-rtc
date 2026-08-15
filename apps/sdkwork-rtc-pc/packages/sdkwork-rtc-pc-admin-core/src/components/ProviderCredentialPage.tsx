import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        setError(
          caught instanceof Error
            ? caught.message
            : t("admin.rtc.applications.failedLoad", "Failed to load applications"),
        );
        setApplications([]);
      } finally {
        setLoading(false);
      }
    },
    [applicationService, t],
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
        setError(
          caught instanceof Error
            ? caught.message
            : t("admin.rtc.credentials.failedLoad", "Failed to load credentials"),
        );
        setCredentials([]);
      } finally {
        setLoading(false);
      }
    },
    [services, t],
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
        setError(
          caught instanceof Error
            ? caught.message
            : t("admin.rtc.credentials.failedRevoke", "Failed to revoke credential"),
        );
      }
    },
    [applications, loadCredentials, selectedApplicationId, services, t],
  );

  return (
    <div className="admin-card admin-card-fill">
      <div className="admin-card-header">
        <h2>{t("admin.rtc.credentials.title", "Provider Credentials")}</h2>
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
          {accounts.length === 0 && (
            <option value="">{t("admin.rtc.applications.noAccounts", "No accounts available")}</option>
          )}
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
          {applications.length === 0 && (
            <option value="">{t("admin.rtc.credentials.noApplications", "No applications")}</option>
          )}
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.name} ({application.code})
            </option>
          ))}
        </select>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p className="admin-muted">
          {t("admin.rtc.credentials.loading", "Loading credentials...")}
        </p>
      ) : credentials.length === 0 ? (
        <p className="admin-muted">
          {t("admin.rtc.credentials.empty", "No credentials for this application.")}
        </p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.rtc.credentials.col.role", "Role")}</th>
                <th>{t("admin.rtc.credentials.col.label", "Label")}</th>
                <th>{t("admin.rtc.credentials.col.status", "Status")}</th>
                <th>{t("admin.rtc.credentials.col.expires", "Expires")}</th>
                <th>{t("admin.rtc.credentials.col.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((credential) => (
                <tr key={credential.id}>
                  <td className="admin-cell-primary">
                    {t(
                      `admin.rtc.credentials.role.${credential.credentialRole}`,
                      credential.credentialRole,
                    )}
                  </td>
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
                      {t("admin.rtc.credentials.revoke", "Revoke")}
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
