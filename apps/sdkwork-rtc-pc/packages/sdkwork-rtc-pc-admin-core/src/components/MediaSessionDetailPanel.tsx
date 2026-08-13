import { useCallback, useEffect, useState } from "react";

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
      setCloseError(error instanceof Error ? error.message : "Failed to close session");
    } finally {
      setClosing(false);
      setConfirmClose(false);
    }
  }, [onClose, session]);

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
        <h2>会话详情</h2>
        <div className="admin-card-actions">
          <button type="button" onClick={onBack}>
            Back
          </button>
          {isActive && onClose && (
            <button
              type="button"
              className="admin-btn-danger"
              onClick={() => setConfirmClose(true)}
              disabled={closing}
            >
              {closing ? "Closing..." : "Force Close"}
            </button>
          )}
        </div>
      </div>

      {closeError && <div className="admin-error">{closeError}</div>}
      {confirmClose && (
        <div className="admin-dialog-overlay">
          <div className="admin-dialog">
            <h3>强制关闭会话</h3>
            <p>
              确定要强制关闭会话 <strong>{session.id}</strong> 吗？正在进行的音视频通话将被终止。
            </p>
            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setConfirmClose(false)} disabled={closing}>
                Cancel
              </button>
              <button type="button" className="admin-btn-danger" onClick={() => void handleClose()} disabled={closing}>
                {closing ? "Closing..." : "Force Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-detail-grid">
        <div className="admin-detail-item">
          <span className="admin-detail-label">Session ID</span>
          <span className="admin-detail-value">{session.id}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Room ID</span>
          <span className="admin-detail-value">{session.roomId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Media Mode</span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-mode-${session.mediaMode}`}>
              {session.mediaMode}
            </span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Status</span>
          <span className="admin-detail-value">
            <span className={`admin-badge admin-badge-status-${session.status}`}>
              {session.status}
            </span>
          </span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Owner</span>
          <span className="admin-detail-value">{session.ownerUserId}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Provider Session</span>
          <span className="admin-detail-value">{session.providerSessionId ?? "-"}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Started</span>
          <span className="admin-detail-value">{formatDateTime(session.startedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Ended</span>
          <span className="admin-detail-value">{formatDateTime(session.endedAt)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Duration</span>
          <span className="admin-detail-value">{formatDurationMs(session.durationMs)}</span>
        </div>
        <div className="admin-detail-item">
          <span className="admin-detail-label">Participants</span>
          <span className="admin-detail-value">
            {session.participantCount ?? 0} (max {session.maxConcurrentParticipants ?? 0})
          </span>
        </div>
        {session.endSource && (
          <div className="admin-detail-item">
            <span className="admin-detail-label">End Source</span>
            <span className="admin-detail-value">{session.endSource}</span>
          </div>
        )}
        {session.endReason && (
          <div className="admin-detail-item">
            <span className="admin-detail-label">End Reason</span>
            <span className="admin-detail-value">{session.endReason}</span>
          </div>
        )}
      </div>

      {/* Quality summary */}
      {(quality || recording) && (
        <div className="admin-section">
          <h3>质量与录制摘要</h3>
          <div className="admin-detail-grid admin-detail-grid-compact">
            <div className="admin-detail-item">
              <span className="admin-detail-label">Avg Latency</span>
              <span className="admin-detail-value">
                {quality?.avgLatencyMs != null ? `${quality.avgLatencyMs}ms` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Max Latency</span>
              <span className="admin-detail-value">
                {quality?.maxLatencyMs != null ? `${quality.maxLatencyMs}ms` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Avg Jitter</span>
              <span className="admin-detail-value">
                {quality?.avgJitterMs != null ? `${quality.avgJitterMs}ms` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Max Packet Loss</span>
              <span className="admin-detail-value">{formatPercentRate(quality?.maxPacketLossRate)}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Avg Bitrate</span>
              <span className="admin-detail-value">
                {quality?.avgBitrateKbps != null ? `${quality.avgBitrateKbps}kbps` : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Artifacts</span>
              <span className="admin-detail-value">
                {recording?.readyArtifactCount != null
                  ? `${recording.readyArtifactCount} ready / ${recording.artifactCount ?? 0} total`
                  : "-"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Drive Resources</span>
              <span className="admin-detail-value">{recording?.driveResourceCount ?? "-"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="admin-section">
        <h3>参与者 ({participants.length})</h3>
        {participants.length === 0 ? (
          <p className="admin-muted">No participant detail recorded.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>State</th>
                  <th>Audio</th>
                  <th>Video</th>
                  <th>Screen</th>
                  <th>Joined</th>
                  <th>Duration</th>
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
                    <td>{participant.audioMuted ? "Muted" : "On"}</td>
                    <td>{participant.videoMuted ? "Off" : "On"}</td>
                    <td>{participant.screenShareActive ? "Active" : "-"}</td>
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
        <h3>通话完成记录</h3>
        {completionLoading ? (
          <p className="admin-muted">Loading completion record...</p>
        ) : completionError ? (
          <p className="admin-muted">Not available: {completionError}</p>
        ) : completionRecord ? (
          <>
            <div className="admin-detail-grid admin-detail-grid-compact">
              <div className="admin-detail-item">
                <span className="admin-detail-label">Recorded At</span>
                <span className="admin-detail-value">{formatDateTime(completionRecord.recordedAt)}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Snapshot Hash</span>
                <span className="admin-detail-value admin-detail-mono">
                  {completionRecord.completionSnapshotHash.slice(0, 16)}…
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Quality Samples</span>
                <span className="admin-detail-value">
                  {completionRecord.qualitySummary?.sampleCount ?? 0}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Avg Latency</span>
                <span className="admin-detail-value">
                  {completionRecord.qualitySummary?.avgLatencyMs != null
                    ? `${completionRecord.qualitySummary.avgLatencyMs}ms`
                    : "-"}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Avg Jitter</span>
                <span className="admin-detail-value">
                  {completionRecord.qualitySummary?.avgJitterMs != null
                    ? `${completionRecord.qualitySummary.avgJitterMs}ms`
                    : "-"}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Max Packet Loss</span>
                <span className="admin-detail-value">
                  {formatPercentRate(completionRecord.qualitySummary?.maxPacketLossRate)}
                </span>
              </div>
            </div>
            <div className="admin-sub-section">
              <h4>录制制品</h4>
              <div className="admin-detail-grid admin-detail-grid-compact">
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Artifacts</span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.artifactCount ?? 0}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Ready</span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.readyArtifactCount ?? 0}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Failed</span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.failedArtifactCount ?? 0}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Total Recording</span>
                  <span className="admin-detail-value">
                    {formatDurationMs(completionRecord.recordingSummary?.totalDurationMs)}
                  </span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Drive Files</span>
                  <span className="admin-detail-value">
                    {completionRecord.recordingSummary?.driveResourceCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
            {completionRecord.tracks.length > 0 && (
              <div className="admin-sub-section">
                <h4>轨道统计</h4>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Track</th>
                        <th>Participant</th>
                        <th>Kind</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Duration</th>
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
          <p className="admin-muted">Completion record is available after the session ends.</p>
        )}
      </div>
    </div>
  );
}
