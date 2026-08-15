import { useTranslation } from "react-i18next";

import type { ProviderWebhookEvent } from "../types/providerWebhookEvent";

interface Props {
  events: ProviderWebhookEvent[];
}

export function ProviderWebhookEventList({ events }: Props) {
  const { t } = useTranslation();
  return (
    <div className="provider-webhook-event-list">
      <table>
        <thead>
          <tr>
            <th>{t("admin.rtc.webhooks.col.provider", "Provider")}</th>
            <th>{t("admin.rtc.webhooks.col.eventType", "Event Type")}</th>
            <th>{t("admin.rtc.webhooks.col.eventKind", "Event Kind")}</th>
            <th>{t("admin.rtc.webhooks.col.status", "Status")}</th>
            <th>{t("admin.rtc.webhooks.col.roomId", "Room ID")}</th>
            <th>{t("admin.rtc.webhooks.col.receivedAt", "Received At")}</th>
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
