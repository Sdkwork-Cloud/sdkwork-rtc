import { useTranslation } from "react-i18next";

import type { ProviderApplication } from "../types/providerApplication";

interface Props {
  applications: ProviderApplication[];
  onSelect: (app: ProviderApplication) => void;
  onDisable: (app: ProviderApplication) => void;
}

export function ProviderApplicationList({ applications, onSelect, onDisable }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-application-list">
      <table>
        <thead>
          <tr>
            <th>{t("admin.rtc.applications.col.code", "Code")}</th>
            <th>{t("admin.rtc.applications.col.name", "Name")}</th>
            <th>{t("admin.rtc.applications.col.status", "Status")}</th>
            <th>{t("admin.rtc.applications.col.appId", "App ID")}</th>
            <th>{t("admin.rtc.applications.col.region", "Region")}</th>
            <th>{t("admin.rtc.applications.col.actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>{app.code}</td>
              <td>{app.name}</td>
              <td>{app.status}</td>
              <td>{app.providerApplicationId}</td>
              <td>{app.region ?? "-"}</td>
              <td>
                <button onClick={() => onSelect(app)}>
                  {t("admin.rtc.applications.edit", "Edit")}
                </button>
                {app.status === "active" && (
                  <button onClick={() => onDisable(app)}>
                    {t("admin.rtc.applications.disable", "Disable")}
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
