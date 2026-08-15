import { useTranslation } from "react-i18next";

import type { ProviderPluginDescriptor } from "../types/providerSchema";

interface Props {
  plugins: ProviderPluginDescriptor[];
  onSelect: (plugin: ProviderPluginDescriptor) => void;
}

export function ProviderPluginList({ plugins, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-plugin-list">
      <table>
        <thead>
          <tr>
            <th>{t("admin.rtc.plugins.col.provider", "Provider")}</th>
            <th>{t("admin.rtc.plugins.col.displayName", "Display Name")}</th>
            <th>{t("admin.rtc.plugins.col.domain", "Domain")}</th>
            <th>{t("admin.rtc.plugins.col.required", "Required Capabilities")}</th>
            <th>{t("admin.rtc.plugins.col.optional", "Optional Capabilities")}</th>
            <th>{t("admin.rtc.plugins.col.default", "Default")}</th>
            <th>{t("admin.rtc.plugins.col.actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {plugins.map((plugin) => (
            <tr key={plugin.pluginId}>
              <td>
                <code>{plugin.providerKind}</code>
              </td>
              <td>{plugin.displayName}</td>
              <td>{plugin.domain}</td>
              <td>
                <div className="capability-tags">
                  {plugin.requiredCapabilities.map((cap) => (
                    <span key={cap} className="capability-tag required">
                      {cap}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className="capability-tags">
                  {plugin.optionalCapabilities.map((cap) => (
                    <span key={cap} className="capability-tag optional">
                      {cap}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                {plugin.defaultSelected && (
                  <span className="default-badge">{t("admin.rtc.plugins.default", "Default")}</span>
                )}
              </td>
              <td>
                <button onClick={() => onSelect(plugin)}>
                  {t("admin.rtc.plugins.configure", "Configure")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
