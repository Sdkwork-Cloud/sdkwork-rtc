import type { ProviderRouteCommand } from "../types/providerRoute";

interface Props {
  profileIds: string[];
  onSubmit: (command: ProviderRouteCommand) => void;
  onCancel: () => void;
}

export function ProviderRouteForm({ profileIds, onSubmit, onCancel }: Props) {
  return (
    <div className="provider-route-form">
      <h3>Add Provider Route</h3>
      <div className="form-field">
        <label>Provider Profile</label>
        <select id="route-profile">
          {profileIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Route Type</label>
        <input type="text" id="route-type" defaultValue="region" />
      </div>
      <div className="form-field">
        <label>Region</label>
        <input type="text" id="route-region" placeholder="cn-beijing" />
      </div>
      <div className="form-field">
        <label>Priority</label>
        <input type="number" id="route-priority" defaultValue={0} />
      </div>
      <div className="form-actions">
        <button onClick={onCancel}>Cancel</button>
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
          Save
        </button>
      </div>
    </div>
  );
}
