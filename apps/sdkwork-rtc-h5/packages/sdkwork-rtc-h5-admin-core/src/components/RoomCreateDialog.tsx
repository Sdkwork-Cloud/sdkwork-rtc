import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t("admin.rtc.rooms.create.titleRequired", "Room title is required."));
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
      setError(caught instanceof Error ? caught.message : t("admin.rtc.rooms.create.failed", "Failed to create room"));
    } finally {
      setSaving(false);
    }
  }, [onClose, onCreate, roomId, t, title]);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-dialog-overlay">
      <div className="admin-dialog">
        <h3>{t("admin.rtc.rooms.create.title", "Create Call Room")}</h3>
        <div className="admin-dialog-form">
          <label>
            {t("admin.rtc.rooms.create.titleLabel", "Room Title")} <span className="admin-required">*</span>
            <input
              type="text"
              value={title}
              placeholder={t("admin.rtc.rooms.create.titlePlaceholder", "e.g. Product review meeting")}
              maxLength={120}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            {t("admin.rtc.rooms.create.roomIdLabel", "Room ID (optional, auto-generated if empty)")}
            <input
              type="text"
              value={roomId}
              placeholder={t("admin.rtc.rooms.create.roomIdPlaceholder", "room-{uuid} auto-generated")}
              onChange={(event) => setRoomId(event.target.value)}
            />
          </label>
        </div>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-dialog-actions">
          <button type="button" onClick={onClose} disabled={saving}>
            {t("admin.rtc.cancel", "Cancel")}
          </button>
          <button type="button" className="admin-btn-primary" onClick={() => void handleSubmit()} disabled={saving}>
            {saving
              ? t("admin.rtc.rooms.create.creating", "Creating...")
              : t("admin.rtc.rooms.create", "Create Room")}
          </button>
        </div>
      </div>
    </div>
  );
}
