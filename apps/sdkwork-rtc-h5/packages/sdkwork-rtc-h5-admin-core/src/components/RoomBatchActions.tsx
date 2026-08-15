import { useTranslation } from "react-i18next";
import type { Room, RoomBatchAction } from "../types/room";

interface Props {
  selectedRooms: Room[];
  onAction: (action: RoomBatchAction) => void;
  onClearSelection: () => void;
}

export function RoomBatchActions({ selectedRooms, onAction, onClearSelection }: Props) {
  const { t } = useTranslation();
  if (selectedRooms.length === 0) return null;

  const activeCount = selectedRooms.filter((r) => r.status === "active").length;
  const archivedCount = selectedRooms.filter((r) => r.status === "archived").length;
  const disabledCount = selectedRooms.filter((r) => r.status === "disabled").length;

  return (
    <div className="room-batch-actions">
      <div className="batch-selection-info">
        <span className="batch-count">
          {t("admin.rtc.rooms.batch.selected", "{{count}} room(s) selected", {
            count: selectedRooms.length,
          })}
        </span>
        <button className="batch-clear" onClick={onClearSelection}>
          {t("admin.rtc.rooms.batch.clearSelection", "Clear Selection")}
        </button>
      </div>

      <div className="batch-action-buttons">
        {activeCount > 0 && (
          <button
            className="batch-action batch-archive"
            onClick={() =>
              onAction({
                type: "archive",
                roomIds: selectedRooms.filter((r) => r.status === "active").map((r) => r.id),
              })
            }
          >
            {t("admin.rtc.rooms.batch.archive", "Archive ({{count}})", { count: activeCount })}
          </button>
        )}

        {activeCount > 0 && (
          <button
            className="batch-action batch-disable"
            onClick={() =>
              onAction({
                type: "disable",
                roomIds: selectedRooms.filter((r) => r.status === "active").map((r) => r.id),
              })
            }
          >
            {t("admin.rtc.rooms.batch.disable", "Disable ({{count}})", { count: activeCount })}
          </button>
        )}

        <button
          className="batch-action batch-export"
          onClick={() =>
            onAction({
              type: "export",
              roomIds: selectedRooms.map((r) => r.id),
            })
          }
        >
          {t("admin.rtc.rooms.batch.export", "Export Selected")}
        </button>
      </div>

      <div className="batch-status-summary">
        {activeCount > 0 && (
          <span className="status-badge active">
            {t("admin.rtc.rooms.batch.activeCount", "{{count}} active", { count: activeCount })}
          </span>
        )}
        {archivedCount > 0 && (
          <span className="status-badge archived">
            {t("admin.rtc.rooms.batch.archivedCount", "{{count}} archived", { count: archivedCount })}
          </span>
        )}
        {disabledCount > 0 && (
          <span className="status-badge disabled">
            {t("admin.rtc.rooms.batch.disabledCount", "{{count}} disabled", { count: disabledCount })}
          </span>
        )}
      </div>
    </div>
  );
}
