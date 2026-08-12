import { Mic, MicOff, MonitorUp, Phone, PhoneOff, Video, VideoOff, X } from "lucide-react";

import type { RtcCallControllerState } from "../domain/callTypes";
import { RtcCallControlButton } from "./CallControlButton";

/**
 * Bottom controls bar. Buttons are derived from the controller phase so each
 * phase exposes exactly the actions the product allows (mirrors the desktop
 * overlay contract): accept/reject while incoming-ringing, cancel while
 * outgoing-ringing, hangup while connected, close when finished.
 */

export interface RtcCallControlsBarProps {
  controllerState: RtcCallControllerState;
  type: "voice" | "video";
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  canShareScreen: boolean;
  isBusy: boolean;
  texts: {
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
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onHangup: () => void;
  onClose: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
}

export function RtcCallControlsBar({
  controllerState,
  type,
  isAudioMuted,
  isVideoMuted,
  canShareScreen,
  isBusy,
  texts,
  onAccept,
  onReject,
  onCancel,
  onHangup,
  onClose,
  onToggleAudio,
  onToggleVideo,
  onShareScreen,
}: RtcCallControlsBarProps) {
  const isIncomingRinging = controllerState === "incoming_ringing";
  const isOutgoingRinging = controllerState === "outgoing_ringing";
  const isConnected = controllerState === "connected";
  const isFinished =
    controllerState === "ended"
    || controllerState === "rejected"
    || controllerState === "errored";
  const canControlLocalMedia = isConnected || isOutgoingRinging;
  const canToggleAudio = canControlLocalMedia;
  const canToggleVideo = canControlLocalMedia && type === "video";

  return (
    <div className="rtc-call-controls">
      {isIncomingRinging && (
        <>
          <RtcCallControlButton
            size="md"
            variant="default"
            icon={<Phone size={26} />}
            label={texts.accept}
            title={texts.accept}
            disabled={isBusy}
            onClick={onAccept}
          />
          <RtcCallControlButton
            size="md"
            variant="danger"
            icon={<PhoneOff size={26} />}
            label={texts.reject}
            title={texts.reject}
            disabled={isBusy}
            onClick={onReject}
          />
        </>
      )}

      {isOutgoingRinging && (
        <>
          {canToggleAudio && (
            <RtcCallControlButton
              size="md"
              variant={isAudioMuted ? "active" : "default"}
              icon={isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
              label={isAudioMuted ? texts.unmute : texts.mute}
              title={isAudioMuted ? texts.unmute : texts.mute}
              onClick={onToggleAudio}
            />
          )}
          <RtcCallControlButton
            size="md"
            variant="danger"
            icon={<PhoneOff size={26} />}
            label={texts.cancel}
            title={texts.cancel}
            disabled={isBusy}
            onClick={onCancel}
          />
        </>
      )}

      {isConnected && (
        <>
          {canToggleAudio && (
            <RtcCallControlButton
              size="md"
              variant={isAudioMuted ? "active" : "default"}
              icon={isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
              label={isAudioMuted ? texts.unmute : texts.mute}
              title={isAudioMuted ? texts.unmute : texts.mute}
              onClick={onToggleAudio}
            />
          )}
          {canToggleVideo && (
            <RtcCallControlButton
              size="md"
              variant={isVideoMuted ? "active" : "default"}
              icon={isVideoMuted ? <VideoOff size={22} /> : <Video size={22} />}
              label={isVideoMuted ? texts.enableVideo : texts.disableVideo}
              title={isVideoMuted ? texts.enableVideo : texts.disableVideo}
              onClick={onToggleVideo}
            />
          )}
          {canShareScreen && (
            <RtcCallControlButton
              size="md"
              variant="default"
              icon={<MonitorUp size={22} />}
              label={texts.shareScreen}
              title={texts.shareScreen}
              onClick={onShareScreen}
            />
          )}
          <RtcCallControlButton
            size="md"
            variant="danger"
            icon={<PhoneOff size={26} />}
            label={texts.hangup}
            title={texts.hangup}
            disabled={isBusy}
            onClick={onHangup}
          />
        </>
      )}

      {isFinished && (
        <RtcCallControlButton
          size="md"
          variant="danger"
          icon={<X size={24} />}
          label={texts.close}
          title={texts.close}
          onClick={onClose}
        />
      )}
    </div>
  );
}
