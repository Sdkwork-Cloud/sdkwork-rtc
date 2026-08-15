import { useTranslation } from "react-i18next";

import type { ProviderRouteCommand } from "../types/providerRoute";

interface Props {
  profileIds: string[];
  onSubmit: (command: ProviderRouteCommand) => void;
  onCancel: () => void;
}

export function ProviderRouteForm({ profileIds, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-route-form">
      <h3>{t("admin.rtc.routes.form.title", "Add Provider Route")}</h3>
      <div className="form-field">
        <label>{t("admin.rtc.routes.form.profile", "Provider Profile")}</label>
        <select id="route-profile">
          {profileIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>{t("admin.rtc.routes.form.routeType", "Route Type")}</label>
        <input type="text" id="route-type" defaultValue="region" />
      </div>
      <div className="form-field">
        <label>{t("admin.rtc.routes.form.region", "Region")}</label>
        <input type="text" id="route-region" placeholder={t("admin.rtc.routes.form.regionPlaceholder", "cn-beijing")} />
      </div>
      <div className="form-field">
        <label>{t("admin.rtc.routes.form.priority", "Priority")}</label>
        <input type="number" id="route-priority" defaultValue={0} />
      </div>
      <div className="form-actions">
        <button onClick={onCancel}>{t("admin.rtc.cancel", "Cancel")}</button>
        <button
          onClick={() =>
            onSubmit({
              providerProfileId: (document.getElementById("route-profile") as HTMLSelectElement).value,
              routeType: (document.getElementById("route-type") as HTMLInputElement).value,
              region: (document.getElementById("route-region") as HTMLInputElement).value || undefined,
              priority: Number((document.getElementById("route-priority") as HTMLInputElement).value),
            })
          }
        >
          {t("admin.rtc.save", "Save")}
        </button>
      </div>
    </div>
  );
}
