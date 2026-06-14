import type { Room, RoomBatchAction } from "../types/room";

interface Props {
  selectedRooms: Room[];
  onAction: (action: RoomBatchAction) => void;
  onClearSelection: () => void;
}

export function RoomBatchActions({ selectedRooms, onAction, onClearSelection }: Props) {
  if (selectedRooms.length === 0) return null;

  const activeCount = selectedRooms.filter((r) => r.status === "active").length;
  const archivedCount = selectedRooms.filter((r) => r.status === "archived").length;
  const disabledCount = selectedRooms.filter((r) => r.status === "disabled").length;

  return (
    <div className="room-batch-actions">
      <div className="batch-selection-info">
        <span className="batch-count">{selectedRooms.length} room(s) selected</span>
        <button className="batch-clear" onClick={onClearSelection}>
          Clear Selection
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
            Archive ({activeCount})
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
            Disable ({activeCount})
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
          Export Selected
        </button>
      </div>

      <div className="batch-status-summary">
        {activeCount > 0 && <span className="status-badge active">{activeCount} active</span>}
        {archivedCount > 0 && (
          <span className="status-badge archived">{archivedCount} archived</span>
        )}
        {disabledCount > 0 && (
          <span className="status-badge disabled">{disabledCount} disabled</span>
        )}
      </div>
    </div>
  );
}
