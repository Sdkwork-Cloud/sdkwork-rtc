import type { RtcMediaSession } from "../types/appApi";

import { formatMediaSessionStatus } from "../services/mediaSessionMapper";

interface MediaSessionListProps {
  sessions: readonly RtcMediaSession[];
  onSelect: (session: RtcMediaSession) => void;
  onRefresh: () => void;
}

export function MediaSessionList({ sessions, onSelect, onRefresh }: MediaSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rtc-empty-state">
        <p>No media sessions yet.</p>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="rtc-session-list">
      <div className="rtc-session-list-toolbar">
        <span>{sessions.length} session(s)</span>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <button type="button" className="rtc-session-card" onClick={() => onSelect(session)}>
              <div className="rtc-session-card-title">{session.roomId}</div>
              <div className="rtc-session-card-meta">
                <span>{formatMediaSessionStatus(session.status)}</span>
                <span>{session.mediaMode}</span>
                <span>{session.participantCount ?? session.participants.length} participants</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
