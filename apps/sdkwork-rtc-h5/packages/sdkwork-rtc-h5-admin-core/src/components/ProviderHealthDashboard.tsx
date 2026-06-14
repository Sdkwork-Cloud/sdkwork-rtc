import type { ProviderProfile } from "../types/providerProfile";
import type { ProviderConfigSchema } from "../types/providerSchema";

interface Props {
  profiles: ProviderProfile[];
  schemas: ProviderConfigSchema[];
  onVerify: (profile: ProviderProfile) => void;
  onRefresh: () => void;
}

interface ProviderStatus {
  provider: string;
  displayName: string;
  totalProfiles: number;
  activeProfiles: number;
  healthyProfiles: number;
  degradedProfiles: number;
  unhealthyProfiles: number;
  defaultProfile?: ProviderProfile;
}

export function ProviderHealthDashboard({ profiles, schemas, onVerify, onRefresh }: Props) {
  const providerStatuses = buildProviderStatuses(profiles, schemas);

  return (
    <div className="provider-health-dashboard">
      <div className="dashboard-header">
        <h2>Provider Health Dashboard</h2>
        <button onClick={onRefresh}>Refresh</button>
      </div>

      <div className="provider-grid">
        {providerStatuses.map((status) => (
          <div key={status.provider} className={`provider-card health-${getOverallHealth(status)}`}>
            <div className="provider-card-header">
              <h3>{status.displayName}</h3>
              <span className={`health-badge ${getOverallHealth(status)}`}>
                {getOverallHealth(status)}
              </span>
            </div>

            <div className="provider-stats">
              <div className="stat">
                <span className="stat-value">{status.totalProfiles}</span>
                <span className="stat-label">Profiles</span>
              </div>
              <div className="stat">
                <span className="stat-value">{status.activeProfiles}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat">
                <span className="stat-value">{status.healthyProfiles}</span>
                <span className="stat-label">Healthy</span>
              </div>
            </div>

            {status.defaultProfile && (
              <div className="default-profile">
                <h4>Default Profile</h4>
                <p>{status.defaultProfile.name}</p>
                <span className={`health-status ${status.defaultProfile.healthStatus}`}>
                  {status.defaultProfile.healthStatus}
                </span>
                {status.defaultProfile.lastVerifiedAt && (
                  <p className="last-verified">
                    Last verified: {new Date(status.defaultProfile.lastVerifiedAt).toLocaleString()}
                  </p>
                )}
                <button onClick={() => onVerify(status.defaultProfile!)}>Verify Now</button>
              </div>
            )}

            {status.degradedProfiles > 0 && (
              <div className="warning">
                {status.degradedProfiles} degraded profile(s)
              </div>
            )}

            {status.unhealthyProfiles > 0 && (
              <div className="error">
                {status.unhealthyProfiles} unhealthy profile(s)
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="capabilities-matrix">
        <h3>Capabilities Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Audio</th>
              <th>Video</th>
              <th>Live</th>
              <th>Screen Share</th>
              <th>Recording</th>
              <th>Webhook</th>
              <th>Active Query</th>
            </tr>
          </thead>
          <tbody>
            {providerStatuses.map((status) => {
              const caps = status.defaultProfile?.capabilities;
              return (
                <tr key={status.provider}>
                  <td>{status.displayName}</td>
                  <td>{caps?.audio ? "✅" : "❌"}</td>
                  <td>{caps?.video ? "✅" : "❌"}</td>
                  <td>{caps?.live ? "✅" : "❌"}</td>
                  <td>{caps?.screenShare ? "✅" : "❌"}</td>
                  <td>{caps?.recording ? "✅" : "❌"}</td>
                  <td>{caps?.webhook ? "✅" : "❌"}</td>
                  <td>{caps?.activeQuery ? "✅" : "❌"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildProviderStatuses(
  profiles: ProviderProfile[],
  schemas: ProviderConfigSchema[]
): ProviderStatus[] {
  const providerMap = new Map<string, ProviderProfile[]>();
  for (const profile of profiles) {
    if (!providerMap.has(profile.provider)) {
      providerMap.set(profile.provider, []);
    }
    providerMap.get(profile.provider)!.push(profile);
  }

  return Array.from(providerMap.entries()).map(([provider, providerProfiles]) => {
    const schema = schemas.find((s) => s.provider === provider);
    const activeProfiles = providerProfiles.filter((p) => p.status === "active");
    return {
      provider,
      displayName: schema?.displayName ?? provider,
      totalProfiles: providerProfiles.length,
      activeProfiles: activeProfiles.length,
      healthyProfiles: activeProfiles.filter((p) => p.healthStatus === "healthy").length,
      degradedProfiles: activeProfiles.filter((p) => p.healthStatus === "degraded").length,
      unhealthyProfiles: activeProfiles.filter((p) => p.healthStatus === "unhealthy").length,
      defaultProfile: providerProfiles.find((p) => p.isDefault && p.status === "active"),
    };
  });
}

function getOverallHealth(status: ProviderStatus): string {
  if (status.unhealthyProfiles > 0) return "unhealthy";
  if (status.degradedProfiles > 0) return "degraded";
  if (status.healthyProfiles > 0) return "healthy";
  return "unknown";
}
