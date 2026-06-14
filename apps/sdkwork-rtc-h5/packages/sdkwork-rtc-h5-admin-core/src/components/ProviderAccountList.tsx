import type { ProviderAccount } from "../types/providerAccount";

interface Props {
  accounts: ProviderAccount[];
  onSelect: (account: ProviderAccount) => void;
  onDisable: (account: ProviderAccount) => void;
}

export function ProviderAccountList({ accounts, onSelect, onDisable }: Props) {
  return (
    <div className="provider-account-list">
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Code</th>
            <th>Name</th>
            <th>Status</th>
            <th>Environment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.provider}</td>
              <td>{account.code}</td>
              <td>{account.name}</td>
              <td>{account.status}</td>
              <td>{account.environment}</td>
              <td>
                <button onClick={() => onSelect(account)}>Edit</button>
                {account.status === "active" && (
                  <button onClick={() => onDisable(account)}>Disable</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
