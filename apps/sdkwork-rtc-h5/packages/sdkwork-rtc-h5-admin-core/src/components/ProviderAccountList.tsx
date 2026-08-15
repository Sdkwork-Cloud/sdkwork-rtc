import { useTranslation } from "react-i18next";

import type { ProviderAccount } from "../types/providerAccount";

interface Props {
  accounts: ProviderAccount[];
  onSelect: (account: ProviderAccount) => void;
  onDisable: (account: ProviderAccount) => void;
}

export function ProviderAccountList({ accounts, onSelect, onDisable }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-account-list">
      <table>
        <thead>
          <tr>
            <th>{t("admin.rtc.accounts.col.provider", "Provider")}</th>
            <th>{t("admin.rtc.accounts.col.code", "Code")}</th>
            <th>{t("admin.rtc.accounts.col.name", "Name")}</th>
            <th>{t("admin.rtc.accounts.col.status", "Status")}</th>
            <th>{t("admin.rtc.accounts.col.environment", "Environment")}</th>
            <th>{t("admin.rtc.accounts.col.actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.provider}</td>
              <td>{account.code}</td>
              <td>{account.name}</td>
              <td>{account.status}</td>
              <td>{account.environment}</td>
              <td>
                <button onClick={() => onSelect(account)}>
                  {t("admin.rtc.accounts.edit", "Edit")}
                </button>
                {account.status === "active" && (
                  <button onClick={() => onDisable(account)}>
                    {t("admin.rtc.accounts.disable", "Disable")}
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
