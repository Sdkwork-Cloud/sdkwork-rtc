import { ChevronLeft, VideoOff } from "lucide-react";

import type { RtcCallControllerState, RtcCallSnapshot } from "../domain/callTypes";
import { formatRtcCallDuration } from "../domain/callTypes";
import { RtcCallAvatar } from "./CallAvatar";
import { RtcCallControlsBar } from "./CallControlsBar";
import { RtcCallVideoStage } from "./CallVideoStage";

/**
 * Full-screen mobile call surface.
 *
 * Phases (mirror of the desktop overlay contract):
 *   unavailable        — fail-closed: no signaling injected
 *   incoming-ringing   — avatar + accept/reject
 *   outgoing-ringing   — avatar + status + cancel (+ mute for video calls)
 *   connecting         — avatar + connecting status
 *   connected          — video stage (remote + local PiP) or avatar for voice
 *   finished           — terminal status + close (auto-exits after a beat)
 */

export type RtcCallScreenPhase =
  | "unavailable"
  | "incoming-ringing"
  | "outgoing-ringing"
  | "connecting"
  | "connected"
  | "finished";

export function resolveRtcCallScreenPhase(
  snapshot: RtcCallSnapshot,
  isUnavailable: boolean,
): RtcCallScreenPhase {
  if (isUnavailable) {
    return "unavailable";
  }
  const controllerState = snapshot.controllerState ?? "idle";
  if (controllerState === "incoming_ringing") {
    return "incoming-ringing";
  }
  if (controllerState === "outgoing_ringing") {
    return "outgoing-ringing";
  }
  if (controllerState === "connecting") {
    return "connecting";
  }
  if (controllerState === "connected") {
    return "connected";
  }
  if (
    controllerState === "ended"
    || controllerState === "rejected"
    || controllerState === "errored"
  ) {
    return "finished";
  }
  // idle / watching fall through to a waiting surface.
  return snapshot.state === "idle" ? "connecting" : "finished";
}

export interface RtcCallScreenTexts {
  call: { video: string; voice: string };
  status: {
    connecting: string;
    waitingAnswer: string;
    inviting: string;
    ended: string;
    rejected: string;
    connectionFailed: string;
    unavailableTitle: string;
    unavailableDesc: string;
  };
  media: {
    micOn: string;
    micOff: string;
    cameraOn: string;
    cameraOff: string;
    self: string;
    remoteVideo: string;
  };
  actions: {
    accept: string;
    reject: string;
    cancel: string;
    hangup: string;
    close: string;
    mute: string;
    unmute: string;
    enableVideo: string;
    disableVideo: string;
    shareScreen: string;
  };
}

export interface RtcCallScreenProps {
  phase: RtcCallScreenPhase;
  snapshot: RtcCallSnapshot;
  durationSeconds: number;
  isBusy: boolean;
  texts: RtcCallScreenTexts;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  remoteVideoRef: React.RefObject<HTMLDivElement | null>;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onHangup: () => void;
  onClose: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
}

