import type { ProviderWebhookEvent } from "../types/providerWebhookEvent";

interface Props {
  events: ProviderWebhookEvent[];
}

export function ProviderWebhookEventList({ events }: Props) {
  return (
    <div className="provider-webhook-event-list">
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Event Type</th>
            <th>Event Kind</th>
            <th>Status</th>
            <th>Room ID</th>
            <th>Received At</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.provider}</td>
              <td>{event.eventType}</td>
              <td>{event.eventKind}</td>
              <td>{event.status}</td>
              <td>{event.roomId ?? "-"}</td>
              <td>{event.receivedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
