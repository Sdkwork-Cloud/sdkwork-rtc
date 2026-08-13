import type { Room } from "../types/room";
import type { RtcMediaSession } from "../types/mediaSession";
import { formatDateTime, formatDurationMs } from "../utils/format";

/**
 * Room detail — room facts plus the media sessions that ran in this room
 * (call history drill-down for the room-centric management view).
 */

export interface RoomDetailPanelProps {
  room: Room;
  sessions: RtcMediaSession[];
  sessionsLoading?: boolean;
  onSelectSession: (session: RtcMediaSession) => void;
  onBack: () => void;
}

export function RoomDetailPanel({
  room,
  sessions,
  sessionsLoading,
  onSelectSession,
  onBack,
}: RoomDetailPanelProps) {
  const activeSessions = sessions.filter((session) => session.status === "active");

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>通话房间详情</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-item">
          <span className="admin-detail-label">Room ID</span>
          <span className="admin-detail-value admin-detail-mono">{room.id}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Title</span>
          <span className="admin-detail-value">{room.title}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Status</span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-status-${room.status}`}>{room.status}</span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Owner</span>
          <span className="admin-detail-value">{room.ownerUserId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Organization</span>
          <span className="admin-detail-value">{room.organizationId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Created</span>
          <span className="admin-detail-value">{formatDateTime(room.createdAt)}</span>
        </div>
      </div>

      <div className="admin-section">
        <h3>房间会话 ({sessions.length})</h3>
        {sessionsLoading ? (
          <p className="admin-muted">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="admin-muted">No media sessions recorded in this room.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Participants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="admin-cell-primary">{session.id}</td>
                    <td>
                      <span className={`admin-badge admin-badge-mode-${session.mediaMode}`}>
                        {session.mediaMode}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-status-${session.status}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>{formatDateTime(session.startedAt)}</td>
                    <td>{formatDurationMs(session.durationMs)}</td>
                    <td>{session.participantCount ?? 0}</td>
                    <td>
                      <button className="admin-action-btn" onClick={() => onSelectSession(session)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeSessions.length > 0 && (
          <p className="admin-muted">
            {activeSessions.length} session(s) currently active in this room.
          </p>
        )}
      </div>
    </div>
  );
}
