import { useTranslation } from "react-i18next";

import type { ProviderCredential } from "../types/providerCredential";

interface Props {
  credentials: ProviderCredential[];
  onRevoke: (credential: ProviderCredential) => void;
}

export function ProviderCredentialList({ credentials, onRevoke }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-credential-list">
      <table>
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
          {credentials.map((cred) => (
            <tr key={cred.id}>
              <td>
                {t(`admin.rtc.credentials.role.${cred.credentialRole}`, cred.credentialRole)}
              </td>
              <td>{cred.credentialLabel}</td>
              <td>{cred.status}</td>
              <td>{cred.expiresAt ?? "-"}</td>
              <td>
                {cred.status === "active" && (
                  <button onClick={() => onRevoke(cred)}>
                    {t("admin.rtc.credentials.revoke", "Revoke")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
