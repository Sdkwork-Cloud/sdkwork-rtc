import type { ProviderRoute } from "../types/providerRoute";

interface Props {
  routes: ProviderRoute[];
}

export function ProviderRouteList({ routes }: Props) {
  return (
    <div className="provider-route-list">
      <table>
        <thead>
          <tr>
            <th>Profile ID</th>
            <th>Type</th>
            <th>Region</th>
            <th>Priority</th>
            <th>Status</th>
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
