import type { RtcMediaSession } from "../types/appApi";

import {
  evaluateRtcJoinReadiness,
  formatMediaSessionStatus,
  mapMediaSessionToRtcSession,
  type SdkworkRtcJoinReadiness,
} from "../services/mediaSessionMapper";

interface MediaSessionJoinPanelProps {
  session: RtcMediaSession;
  participantId: string;
  providerAppId?: string;
  joining?: boolean;
  runtimeMessage?: string;
  onParticipantIdChange: (value: string) => void;
  onJoin: () => void;
  onLeave: () => void;
}

function renderReadiness(readiness: SdkworkRtcJoinReadiness) {
  if (readiness.ready) {
    return <p className="rtc-readiness ok">Ready to join.</p>;
  }
  return (
    <div className="rtc-readiness blocked">
      <p>Join blocked:</p>
      <ul>
        {readiness.issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}

export function MediaSessionJoinPanel({
  session,
  participantId,
  providerAppId,
  joining = false,
  runtimeMessage,
  onParticipantIdChange,
  onJoin,
  onLeave,
}: MediaSessionJoinPanelProps) {
  const rtcSession = mapMediaSessionToRtcSession(session, participantId);
  const readiness = evaluateRtcJoinReadiness(rtcSession, {
    cameraRequired: session.mediaMode !== "audio",
    permissions: {
      microphone: "prompt",
      camera: session.mediaMode === "audio" ? undefined : "prompt",
    },
  });

  return (
    <section className="rtc-join-panel">
      <header>
        <h2>{session.roomId}</h2>
        <p>
          {formatMediaSessionStatus(session.status)} · {session.mediaMode}
        </p>
      </header>
      <dl className="rtc-join-details">
        <div>
          <dt>Session ID</dt>
          <dd>{session.id}</dd>
        </div>
        <div>
          <dt>Provider App ID</dt>
          <dd>{providerAppId ?? "pending provider profile lookup"}</dd>
        </div>
      </dl>
      <label>
        Participant ID
        <input
          value={participantId}
          onChange={(event) => onParticipantIdChange(event.target.value)}
        />
      </label>
      {renderReadiness(readiness)}
      {runtimeMessage && <p className="rtc-runtime-message">{runtimeMessage}</p>}
      <div className="rtc-join-actions">
        <button
          type="button"
          className="primary"
          disabled={!readiness.ready || joining || !participantId.trim()}
          onClick={onJoin}
        >
          {joining ? "Joining..." : "Join Session"}
        </button>
        <button type="button" onClick={onLeave}>
          Leave
        </button>
      </div>
    </section>
  );
}
