import type { ProviderPluginDescriptor } from "../types/providerSchema";

interface Props {
  plugins: ProviderPluginDescriptor[];
  onSelect: (plugin: ProviderPluginDescriptor) => void;
}

export function ProviderPluginList({ plugins, onSelect }: Props) {
  return (
    <div className="provider-plugin-list">
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Display Name</th>
            <th>Domain</th>
            <th>Required Capabilities</th>
            <th>Optional Capabilities</th>
            <th>Default</th>
            <th>Actions</th>
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
                  <span className="default-badge">Default</span>
                )}
              </td>
              <td>
                <button onClick={() => onSelect(plugin)}>Configure</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
