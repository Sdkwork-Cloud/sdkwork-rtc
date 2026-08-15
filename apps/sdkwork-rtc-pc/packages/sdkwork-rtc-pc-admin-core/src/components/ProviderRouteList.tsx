import { useTranslation } from "react-i18next";

import type { ProviderRoute } from "../types/providerRoute";

interface Props {
  routes: ProviderRoute[];
}

export function ProviderRouteList({ routes }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-route-list">
      <table>
        <thead>
          <tr>
            <th>{t("admin.rtc.routes.col.profileId", "Profile ID")}</th>
            <th>{t("admin.rtc.routes.col.type", "Type")}</th>
            <th>{t("admin.rtc.routes.col.region", "Region")}</th>
            <th>{t("admin.rtc.routes.col.priority", "Priority")}</th>
            <th>{t("admin.rtc.routes.col.status", "Status")}</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route.id}>
              <td>{route.providerProfileId}</td>
              <td>{route.routeType}</td>
              <td>{route.region ?? "-"}</td>
              <td>{route.priority}</td>
              <td>{route.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
