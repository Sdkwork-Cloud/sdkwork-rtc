import type { ProviderProfile } from "../types/providerProfile";

interface Props {
  profiles: ProviderProfile[];
  onSelect: (profile: ProviderProfile) => void;
  onDisable: (profile: ProviderProfile) => void;
  onVerify: (profile: ProviderProfile) => void;
}

export function ProviderProfileList({ profiles, onSelect, onDisable, onVerify }: Props) {
  return (
    <div className="provider-profile-list">
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Code</th>
            <th>Name</th>
            <th>Status</th>
            <th>Health</th>
            <th>Default</th>
            <th>Region</th>
            <th>Actions</th>
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
              <td>{profile.isDefault ? "Yes" : "No"}</td>
              <td>{profile.region ?? "-"}</td>
              <td>
                <button onClick={() => onSelect(profile)}>Edit</button>
                <button onClick={() => onVerify(profile)}>Verify</button>
                {profile.status === "active" && (
                  <button onClick={() => onDisable(profile)}>Disable</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
