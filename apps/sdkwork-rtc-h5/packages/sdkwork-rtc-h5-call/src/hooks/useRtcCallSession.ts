import { useCallback, useEffect, useRef, useState } from "react";

import {
  canApplyRtcCallState,
  createIdleRtcCallSnapshot,
  createRtcRuntimeId,
  isTerminalRtcCallState,
  resolveRtcCallPeerUserId,
  toRtcCallControllerState,
  toRtcCallErrorMessage,
  toRtcCallMode,
  toRecoveredRtcCallState,
  type RtcCallDirection,
  type RtcCallSnapshot,
  type RtcCallType,
} from "../domain/callTypes";
import {
  createRtcCallMediaService,
  resolveRtcCallMediaPublishKinds,
  type RtcCallMediaJoinOptions,
  type RtcCallMediaService,
} from "../media/rtcCallMediaService";
import {
  isRtcCallSessionNotFound,
  type RtcCallParticipantCredential,
  type RtcCallSessionInfo,
  type RtcCallSignalingPort,
} from "../signaling/rtcCallSignalingPort";
import { RtcCallUnavailableError } from "../signaling/unavailableCallSignaling";

function resolveRtcCallTypeFromSession(
  session: RtcCallSessionInfo,
  fallback: RtcCallType,
): RtcCallType {
  if (session.rtcMode === "video" || session.rtcMode === "video_call") {
    return "video";
  }
  if (session.rtcMode === "voice" || session.rtcMode === "audio") {
    return "voice";
  }
  return fallback;
}

export interface UseRtcCallSessionOptions {
  /** Injected signaling port; when omitted the surface is fail-closed unavailable. */
  signaling?: RtcCallSignalingPort;
  /** Media runtime factory; defaults to the standard RTC media service. */
  mediaService?: () => RtcCallMediaService;
  type: RtcCallType;
  mode: RtcCallDirection;
  conversationId?: string;
  targetName?: string;
  targetAvatar?: string;
  targetUserId?: string;
  /** Session to recover (incoming call lifted by a watcher, or refresh restore). */
  rtcSessionId?: string;
  /** Automatically start the outgoing call when the hook mounts (outgoing mode). */
  autoStart?: boolean;
  onTerminal?: (snapshot: RtcCallSnapshot) => void;
  onError?: (message: string) => void;
}

export interface UseRtcCallSessionResult {
  snapshot: RtcCallSnapshot;
  /** True when no signaling port is injected or it is the fail-closed default. */
  isUnavailable: boolean;
  isBusy: boolean;
  durationSeconds: number;
  startOutgoing(): Promise<void>;
  acceptIncoming(): Promise<void>;
  rejectIncoming(): Promise<void>;
  endCall(): Promise<void>;
  toggleAudioMuted(): Promise<void>;
  toggleVideoMuted(): Promise<void>;
  bindLocalVideoElement(element: HTMLElement | null): Promise<void>;
  bindRemoteVideoElement(element: HTMLElement | null): Promise<void>;
}

const CALL_SESSION_ID_PREFIX = "call-h5";
const CALL_SIGNAL_STREAM_ID_PREFIX = "call-signal";

