import { useCallback, useEffect, useState } from "react";
import type { RtcMediaSession } from "../types/appApi";

import { MediaSessionCreateForm } from "../components/MediaSessionCreateForm";
import { MediaSessionList } from "../components/MediaSessionList";
import type { RtcAppServices } from "../services/rtcAppServices";
import type { SdkworkRtcMediaSessionMode } from "../rtc";

interface MediaSessionsPageProps {
  services: RtcAppServices;
  defaultMediaMode?: SdkworkRtcMediaSessionMode;
  onOpenSession: (sessionId: string) => void;
}

export function MediaSessionsPage({
  services,
  defaultMediaMode = "video",
  onOpenSession,
}: MediaSessionsPageProps) {
  const [sessions, setSessions] = useState<RtcMediaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await services.mediaSessions.list();
      setSessions(response.items);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to load media sessions";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = async (input: { roomId: string; mediaMode: SdkworkRtcMediaSessionMode }) => {
    setCreating(true);
    setError(null);
    try {
      const created = await services.mediaSessions.create({
        roomId: input.roomId,
        mediaMode: input.mediaMode,
      });
      await refresh();
      onOpenSession(created.id);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to create media session";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rtc-page">
      <header className="rtc-page-header">
        <h1>Media Sessions</h1>
        <p>Create or join RTC media sessions through the app API.</p>
      </header>
      {error && (
        <div className="rtc-error" role="alert">
          {error}
        </div>
      )}
      <div className="rtc-page-grid">
        <MediaSessionCreateForm
          defaultMediaMode={defaultMediaMode}
          creating={creating}
          onCreate={handleCreate}
        />
        <section>
          {loading ? <p>Loading media sessions...</p> : null}
          <MediaSessionList
            sessions={sessions}
            onSelect={(session) => onOpenSession(session.id)}
            onRefresh={() => void refresh()}
          />
        </section>
      </div>
    </div>
  );
}
