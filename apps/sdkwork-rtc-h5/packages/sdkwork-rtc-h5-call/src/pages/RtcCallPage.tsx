import { useEffect, useRef, useState } from "react";

import { RtcCallScreen, resolveRtcCallScreenPhase } from "../components/CallScreen";
import type { RtcCallDirection, RtcCallType } from "../domain/callTypes";
import { useRtcCallSession } from "../hooks/useRtcCallSession";
import type { RtcCallI18nTexts } from "../i18n";
import {
  RtcCallI18nProvider,
  useRtcCallI18n,
  type RtcCallLocale,
} from "../i18n/rtcCallI18n";
import type { RtcCallSignalingPort } from "../signaling/rtcCallSignalingPort";

/**
 * Page-level call surface. Renders the full-screen call UI and drives the
 * session hook. `signaling` is injected by the host application; without it
 * the page is fail-closed unavailable (product requirement — never simulate).
 */

export interface RtcCallPageProps {
  type: RtcCallType;
  mode?: RtcCallDirection;
  /** Injected signaling port (IM H5 adapter, or omitted for fail-closed). */
  signaling?: RtcCallSignalingPort;
  conversationId?: string;
  targetName?: string;
  targetAvatar?: string;
  targetUserId?: string;
  /** Session to recover (incoming call lifted by a watcher, or refresh restore). */
  rtcSessionId?: string;
  /** Auto-start the outgoing call on mount (default true for outgoing mode). */
  autoStart?: boolean;
  /** How long the finished phase stays visible before auto-exit (ms). */
  finishedAutoExitMs?: number;
  locale?: RtcCallLocale;
  texts?: Partial<RtcCallI18nTexts>;
  onExit: () => void;
  onError?: (message: string) => void;
}

const DEFAULT_FINISHED_AUTO_EXIT_MS = 2000;

function RtcCallPageContent(props: RtcCallPageProps) {
  const {
    type,
    mode = "outgoing",
    signaling,
    conversationId,
    targetName,
    targetAvatar,
    targetUserId,
    rtcSessionId,
    autoStart,
    finishedAutoExitMs = DEFAULT_FINISHED_AUTO_EXIT_MS,
    onExit,
    onError,
  } = props;

  const texts = useRtcCallI18n();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const session = useRtcCallSession({
    signaling,
    type,
    mode,
    conversationId,
    targetName,
    targetAvatar,
    targetUserId,
    rtcSessionId,
    autoStart,
    onError: (message) => {
      onError?.(message);
      showToast(message);
    },
  });

  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const autoExitedRef = useRef(false);
  const isVideoCall = type === "video";
  const {
    bindLocalVideoElement,
    bindRemoteVideoElement,
    snapshot,
    durationSeconds,
    isBusy,
    isUnavailable,
  } = session;

  function showToast(message: string): void {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2600);
  }

  // Bind local video while the camera is live on a video call.
  useEffect(() => {
    const isConnected = snapshot.state === "connected";
    if (!isConnected || !isVideoCall || snapshot.isVideoMuted) {
      void bindLocalVideoElement(null).catch(() => undefined);
      return;
    }
    void bindLocalVideoElement(localVideoRef.current).catch(() => {
      showToast(texts.toast.localVideoBindFailed);
    });
  }, [bindLocalVideoElement, isVideoCall, snapshot.isVideoMuted, snapshot.state, texts.toast.localVideoBindFailed]);

  // Bind remote video once the peer user is known.
  useEffect(() => {
    const isConnected = snapshot.state === "connected";
    if (!isConnected || !isVideoCall || !snapshot.peerUserId) {
      void bindRemoteVideoElement(null).catch(() => undefined);
      return;
    }
    void bindRemoteVideoElement(remoteVideoRef.current).catch(() => {
      showToast(texts.toast.remoteVideoBindFailed);
    });
  }, [bindRemoteVideoElement, isVideoCall, snapshot.peerUserId, snapshot.state, texts.toast.remoteVideoBindFailed]);

  // Auto-exit shortly after a terminal state so the user never stares at a dead screen.
  useEffect(() => {
    const isTerminal =
      session.snapshot.state === "ended"
      || snapshot.state === "rejected"
      || snapshot.state === "errored";
    if (!isTerminal || autoExitedRef.current) {
      return undefined;
    }
    autoExitedRef.current = true;
    const timer = setTimeout(() => {
      onExit();
    }, finishedAutoExitMs);
    return () => clearTimeout(timer);
  }, [finishedAutoExitMs, onExit, snapshot.state]);

  const phase = resolveRtcCallScreenPhase(snapshot, isUnavailable);

  const handleShareScreen = (): void => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      showToast(texts.toast.screenShareUnsupported);
      return;
    }
    void navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then(() => showToast(texts.toast.screenShareStarted))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "";
        showToast(
          message.includes("display-capture")
            ? texts.toast.screenShareDenied
            : texts.toast.screenShareCancelled,
        );
      });
  };

  return (
    <div className="rtc-call-root">
      <RtcCallScreen
        phase={phase}
        snapshot={snapshot}
        durationSeconds={durationSeconds}
        isBusy={isBusy}
        texts={texts}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onAccept={() => void session.acceptIncoming().catch(() => undefined)}
        onReject={() => void session.rejectIncoming().catch(() => undefined)}
        onCancel={() => void session.endCall().finally(() => undefined)}
        onHangup={() => void session.endCall().finally(() => undefined)}
        onClose={onExit}
        onToggleAudio={() => void session.toggleAudioMuted().catch(() => undefined)}
        onToggleVideo={() => void session.toggleVideoMuted().catch(() => undefined)}
        onShareScreen={handleShareScreen}
      />
      {toastMessage && (
        <div className="rtc-call-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export function RtcCallPage(props: RtcCallPageProps) {
  return (
    <RtcCallI18nProvider locale={props.locale} texts={props.texts}>
      <RtcCallPageContent {...props} />
    </RtcCallI18nProvider>
  );
}
