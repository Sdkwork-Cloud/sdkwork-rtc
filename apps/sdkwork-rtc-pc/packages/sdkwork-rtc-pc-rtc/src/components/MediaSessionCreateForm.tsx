import { useState, type FormEvent } from "react";

import type { SdkworkRtcMediaSessionMode } from "../rtc";

interface MediaSessionCreateFormProps {
  defaultRoomId?: string;
  defaultMediaMode?: SdkworkRtcMediaSessionMode;
  creating?: boolean;
  onCreate: (input: { roomId: string; mediaMode: SdkworkRtcMediaSessionMode }) => Promise<void>;
}

export function MediaSessionCreateForm({
  defaultRoomId = "",
  defaultMediaMode = "video",
  creating = false,
  onCreate,
}: MediaSessionCreateFormProps) {
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [mediaMode, setMediaMode] = useState<SdkworkRtcMediaSessionMode>(defaultMediaMode);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) {
      return;
    }
    await onCreate({ roomId: normalizedRoomId, mediaMode });
  };

  return (
    <form className="rtc-create-form" onSubmit={(event) => void handleSubmit(event)}>
      <h3>Create Media Session</h3>
      <label>
        Room ID
        <input
          required
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
          placeholder="room-001"
        />
      </label>
      <label>
        Media Mode
        <select
          value={mediaMode}
          onChange={(event) => setMediaMode(event.target.value as SdkworkRtcMediaSessionMode)}
        >
          <option value="audio">audio</option>
          <option value="video">video</option>
          <option value="live">live</option>
        </select>
      </label>
      <button type="submit" className="primary" disabled={creating}>
        {creating ? "Creating..." : "Create Session"}
      </button>
    </form>
  );
}
