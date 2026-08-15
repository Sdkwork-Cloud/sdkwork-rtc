import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RtcMediaSession } from "../types/mediaSession";
import type { RtcMediaSessionCompletionRecord } from "../types/completionRecord";
import { formatDateTime, formatDurationMs, formatPercentRate } from "../utils/format";

/**
 * Media session detail — session facts, participants, live quality summary,
 * the post-session completion record (participants/tracks/quality/recording)
 * and a guarded force-close action for active sessions.
 */

export interface MediaSessionDetailPanelProps {
  session: RtcMediaSession;
  completionRecord?: RtcMediaSessionCompletionRecord | null;
  completionLoading?: boolean;
  completionError?: string | null;
  onLoadCompletion?: () => void;
  onClose?: (session: RtcMediaSession) => Promise<void>;
  onBack: () => void;
}

export function MediaSessionDetailPanel({
  session,
  completionRecord,
  completionLoading,
  completionError,
  onLoadCompletion,
  onClose,
  onBack,
}: MediaSessionDetailPanelProps) {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const isActive = session.status === "active" || session.status === "preparing";

  const handleClose = useCallback(async () => {
    if (!onClose) {
      return;
    }
    setClosing(true);
    setCloseError(null);
    try {
      await onClose(session);
    } catch (error) {
      setCloseError(
        error instanceof Error ? error.message : t("admin.rtc.sessionDetail.closeFailed", "Failed to close session"),
      );
    } finally {
      setClosing(false);
      setConfirmClose(false);
    }
  }, [onClose, session, t]);

  useEffect(() => {
    if (isActive && !completionRecord && !completionLoading && onLoadCompletion) {
      onLoadCompletion();
    }
    // Only attempt the completion lookup once per session id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const quality = session.qualitySummary;
  const recording = session.recordingSummary;
  const participants = session.participants ?? [];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>{t("admin.rtc.sessionDetail.title", "Session Details")}</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onBack}>
            {t("admin.rtc.back", "Back")}
          </button>
          {isActive && onClose && (
            <button
              type="button"
              className="admin-btn-danger"
              onClick={() => setConfirmClose(true)}
              disabled={closing}
            >
              {closing
                ? t("admin.rtc.sessionDetail.closeShort", "Closing...")
                : t("admin.rtc.sessionDetail.forceClose", "Force Close")}
            </button>
          )}
        </div>
      </div>

      {closeError && <div className="admin-error">{closeError}</div>}
      {confirmClose && (
        <div className="admin-dialog-overlay">
          <div className="admin-dialog">
            <h3>{t("admin.rtc.sessionDetail.closeConfirmTitle", "Force Close Session")}</h3>
            <p>
              {t(
                "admin.rtc.sessionDetail.closeConfirmPrefix",
                "Are you sure you want to force close session",
              )}{" "}
              <strong>{session.id}</strong>
              {t(
                "admin.rtc.sessionDetail.closeConfirmTail",
                "? Active audio/video calls will be terminated.",
              )}
            </p>
            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setConfirmClose(false)} disabled={closing}>
                {t("admin.rtc.cancel", "Cancel")}
              </button>
              <button type="button" className="admin-btn-danger" onClick={() => void handleClose()} disabled={closing}>
                {closing
                  ? t("admin.rtc.sessionDetail.closeShort", "Closing...")
                  : t("admin.rtc.sessionDetail.forceClose", "Force Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-detail-grid">
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.sessionDetail.col.sessionId", "Session ID")}
          </span>
          <span className="admin-detail-value">{session.id}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.sessionDetail.col.roomId", "Room ID")}</span>
          <span className="admin-detail-value">{session.roomId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.sessionDetail.col.mediaMode", "Media Mode")}
          </span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-mode-${session.mediaMode}`}>
              {session.mediaMode}
            </span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.status", "Status")}</span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-status-${session.status}`}>
              {session.status}
            </span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.sessionDetail.col.owner", "Owner")}</span>
          <span className="admin-detail-value">{session.ownerUserId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.sessionDetail.col.providerSession", "Provider Session")}
          </span>
          <span className="admin-detail-value">{session.providerSessionId ?? "-"}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.sessionDetail.col.started", "Started")}</span>
          <span className="admin-detail-value">{formatDateTime(session.startedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.sessionDetail.col.ended", "Ended")}</span>
          <span className="admin-detail-value">{formatDateTime(session.endedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">{t("admin.rtc.sessionDetail.col.duration", "Duration")}</span>
          <span className="admin-detail-value">{formatDurationMs(session.durationMs)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">
            {t("admin.rtc.sessionDetail.col.participants", "Participants")}
          </span>
          <span className="admin-detail-value">
            {t("admin.rtc.sessionDetail.participantsValue", "{{count}} (max {{max}})", {
              count: session.participantCount ?? 0,
              max: session.maxConcurrentParticipants ?? 0,
            })}
          </span>
        </div>
        {session.endSource && (
          <div className="admin-detail-item">
            <span className="admin-detail-label">
              {t("admin.rtc.sessionDetail.col.endSource", "End Source")}
            </span>
            <span className="admin-detail-value">{session.endSource}</span>
          </div>
        )}
        {session.endReason && (
          <div className="admin-detail-item">
            <span className="admin-detail-label">
              {t("admin.rtc.sessionDetail.col.endReason", "End Reason")}
            </span>
            <span className="admin-detail-value">{session.endReason}</span>
          </div>
        )}
      </div>

      {/* Quality summary */}
      {(quality || recording) && (
        <div className="admin-section">
          <h3>{t("admin.rtc.sessionDetail.qualitySummaryTitle", "Quality & Recording Summary")}</h3>
          <div className="admin-detail-grid admin-detail-grid-compact">
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.sessionDetail.col.avgLatency", "Avg Latency")}
              </span>
              <span className="admin-detail-value">
                {quality?.avgLatencyMs != null ? `${quality.avgLatencyMs}ms` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.sessionDetail.col.maxLatency", "Max Latency")}
              </span>
              <span className="admin-detail-value">
                {quality?.maxLatencyMs != null ? `${quality.maxLatencyMs}ms` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.sessionDetail.col.avgJitter", "Avg Jitter")}
              </span>
              <span className="admin-detail-value">
                {quality?.avgJitterMs != null ? `${quality.avgJitterMs}ms` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.sessionDetail.col.maxPacketLoss", "Max Packet Loss")}
              </span>
              <span className="admin-detail-value">{formatPercentRate(quality?.maxPacketLossRate)}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.sessionDetail.col.avgBitrate", "Avg Bitrate")}
              </span>
              <span className="admin-detail-value">
                {quality?.avgBitrateKbps != null ? `${quality.avgBitrateKbps}kbps` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.sessionDetail.col.artifacts", "Artifacts")}
              </span>
              <span className="admin-detail-value">
                {recording?.readyArtifactCount != null
                  ? t("admin.rtc.sessionDetail.artifactsValue", "{{ready}} ready / {{total}} total", {
                      ready: recording.readyArtifactCount,
                      total: recording.artifactCount ?? 0,
                    })
                  : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">
                {t("admin.rtc.sessionDetail.col.driveResources", "Drive Resources")}
              </span>
              <span className="admin-detail-value">{recording?.driveResourceCount ?? "-"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="admin-section">
        <h3>
          {t("admin.rtc.sessionDetail.participantsTitle", "Participants ({{count}})", {
            count: participants.length,
          })}
        </h3>
        {participants.length === 0 ? (
          <p className="admin-muted">
            {t("admin.rtc.sessionDetail.noParticipants", "No participant detail recorded.")}
          </p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("admin.rtc.sessionDetail.col.user", "User")}</th>
                  <th>{t("admin.rtc.sessionDetail.col.role", "Role")}</th>
                  <th>{t("admin.rtc.sessionDetail.col.state", "State")}</th>
                  <th>{t("admin.rtc.sessionDetail.col.audio", "Audio")}</th>
                  <th>{t("admin.rtc.sessionDetail.col.video", "Video")}</th>
                  <th>{t("admin.rtc.sessionDetail.col.screen", "Screen")}</th>
                  <th>{t("admin.rtc.sessionDetail.col.joined", "Joined")}</th>
                  <th>{t("admin.rtc.sessionDetail.col.duration", "Duration")}</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="admin-cell-primary">
                      {participant.displayName || participant.userId}
                      <span className="admin-sub-id">{participant.id}</span>
                    </td>
                    <td>{participant.role}</td>
                    <td>
                      <span className={`admin-badge admin-badge-state-${participant.state}`}>
                        {participant.state}
                      </span>
                    </td>
                    <td>
                      {participant.audioMuted
                        ? t("admin.rtc.sessionDetail.audioMuted", "Muted")
                        : t("admin.rtc.sessionDetail.audioOn", "On")}
                    </td>
                    <td>
                      {participant.videoMuted
                        ? t("admin.rtc.sessionDetail.videoOff", "Off")
                        : t("admin.rtc.sessionDetail.audioOn", "On")}
                    </td>
                    <td>
                      {participant.screenShareActive
                        ? t("admin.rtc.sessionDetail.active", "Active")
                        : "-"}
                    </td>
                    <td>{formatDateTime(participant.joinedAt)}</td>
                    <td>{formatDurationMs(participant.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completion record */}
      <div className="admin-section">
        <h3>{t("admin.rtc.sessionDetail.completionTitle", "Call Completion Record")}</h3>
        {completionLoading ? (
          <p className="admin-muted">
            {t("admin.rtc.sessionDetail.loadingCompletion", "Loading completion record...")}
          </p>
        ) : completionError ? (
          <p className="admin-muted">
            {t("admin.rtc.sessionDetail.notAvailable", "Not available: {{message}}", {
              message: completionError,
            })}
          </p>
        ) : completionRecord ? (
          <>
            <div className="admin-detail-grid admin-detail-grid-compact">
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.sessionDetail.col.recordedAt", "Recorded At")}
                </span>
                <span className="admin-detail-value">{formatDateTime(completionRecord.recordedAt)}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.sessionDetail.col.snapshotHash", "Snapshot Hash")}
                </span>
                <span className="admin-detail-value admin-detail-mono">
                  {completionRecord.completionSnapshotHash.slice(0, 16)}…
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.sessionDetail.col.qualitySamples", "Quality Samples")}
                </span>
                <span className="admin-detail-value">
                  {completionRecord.qualitySummary?.sampleCount ?? 0}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.sessionDetail.col.avgLatency", "Avg Latency")}
                </span>
                <span className="admin-detail-value">
                  {completionRecord.qualitySummary?.avgLatencyMs != null
                    ? `${completionRecord.qualitySummary.avgLatencyMs}ms`
                    : "-"}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.sessionDetail.col.avgJitter", "Avg Jitter")}
                </span>
                <span className="admin-detail-value">
                  {completionRecord.qualitySummary?.avgJitterMs != null
                    ? `${completionRecord.qualitySummary.avgJitterMs}ms`
                    : "-"}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">
                  {t("admin.rtc.sessionDetail.col.maxPacketLoss", "Max Packet Loss")}
                </span>
                <span className="admin-detail-value">
                  {formatPercentRate(completionRecord.qualitySummary?.maxPacketLossRate)}
                </span>
              </div>
            </div>
            <div className="admin-sub-section">
              <h4>{t("admin.rtc.sessionDetail.recordingArtifactsTitle", "Recording Artifacts")}</h4>
              <div className="admin-detail-grid admin-detail-grid-compact">
                <div className="admin-detail-item">
                  <span className="admin-detail-label">
                    {t("admin.rtc.sessionDetail.col.artifacts", "Artifacts")}
                  </span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.artifactCount ?? 0}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">
                    {t("admin.rtc.sessionDetail.col.ready", "Ready")}
                  </span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.readyArtifactCount ?? 0}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">
                    {t("admin.rtc.sessionDetail.col.failed", "Failed")}
                  </span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.failedArtifactCount ?? 0}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">
                    {t("admin.rtc.sessionDetail.col.totalRecording", "Total Recording")}
                  </span>
                  <span className="admin-detail-value">
                    {formatDurationMs(completionRecord.recordingSummary?.totalDurationMs)}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">
                    {t("admin.rtc.sessionDetail.col.driveFiles", "Drive Files")}
                  </span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.driveResourceCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
            {completionRecord.tracks.length > 0 && (
              <div className="admin-sub-section">
                <h4>{t("admin.rtc.sessionDetail.trackStatsTitle", "Track Statistics")}</h4>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{t("admin.rtc.sessionDetail.col.track", "Track")}</th>
                        <th>{t("admin.rtc.sessionDetail.col.participant", "Participant")}</th>
                        <th>{t("admin.rtc.sessionDetail.col.kind", "Kind")}</th>
                        <th>{t("admin.rtc.sessionDetail.col.source", "Source")}</th>
                        <th>{t("admin.rtc.sessionDetail.col.status", "Status")}</th>
                        <th>{t("admin.rtc.sessionDetail.col.duration", "Duration")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completionRecord.tracks.map((track) => (
                        <tr key={track.trackId}>
                          <td className="admin-cell-primary">
                            {track.trackId}
                          </td>
                          <td>{track.participantId}</td>
                          <td>{track.trackKind}</td>
                          <td>{track.trackSource}</td>
                          <td>{track.status}</td>
                          <td>{formatDurationMs(track.durationMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="admin-muted">
            {t(
              "admin.rtc.sessionDetail.completionAvailableAfter",
              "Completion record is available after the session ends.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
