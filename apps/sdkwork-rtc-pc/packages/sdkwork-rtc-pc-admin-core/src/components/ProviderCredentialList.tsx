import type { ProviderCredential } from "../types/providerCredential";

interface Props {
  credentials: ProviderCredential[];
  onRevoke: (credential: ProviderCredential) => void;
}

export function ProviderCredentialList({ credentials, onRevoke }: Props) {
  return (
    <div className="provider-credential-list">
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Label</th>
            <th>Status</th>
            <th>Expires</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {credentials.map((cred) => (
            <tr key={cred.id}>
              <td>{cred.credentialRole}</td>
              <td>{cred.credentialLabel}</td>
              <td>{cred.status}</td>
              <td>{cred.expiresAt ?? "-"}</td>
              <td>
                {cred.status === "active" && (
                  <button onClick={() => onRevoke(cred)}>Revoke</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