export function useRtcCallSession(options: UseRtcCallSessionOptions): UseRtcCallSessionResult {
  const {
    signaling,
    mediaService = createRtcCallMediaService,
    type,
    mode,
    conversationId,
    targetName,
    targetAvatar,
    targetUserId,
    rtcSessionId: initialRtcSessionId,
    autoStart = true,
    onTerminal,
    onError,
  } = options;

  const media = useRef<RtcCallMediaService | null>(null);
  if (!media.current) {
    media.current = mediaService();
  }

  const [snapshot, setSnapshot] = useState<RtcCallSnapshot>(() => ({
    ...createIdleRtcCallSnapshot(),
    conversationId,
    direction: mode,
    targetName,
    targetAvatar,
    targetUserId,
    type,
  }));
  const snapshotRef = useRef(snapshot);
  const [isUnavailable, setIsUnavailable] = useState(!signaling);
  const [isBusy, setIsBusy] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const busyRef = useRef(false);
  const sequenceRef = useRef(0);
  const credentialRef = useRef<RtcCallParticipantCredential | null>(null);
  const mediaReadyRef = useRef<{ rtcSessionId: string; promise: Promise<void> } | null>(null);
  const startedRef = useRef(false);

  const applySnapshot = useCallback((next: RtcCallSnapshot): void => {
    snapshotRef.current = { ...next };
    setSnapshot(snapshotRef.current);
  }, []);

  const applySession = useCallback(
    (
      session: RtcCallSessionInfo,
      sessionOptions: {
        direction?: RtcCallDirection;
        state?: RtcCallSnapshot["state"];
        participantId?: string;
        targetName?: string;
        targetAvatar?: string;
      } = {},
    ): boolean => {
      const previous = snapshotRef.current;
      const sameSession = previous.rtcSessionId === session.rtcSessionId;
      const base = sameSession ? previous : createIdleRtcCallSnapshot();
      const state = sessionOptions.state ?? toRecoveredRtcCallState(session.state);
      if (sameSession && !canApplyRtcCallState(base.state, state)) {
        return false;
      }
      const direction = sessionOptions.direction ?? (sameSession ? base.direction : undefined);
      const participantId =
        sessionOptions.participantId ?? (sameSession ? base.participantId : undefined);
      const callType = previous.type ?? resolveRtcCallTypeFromSession(session, type);
      const next: RtcCallSnapshot = {
        ...base,
        state,
        controllerState: toRtcCallControllerState(state, direction),
        conversationId: session.conversationId ?? (sameSession ? base.conversationId : undefined),
        direction,
        errorMessage: undefined,
        initiatorId: session.initiatorId ?? (sameSession ? base.initiatorId : undefined),
        accessEndpoint: session.accessEndpoint ?? (sameSession ? base.accessEndpoint : undefined),
        isParticipantCredentialReady:
          state === "connected" && sameSession ? base.isParticipantCredentialReady : false,
        participantCredentialExpiresAt:
          state === "connected" && sameSession ? base.participantCredentialExpiresAt : undefined,
        participantId,
        peerUserId:
          resolveRtcCallPeerUserId(session, participantId)
          ?? (sameSession ? base.peerUserId : undefined),
        providerKey: session.providerPluginId ?? (sameSession ? base.providerKey : undefined),
        providerRegion: session.providerRegion ?? (sameSession ? base.providerRegion : undefined),
        roomId: session.providerSessionId ?? session.rtcSessionId,
        rtcMode: session.rtcMode ?? (sameSession ? base.rtcMode : undefined),
        rtcSessionId: session.rtcSessionId,
        targetName:
          sessionOptions.targetName
          ?? (sameSession ? base.targetName : undefined),
        targetAvatar:
          sessionOptions.targetAvatar
          ?? (sameSession ? base.targetAvatar : undefined),
        type: callType,
        isAudioMuted: sameSession ? base.isAudioMuted : false,
        isVideoMuted: callType === "voice" ? true : (sameSession ? base.isVideoMuted : false),
      };
      applySnapshot(next);
      if (state !== "connected") {
        credentialRef.current = null;
        if (isTerminalRtcCallState(state)) {
          void media.current?.leave().catch(() => undefined);
          onTerminal?.(next);
        }
      }
      return true;
    },
    [applySnapshot, onTerminal, type],
  );

  const reportError = useCallback(
    (message: string) => {
      applySnapshot({
        ...snapshotRef.current,
        state: "errored",
        controllerState: "errored",
        errorMessage: message,
      });
      onError?.(message);
    },
    [applySnapshot, onError],
  );

  const isCurrentCallOperation = useCallback((sequence: number, rtcSessionId: string): boolean => {
    const current = snapshotRef.current;
    return sequence === sequenceRef.current
      && current.rtcSessionId === rtcSessionId
      && !isTerminalRtcCallState(current.state);
  }, []);

  const ensureMediaReady = useCallback(
    async (rtcSessionId: string, credential: RtcCallParticipantCredential): Promise<void> => {
      const pending = mediaReadyRef.current;
      if (pending) {
        if (pending.rtcSessionId === rtcSessionId) {
          await pending.promise;
          return;
        }
        await pending.promise.catch(() => undefined);
      }
      const promise = prepareMedia(rtcSessionId, credential);
      mediaReadyRef.current = { rtcSessionId, promise };
      try {
        await promise;
      } finally {
        if (mediaReadyRef.current?.promise === promise) {
          mediaReadyRef.current = null;
        }
      }
    },
    [],
  );

  const prepareMedia = useCallback(
    async (rtcSessionId: string, credential: RtcCallParticipantCredential): Promise<void> => {
      const isStillActive = (): boolean => {
        const current = snapshotRef.current;
        return current.rtcSessionId === rtcSessionId && current.state === "connected";
      };
      const current = snapshotRef.current;
      if (current.rtcSessionId !== rtcSessionId || current.state !== "connected") {
        return;
      }
      const participantId = current.participantId ?? credential.participantId;
      const roomId = current.roomId ?? rtcSessionId;
      if (!participantId || !roomId) {
        throw new Error("RTC media runtime requires a participant id and room id before joining.");
      }
      const joinOptions: RtcCallMediaJoinOptions = {
        accessEndpoint: current.accessEndpoint,
        sessionId: rtcSessionId,
        roomId,
        participantId,
        token: credential.credential,
        displayName: current.targetName,
        providerKey: current.providerKey,
        providerRegion: current.providerRegion,
        rtcMode: current.rtcMode,
        metadata: {
          conversationId: current.conversationId,
          direction: current.direction,
          type: current.type,
        },
      };
      try {
        await media.current?.join(joinOptions);
        if (!isStillActive()) {
          await media.current?.leave().catch(() => undefined);
          return;
        }
        const kinds = resolveRtcCallMediaPublishKinds(joinOptions);
        await media.current?.publish({ kinds, sessionId: rtcSessionId });
        if (!isStillActive()) {
          await media.current?.leave().catch(() => undefined);
          return;
        }
        if (snapshotRef.current.isAudioMuted) {
          await media.current?.muteAudio(true);
        }
        if (snapshotRef.current.isVideoMuted && kinds.includes("video")) {
          await media.current?.muteVideo(true);
        }
      } catch (error) {
        const shouldReport = isStillActive();
        await media.current?.leave().catch(() => undefined);
        if (shouldReport) {
          reportError(toRtcCallErrorMessage(error));
        }
      }
    },
    [reportError],
  );

  const ensureParticipantCredentialReady = useCallback(
    async (rtcSessionId: string): Promise<void> => {
      if (!signaling) {
        throw new RtcCallUnavailableError();
      }
      const cached = credentialRef.current;
      if (
        cached?.rtcSessionId === rtcSessionId
        && snapshotRef.current.isParticipantCredentialReady
        && snapshotRef.current.rtcSessionId === rtcSessionId
      ) {
        await ensureMediaReady(rtcSessionId, cached);
        return;
      }
      const participantId = snapshotRef.current.participantId;
      const credential = await signaling.issueParticipantCredential(rtcSessionId, {
        participantId: participantId ?? "",
      });
      if (
        snapshotRef.current.rtcSessionId !== rtcSessionId
        || snapshotRef.current.state !== "connected"
      ) {
        return;
      }
      credentialRef.current = credential;
      applySnapshot({
        ...snapshotRef.current,
        isParticipantCredentialReady: true,
        participantCredentialExpiresAt: credential.expiresAt,
        participantId: credential.participantId || participantId,
      });
      await ensureMediaReady(rtcSessionId, credential);
    },
    [applySnapshot, ensureMediaReady, signaling],
  );

  const recoverSession = useCallback(
    async (rtcSessionId: string): Promise<void> => {
      if (!signaling) {
        setIsUnavailable(true);
        return;
      }
      const sequence = ++sequenceRef.current;
      try {
        const session = await signaling.retrieve(rtcSessionId);
        if (sequence !== sequenceRef.current) {
          return;
        }
        const applied = applySession(session, {
          direction: snapshotRef.current.direction,
          state: toRecoveredRtcCallState(session.state),
        });
        if (applied && snapshotRef.current.state === "connected") {
          await ensureParticipantCredentialReady(rtcSessionId).catch((error) => {
            if (
              snapshotRef.current.rtcSessionId !== rtcSessionId
              || snapshotRef.current.state !== "connected"
            ) {
              return;
            }
            reportError(toRtcCallErrorMessage(error));
          });
        }
      } catch (error) {
        if (sequence !== sequenceRef.current) {
          return;
        }
        const treatAsEnded = isRtcCallSessionNotFound(error);
        applySnapshot({
          ...snapshotRef.current,
          state: treatAsEnded ? "ended" : "errored",
          controllerState: treatAsEnded ? "ended" : "errored",
          errorMessage: treatAsEnded ? undefined : toRtcCallErrorMessage(error),
        });
        if (treatAsEnded) {
          onTerminal?.(snapshotRef.current);
        }
      }
    },
    [applySession, applySnapshot, ensureParticipantCredentialReady, onTerminal, reportError, signaling],
  );

  const startOutgoing = useCallback(async (): Promise<void> => {
    if (busyRef.current || startedRef.current) {
      return;
    }
    if (!signaling) {
      setIsUnavailable(true);
      return;
    }
    if (snapshotRef.current.rtcSessionId) {
      return;
    }
    busyRef.current = true;
    setIsBusy(true);
    startedRef.current = true;
    const sequence = ++sequenceRef.current;
    const rtcSessionId = createRtcRuntimeId(CALL_SESSION_ID_PREFIX, conversationId ?? "conversation");
    const signalingStreamId = createRtcRuntimeId(CALL_SIGNAL_STREAM_ID_PREFIX, rtcSessionId);
    const rtcMode = toRtcCallMode(type);
    applySnapshot({
      ...createIdleRtcCallSnapshot(),
      state: "ringing",
      controllerState: "outgoing_ringing",
      conversationId,
      direction: "outgoing",
      peerUserId: targetUserId,
      rtcMode,
      rtcSessionId,
      roomId: rtcSessionId,
      targetName,
      targetAvatar,
      targetUserId,
      type,
      isVideoMuted: type === "voice",
    });

    try {
      const created = await signaling.startOutgoingCall({
        conversationId,
        rtcMode,
        rtcSessionId,
        signalingStreamId,
      });
      if (!isCurrentCallOperation(sequence, rtcSessionId)) {
        return;
      }
      applySession(created, { direction: "outgoing", state: "ringing" });
    } catch (error) {
      if (error instanceof RtcCallUnavailableError) {
        setIsUnavailable(true);
        return;
      }
      if (sequence === sequenceRef.current) {
        applySnapshot({
          ...snapshotRef.current,
          state: "errored",
          controllerState: "errored",
          errorMessage: toRtcCallErrorMessage(error),
        });
        onError?.(toRtcCallErrorMessage(error));
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, [
    applySession,
    applySnapshot,
    conversationId,
    onError,
    signaling,
    targetAvatar,
    targetName,
    targetUserId,
    type,
  ]);

  const acceptIncoming = useCallback(async (): Promise<void> => {
    const rtcSessionId = snapshotRef.current.rtcSessionId;
    if (!rtcSessionId) {
      reportError("Incoming call is not available.");
      return;
    }
    if (!signaling) {
      setIsUnavailable(true);
      return;
    }
    busyRef.current = true;
    setIsBusy(true);
    const sequence = ++sequenceRef.current;
    try {
      const accepted = await signaling.accept(rtcSessionId);
      if (
        sequence !== sequenceRef.current
        || snapshotRef.current.rtcSessionId !== rtcSessionId
        || isTerminalRtcCallState(snapshotRef.current.state)
      ) {
        return;
      }
      applySession(accepted, {
        direction: snapshotRef.current.direction ?? "incoming",
        state: "connected",
      });
      await ensureParticipantCredentialReady(rtcSessionId);
    } catch (error) {
      if (
        sequence !== sequenceRef.current
        || snapshotRef.current.rtcSessionId !== rtcSessionId
        || isTerminalRtcCallState(snapshotRef.current.state)
      ) {
        return;
      }
      const treatAsEnded = isRtcCallSessionNotFound(error);
      applySnapshot({
        ...snapshotRef.current,
        state: treatAsEnded ? "ended" : "errored",
        controllerState: treatAsEnded ? "ended" : "errored",
        errorMessage: treatAsEnded ? undefined : toRtcCallErrorMessage(error),
      });
      if (treatAsEnded) {
        await media.current?.leave().catch(() => undefined);
        onTerminal?.(snapshotRef.current);
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, [
    applySession,
    applySnapshot,
    ensureParticipantCredentialReady,
    onTerminal,
    reportError,
    signaling,
  ]);

  const rejectIncoming = useCallback(async (): Promise<void> => {
    const rtcSessionId = snapshotRef.current.rtcSessionId;
    if (!rtcSessionId) {
      reportError("Incoming call is not available.");
      return;
    }
    if (!signaling) {
      setIsUnavailable(true);
      return;
    }
    busyRef.current = true;
    setIsBusy(true);
    const sequence = ++sequenceRef.current;
    try {
      const rejected = await signaling.reject(rtcSessionId);
      if (
        sequence !== sequenceRef.current
        || snapshotRef.current.rtcSessionId !== rtcSessionId
        || isTerminalRtcCallState(snapshotRef.current.state)
      ) {
        return;
      }
      applySession(rejected, {
        direction: snapshotRef.current.direction ?? "incoming",
        state: "rejected",
      });
      await media.current?.leave().catch(() => undefined);
    } catch (error) {
      if (
        sequence !== sequenceRef.current
        || snapshotRef.current.rtcSessionId !== rtcSessionId
        || isTerminalRtcCallState(snapshotRef.current.state)
      ) {
        return;
      }
      const treatAsRejected = isRtcCallSessionNotFound(error);
      applySnapshot({
        ...snapshotRef.current,
        state: treatAsRejected ? "rejected" : "errored",
        controllerState: treatAsRejected ? "rejected" : "errored",
        errorMessage: treatAsRejected ? undefined : toRtcCallErrorMessage(error),
      });
      if (treatAsRejected) {
        await media.current?.leave().catch(() => undefined);
        onTerminal?.(snapshotRef.current);
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, [applySession, applySnapshot, onTerminal, reportError, signaling]);

  const endCall = useCallback(async (): Promise<void> => {
    const rtcSessionId = snapshotRef.current.rtcSessionId;
    if (!rtcSessionId) {
      applySnapshot({
        ...snapshotRef.current,
        state: snapshotRef.current.state === "idle" ? "idle" : "ended",
        controllerState: snapshotRef.current.state === "idle" ? "idle" : "ended",
      });
      return;
    }
    if (!signaling) {
      setIsUnavailable(true);
      return;
    }
    busyRef.current = true;
    setIsBusy(true);
    const sequence = ++sequenceRef.current;
    try {
      const ended = await signaling.end(rtcSessionId);
      if (
        sequence !== sequenceRef.current
        || snapshotRef.current.rtcSessionId !== rtcSessionId
        || isTerminalRtcCallState(snapshotRef.current.state)
      ) {
        await media.current?.leave().catch(() => undefined);
        return;
      }
      applySession(ended, { direction: snapshotRef.current.direction, state: "ended" });
      await media.current?.leave().catch(() => undefined);
    } catch (error) {
      await media.current?.leave().catch(() => undefined);
      if (
        sequence !== sequenceRef.current
        || snapshotRef.current.rtcSessionId !== rtcSessionId
        || isTerminalRtcCallState(snapshotRef.current.state)
      ) {
        return;
      }
      const treatAsEnded = isRtcCallSessionNotFound(error);
      applySnapshot({
        ...snapshotRef.current,
        state: treatAsEnded ? "ended" : "errored",
        controllerState: treatAsEnded ? "ended" : "errored",
        errorMessage: treatAsEnded ? undefined : toRtcCallErrorMessage(error),
        isParticipantCredentialReady: false,
        participantCredentialExpiresAt: undefined,
      });
      if (treatAsEnded) {
        onTerminal?.(snapshotRef.current);
      }
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, [applySession, applySnapshot, onTerminal, signaling]);

  const toggleAudioMuted = useCallback(async (): Promise<void> => {
    const nextMuted = !snapshotRef.current.isAudioMuted;
    const previous = snapshotRef.current.isAudioMuted;
    applySnapshot({ ...snapshotRef.current, isAudioMuted: nextMuted });
    try {
      await media.current?.muteAudio(nextMuted);
    } catch (error) {
      if (snapshotRef.current.isAudioMuted === nextMuted) {
        applySnapshot({ ...snapshotRef.current, isAudioMuted: previous });
      }
      onError?.(toRtcCallErrorMessage(error));
    }
  }, [applySnapshot, onError]);

  const toggleVideoMuted = useCallback(async (): Promise<void> => {
    const nextMuted = !snapshotRef.current.isVideoMuted;
    const previous = snapshotRef.current.isVideoMuted;
    applySnapshot({ ...snapshotRef.current, isVideoMuted: nextMuted });
    try {
      await media.current?.muteVideo(nextMuted);
    } catch (error) {
      if (snapshotRef.current.isVideoMuted === nextMuted) {
        applySnapshot({ ...snapshotRef.current, isVideoMuted: previous });
      }
      onError?.(toRtcCallErrorMessage(error));
    }
  }, [applySnapshot, onError]);

  const bindLocalVideoElement = useCallback(async (element: HTMLElement | null): Promise<void> => {
    await media.current?.bindLocalVideoElement(element);
  }, []);

  const bindRemoteVideoElement = useCallback(async (element: HTMLElement | null): Promise<void> => {
    await media.current?.bindRemoteVideoElement(snapshotRef.current.peerUserId, element);
  }, []);

  // Initial flow: recover an incoming/restored session, or auto-start an outgoing call.
  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    if (mode === "incoming") {
      if (initialRtcSessionId) {
        void recoverSession(initialRtcSessionId);
      } else {
        void signaling?.watchIncoming({ conversationIds: [], principalId: "" })
          .then((session) => {
            if (session) {
              const sequence = ++sequenceRef.current;
              const applied = applySession(session, {
                direction: "incoming",
                state: toRecoveredRtcCallState(session.state),
              });
              if (applied && snapshotRef.current.state === "connected") {
                void ensureParticipantCredentialReady(session.rtcSessionId).catch((error) => {
                  if (snapshotRef.current.rtcSessionId === session.rtcSessionId) {
                    reportError(toRtcCallErrorMessage(error));
                  }
                });
              }
            } else {
              reportError("Incoming call is not available.");
            }
          })
          .catch(() => {
            if (snapshotRef.current.rtcSessionId) {
              return;
            }
            reportError("Incoming call is not available.");
          });
      }
    } else if (autoStart && !initialRtcSessionId) {
      void startOutgoing();
    }
    // Mount-only; signaling recovery is a one-shot operation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live session event subscription (accepted / rejected / ended from the peer).
  useEffect(() => {
    if (!signaling) {
      return undefined;
    }
    return signaling.subscribe((session) => {
      const current = snapshotRef.current;
      if (current.rtcSessionId && current.rtcSessionId === session.rtcSessionId) {
        const applied = applySession(session, {
          direction: current.direction,
          participantId: current.participantId,
        });
        if (applied && snapshotRef.current.state === "connected") {
          void ensureParticipantCredentialReady(session.rtcSessionId).catch((error) => {
            if (snapshotRef.current.rtcSessionId !== session.rtcSessionId) {
              return;
            }
            reportError(toRtcCallErrorMessage(error));
          });
        }
      }
    });
  }, [applySession, ensureParticipantCredentialReady, reportError, signaling]);

  // Call duration timer while connected.
  useEffect(() => {
    if (snapshot.state !== "connected") {
      setDurationSeconds(0);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setDurationSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [snapshot.state]);

  // Release media on unmount.
  useEffect(() => {
    return () => {
      void media.current?.leave().catch(() => undefined);
    };
  }, []);

  return {
    snapshot,
    isUnavailable,
    isBusy,
    durationSeconds,
    startOutgoing,
    acceptIncoming,
    rejectIncoming,
    endCall,
    toggleAudioMuted,
    toggleVideoMuted,
    bindLocalVideoElement,
    bindRemoteVideoElement,
  };
}