export function RtcCallScreen({
  phase,
  snapshot,
  durationSeconds,
  isBusy,
  texts,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onReject,
  onCancel,
  onHangup,
  onClose,
  onToggleAudio,
  onToggleVideo,
  onShareScreen,
}: RtcCallScreenProps) {
  const { type = "voice", targetName, targetAvatar, isAudioMuted, isVideoMuted } = snapshot;
  const isVoice = type === "voice";
  const isVideoOff = isVoice || isVideoMuted;
  const isConnected = phase === "connected";
  const showCallerInfo = !isConnected || isVideoOff;

  const statusText =
    phase === "connecting"
      ? texts.status.connecting
      : phase === "outgoing-ringing"
        ? snapshot.state === "connecting"
          ? texts.status.connecting
          : texts.status.waitingAnswer
        : phase === "finished"
          ? snapshot.state === "rejected"
            ? texts.status.rejected
            : snapshot.state === "errored"
              ? snapshot.errorMessage ?? texts.status.connectionFailed
              : texts.status.ended
          : phase === "incoming-ringing"
            ? texts.status.inviting
            : "";

  const localMediaStatusText = isVoice
    ? isAudioMuted ? texts.media.micOff : texts.media.micOn
    : `${isAudioMuted ? texts.media.micOff : texts.media.micOn} · ${isVideoOff ? texts.media.cameraOff : texts.media.cameraOn}`;

  const controllerState = (snapshot.controllerState ?? "idle") as RtcCallControllerState;
  const controlsTexts = {
    accept: texts.actions.accept,
    reject: texts.actions.reject,
    cancel: texts.actions.cancel,
    hangup: texts.actions.hangup,
    close: texts.actions.close,
    mute: texts.actions.mute,
    unmute: texts.actions.unmute,
    enableVideo: texts.actions.enableVideo,
    disableVideo: texts.actions.disableVideo,
    shareScreen: texts.actions.shareScreen,
  };

  if (phase === "unavailable") {
    return (
      <div className="rtc-call-screen rtc-call-screen-unavailable">
        <button type="button" className="rtc-call-back" onClick={onClose} aria-label={texts.actions.close}>
          <ChevronLeft size={24} />
        </button>
        <div className="rtc-call-unavailable-body">
          <VideoOff size={48} className="rtc-call-unavailable-icon" />
          <h2 className="rtc-call-unavailable-title">{texts.status.unavailableTitle}</h2>
          <p className="rtc-call-unavailable-desc">{texts.status.unavailableDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rtc-call-screen rtc-call-phase-${phase}`}>
      {/* Header */}
      <header className="rtc-call-header">
        <span className="rtc-call-title">
          {isVoice ? texts.call.voice : texts.call.video}
        </span>
        {phase === "connected" && (
          <span className="rtc-call-duration">{formatRtcCallDuration(durationSeconds)}</span>
        )}
      </header>

      {/* Main content */}
      <main className="rtc-call-main">
        {showCallerInfo ? (
          <div className="rtc-call-caller">
            <div className="rtc-call-caller-avatar">
              <RtcCallAvatar
                name={targetName}
                avatarUrl={targetAvatar}
                size={phase === "finished" ? "lg" : "xl"}
                ringing={phase === "incoming-ringing" || phase === "outgoing-ringing"}
              />
            </div>
            <h2 className="rtc-call-caller-name" title={targetName}>
              {targetName || "…"}
            </h2>
            <p className="rtc-call-status-text">
              {phase === "connected" && !isVoice
                ? formatRtcCallDuration(durationSeconds)
                : statusText}
            </p>
            {isVoice && phase === "connected" && (
              <p className="rtc-call-local-media-status">{localMediaStatusText}</p>
            )}
            {phase === "outgoing-ringing" && type === "video" && (
              <p className="rtc-call-local-media-status">{localMediaStatusText}</p>
            )}
          </div>
        ) : (
          <RtcCallVideoStage
            type={type}
            isVideoOff={isVideoOff}
            peerUserId={snapshot.peerUserId}
            peerName={targetName}
            peerAvatar={targetAvatar}
            localMediaStatusText={localMediaStatusText}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            selfText={texts.media.self}
            remoteVideoText={texts.media.remoteVideo}
          />
        )}
      </main>

      {/* Controls */}
      <RtcCallControlsBar
        controllerState={controllerState}
        type={type}
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        canShareScreen={phase === "connected" && type === "video"}
        isBusy={isBusy}
        texts={controlsTexts}
        onAccept={onAccept}
        onReject={onReject}
        onCancel={onCancel}
        onHangup={onHangup}
        onClose={onClose}
        onToggleAudio={onToggleAudio}
        onToggleVideo={onToggleVideo}
        onShareScreen={onShareScreen}
      />
    </div>
  );
}
