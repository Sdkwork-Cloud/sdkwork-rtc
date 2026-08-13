import { useCallback, useState } from "react";

import type { RoomCreateCommand } from "../types/room";

/**
 * Create room dialog — title (required) with an optional stable room id.
 * Creation goes through the backend `rtc.rooms.create` contract.
 */

export interface RoomCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (command: RoomCreateCommand) => Promise<void>;
}

export function RoomCreateDialog({ open, onClose, onCreate }: RoomCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Room title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        title: trimmedTitle,
        roomId: roomId.trim() || null,
      });
      setTitle("");
      setRoomId("");
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create room");
    } finally {
      setSaving(false);
    }
  }, [onClose, onCreate, roomId, title]);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-dialog-overlay">
      <div className="admin-dialog">
        <h3>创建通话房间</h3>
        <div className="admin-dialog-form">
          <label>
            房间标题 <span className="admin-required">*</span>
            <input
              type="text"
              value={title}
              placeholder="e.g. 产品评审会议"
              maxLength={120}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            房间 ID（可选，留空自动生成）
            <input
              type="text"
              value={roomId}
              placeholder="room-{uuid} 自动生成"
              onChange={(event) => setRoomId(event.target.value)}
            />
          </label>
        </div>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-dialog-actions">
          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="admin-btn-primary" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
