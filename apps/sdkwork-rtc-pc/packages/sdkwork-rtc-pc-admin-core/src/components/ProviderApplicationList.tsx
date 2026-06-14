import type { ProviderApplication } from "../types/providerApplication";

interface Props {
  applications: ProviderApplication[];
  onSelect: (app: ProviderApplication) => void;
  onDisable: (app: ProviderApplication) => void;
}

export function ProviderApplicationList({ applications, onSelect, onDisable }: Props) {
  return (
    <div className="provider-application-list">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Status</th>
            <th>App ID</th>
            <th>Region</th>
            <th>Actions</th>
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
                <button onClick={() => onSelect(app)}>Edit</button>
                {app.status === "active" && (
                  <button onClick={() => onDisable(app)}>Disable</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
