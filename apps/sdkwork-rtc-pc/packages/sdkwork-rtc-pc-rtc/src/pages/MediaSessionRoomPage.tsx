import { useCallback, useEffect, useMemo, useState } from "react";
import type { RtcMediaSession } from "../types/appApi";

import { MediaSessionJoinPanel } from "../components/MediaSessionJoinPanel";
import { createRtcMediaRuntime, type RtcMediaRuntimePort } from "../services/rtcMediaRuntime";
import type { RtcAppServices } from "../services/rtcAppServices";

interface MediaSessionRoomPageProps {
  services: RtcAppServices;
  sessionId: string;
  participantId: string;
  displayName: string;
  onParticipantIdChange: (value: string) => void;
}

export function MediaSessionRoomPage({
  services,
  sessionId,
  participantId,
  displayName,
  onParticipantIdChange,
}: MediaSessionRoomPageProps) {
  const [session, setSession] = useState<RtcMediaSession | null>(null);
  const [providerAppId, setProviderAppId] = useState<string | undefined>();
  const [providerKey, setProviderKey] = useState<string | undefined>();
  const [runtime, setRuntime] = useState<RtcMediaRuntimePort | null>(null);
  const [runtimeMessage, setRuntimeMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runtimeFactory = useMemo(() => createRtcMediaRuntime, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedSession, profiles] = await Promise.all([
        services.mediaSessions.get(sessionId),
        services.providerProfiles.listActive(),
      ]);
      setSession(loadedSession);
      setProviderAppId(services.providerProfiles.resolveDefaultProviderAppId(profiles));
      setProviderKey(services.providerProfiles.resolveDefaultProviderKey(profiles));
      const mediaRuntime = await runtimeFactory();
      setRuntime(mediaRuntime);
      setRuntimeMessage(mediaRuntime.getStatus().message);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to load media session";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [runtimeFactory, services, sessionId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const handleJoin = async () => {
    if (!session || !runtime) {
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const token = await services.participantCredentials.issue(
        session.id,
        participantId.trim(),
        "join",
      );
      const appId = providerAppId;
      if (!appId) {
        throw new Error("No active provider profile with providerAppId is available.");
      }
      const status = await runtime.join({
        appId,
        sessionId: session.id,
        roomId: session.roomId,
        participantId: participantId.trim(),
        token,
        displayName,
        providerKey,
      });
      setRuntimeMessage(status.message);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to join media session";
      setError(message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!runtime) {
      return;
    }
    await runtime.leave();
    setRuntimeMessage(runtime.getStatus().message);
  };

  if (loading) {
    return <p>Loading media session...</p>;
  }

  if (error) {
    return (
      <div className="rtc-error" role="alert">
        {error}
      </div>
    );
  }

  if (!session) {
    return <p>Media session not found.</p>;
  }

  return (
    <div className="rtc-page">
      <MediaSessionJoinPanel
        session={session}
        participantId={participantId}
        providerAppId={providerAppId}
        joining={joining}
        runtimeMessage={runtimeMessage}
        onParticipantIdChange={onParticipantIdChange}
        onJoin={() => void handleJoin()}
        onLeave={() => void handleLeave()}
      />
    </div>
  );
}
