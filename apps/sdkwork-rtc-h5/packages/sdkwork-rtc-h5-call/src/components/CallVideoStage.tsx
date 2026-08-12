import { RtcCallAvatar } from "./CallAvatar";

/**
 * Connected-call video stage: remote video fills the screen, local video is
 * rendered as a picture-in-picture tile. The containers are the binding
 * targets for the media runtime; the page wires them through
 * `bindLocalVideoElement` / `bindRemoteVideoElement`.
 */

export interface RtcCallVideoStageProps {
  type: "voice" | "video";
  isVideoOff: boolean;
  peerUserId?: string;
  peerName?: string;
  peerAvatar?: string;
  localMediaStatusText: string;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  remoteVideoRef: React.RefObject<HTMLDivElement | null>;
  selfText: string;
  remoteVideoText: string;
}

export function RtcCallVideoStage({
  type,
  isVideoOff,
  peerUserId,
  peerName,
  peerAvatar,
  localMediaStatusText,
  localVideoRef,
  remoteVideoRef,
  selfText,
  remoteVideoText,
}: RtcCallVideoStageProps) {
  const hasVideo = type === "video" && !isVideoOff;

  return (
    <div className="rtc-call-stage">
      {/* Remote video binding surface (always mounted so bindings stay stable). */}
      <div className="rtc-call-stage-remote" ref={remoteVideoRef} />

      {!hasVideo && (
        <div className="rtc-call-stage-remote-fallback">
          <RtcCallAvatar name={peerName} avatarUrl={peerAvatar} size="xl" />
          <span className="rtc-call-stage-remote-text">{remoteVideoText}</span>
        </div>
      )}

      {/* Local picture-in-picture tile. */}
      <div className="rtc-call-stage-local">
        <div
          ref={localVideoRef}
          className={hasVideo ? "rtc-call-stage-local-video" : "rtc-call-stage-local-hidden"}
        />
        {!hasVideo && (
          <div className="rtc-call-stage-local-fallback">{selfText}</div>
        )}
        {type === "video" && (
          <span className="rtc-call-stage-local-status">{localMediaStatusText}</span>
        )}
      </div>

      {hasVideo && !peerUserId && (
        <div className="rtc-call-stage-remote-placeholder">
          <RtcCallAvatar name={peerName} avatarUrl={peerAvatar} size="xl" />
        </div>
      )}
    </div>
  );
}
