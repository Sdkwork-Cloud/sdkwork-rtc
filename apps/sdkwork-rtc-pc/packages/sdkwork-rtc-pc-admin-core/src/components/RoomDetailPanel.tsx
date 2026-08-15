import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const activeSessions = sessions.filter((session) => session.status === "active");

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>{t("admin.rtc.roomDetail.title", "Room Details")}</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onBack}>
            {t("admin.rtc.back", "Back")}
          </button>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.roomDetail.roomId", "Room ID")}</span>
          <span className="admin-detail-value admin-detail-mono">{room.id}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.roomDetail.titleLabel", "Title")}</span>
          <span className="admin-detail-value">{room.title}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.status", "Status")}</span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-status-${room.status}`}>{room.status}</span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.roomDetail.owner", "Owner")}</span>
          <span className="admin-detail-value">{room.ownerUserId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.roomDetail.organization", "Organization")}
          </span>
          <span className="admin-detail-value">{room.organizationId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.roomDetail.created", "Created")}
          </span>
          <span className="admin-detail-value">{formatDateTime(room.createdAt)}</span>
        </div>
      </div>

      <div className="admin-section">
        <h3>
          {t("admin.rtc.roomDetail.sessions", "Room Sessions ({{count}})", {
            count: sessions.length,
          })}
        </h3>
        {sessionsLoading ? (
          <p className="admin-muted">{t("admin.rtc.roomDetail.loadingSessions", "Loading sessions...")}</p>
        ) : sessions.length === 0 ? (
          <p className="admin-muted">
            {t("admin.rtc.roomDetail.noSessions", "No media sessions recorded in this room.")}
          </p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("admin.rtc.roomDetail.col.session", "Session")}</th>
                  <th>{t("admin.rtc.roomDetail.col.mode", "Mode")}</th>
                  <th>{t("admin.rtc.roomDetail.col.status", "Status")}</th>
                  <th>{t("admin.rtc.roomDetail.col.started", "Started")}</th>
                  <th>{t("admin.rtc.roomDetail.col.duration", "Duration")}</th>
                  <th>{t("admin.rtc.roomDetail.col.participants", "Participants")}</th>
                  <th>{t("admin.rtc.roomDetail.col.actions", "Actions")}</th>
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
                        {t("admin.rtc.view", "View")}
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
            {t("admin.rtc.roomDetail.activeSessions", "{{count}} session(s) currently active in this room.", {
              count: activeSessions.length,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
