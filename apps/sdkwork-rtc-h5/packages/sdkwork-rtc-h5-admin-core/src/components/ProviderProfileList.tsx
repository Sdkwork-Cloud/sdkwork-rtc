import { useTranslation } from "react-i18next";

import type { ProviderProfile } from "../types/providerProfile";

interface Props {
  profiles: ProviderProfile[];
  onSelect: (profile: ProviderProfile) => void;
  onDisable: (profile: ProviderProfile) => void;
  onVerify: (profile: ProviderProfile) => void;
}

export function ProviderProfileList({ profiles, onSelect, onDisable, onVerify }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-profile-list">
      <table>
        <thead>
          <tr>
            <th>{t("admin.rtc.profiles.col.provider", "Provider")}</th>
            <th>{t("admin.rtc.profiles.col.code", "Code")}</th>
            <th>{t("admin.rtc.profiles.col.name", "Name")}</th>
            <th>{t("admin.rtc.profiles.col.status", "Status")}</th>
            <th>{t("admin.rtc.profiles.col.health", "Health")}</th>
            <th>{t("admin.rtc.profiles.col.default", "Default")}</th>
            <th>{t("admin.rtc.profiles.col.region", "Region")}</th>
            <th>{t("admin.rtc.profiles.col.actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <td>{profile.provider}</td>
              <td>{profile.code}</td>
              <td>{profile.name}</td>
              <td>{profile.status}</td>
              <td>{profile.healthStatus}</td>
              <td>
                {profile.isDefault
                  ? t("admin.rtc.yes", "Yes")
                  : t("admin.rtc.no", "No")}
              </td>
              <td>{profile.region ?? "-"}</td>
              <td>
                <button onClick={() => onSelect(profile)}>
                  {t("admin.rtc.profiles.edit", "Edit")}
                </button>
                <button onClick={() => onVerify(profile)}>
                  {t("admin.rtc.profiles.verify", "Verify")}
                </button>
                {profile.status === "active" && (
                  <button onClick={() => onDisable(profile)}>
                    {t("admin.rtc.profiles.disable", "Disable")}
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
