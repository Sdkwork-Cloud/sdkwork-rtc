/**
 * RTC call domain types and pure state machine helpers.
 *
 * This module is the authoritative, UI-agnostic call domain for the mobile-browser
 * call surface. It intentionally depends on nothing but ECMAScript: signaling and
 * media implementations are injected by the host application through ports.
 */

export type RtcCallType = "voice" | "video";

export type RtcCallDirection = "incoming" | "outgoing";

export type RtcCallState =
  | "idle"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "rejected"
  | "errored";

export type RtcCallControllerState =
  | "idle"
  | "watching"
  | "incoming_ringing"
  | "outgoing_ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "rejected"
  | "errored";

export interface RtcCallSnapshot {
  accessEndpoint?: string;
  state: RtcCallState;
  controllerState?: RtcCallControllerState;
  conversationId?: string;
  direction?: RtcCallDirection;
  errorMessage?: string;
  initiatorId?: string;
  isParticipantCredentialReady?: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  participantCredentialExpiresAt?: string;
  participantId?: string;
  peerUserId?: string;
  providerKey?: string;
  providerRegion?: string;
  roomId?: string;
  rtcMode?: string;
  rtcSessionId?: string;
  targetName?: string;
  targetAvatar?: string;
  targetUserId?: string;
  type?: RtcCallType;
  durationSeconds?: number;
}

export type RtcCallTerminalState = "ended" | "rejected" | "errored";

export function createIdleRtcCallSnapshot(): RtcCallSnapshot {
  return {
    state: "idle",
    controllerState: "idle",
    isAudioMuted: false,
    isVideoMuted: false,
    durationSeconds: 0,
  };
}

export function isTerminalRtcCallState(
  state: RtcCallState,
): state is RtcCallTerminalState {
  return state === "ended" || state === "rejected" || state === "errored";
}

/**
 * Call states may only move forward (idle < ringing < connecting < connected).
 * Terminal states are absorbing; any non-terminal state may move into a
 * terminal state. Guards against stale out-of-order signaling events.
 */
const ACTIVE_RTC_CALL_STATE_ORDER: Record<
  Exclude<RtcCallState, RtcCallTerminalState>,
  number
> = {
  idle: 0,
  ringing: 1,
  connecting: 2,
  connected: 3,
};

export function canApplyRtcCallState(current: RtcCallState, next: RtcCallState): boolean {
  if (isTerminalRtcCallState(current)) {
    return current === next;
  }
  if (isTerminalRtcCallState(next)) {
    return true;
  }
  return ACTIVE_RTC_CALL_STATE_ORDER[next] >= ACTIVE_RTC_CALL_STATE_ORDER[current];
}

export function toRtcCallControllerState(
  state: RtcCallState,
  direction?: RtcCallDirection,
): RtcCallControllerState {
  switch (state) {
    case "ringing":
      return direction === "incoming" ? "incoming_ringing" : "outgoing_ringing";
    case "connecting":
    case "connected":
    case "ended":
    case "rejected":
    case "errored":
      return state;
    case "idle":
    default:
      return "idle";
  }
}

export function isRtcCallActive(
  snapshot: Pick<RtcCallSnapshot, "rtcSessionId" | "controllerState" | "state">,
): boolean {
  return Boolean(
    snapshot.rtcSessionId
      && snapshot.controllerState !== "watching"
      && !isTerminalRtcCallState(snapshot.state),
  );
}

/**
 * Normalizes a service state string into the domain state.
 * Unknown states keep ringing semantics so the caller still gets an answer
 * surface instead of a silent drop.
 */
export function toRecoveredRtcCallState(state: string | undefined): RtcCallState {
  switch (state) {
    case "accepted":
    case "connecting":
    case "connected":
    case "on_hold":
    case "reconnecting":
      return "connected";
    case "rejected":
      return "rejected";
    case "ended":
    case "canceled":
    case "failed":
    case "timeout":
      return "ended";
    case "started":
    case "initiating":
    case "ringing":
    default:
      return "ringing";
  }
}

export function resolveRtcCallType(rtcMode: string | undefined): RtcCallType {
  return rtcMode === "video" || rtcMode === "video_call" ? "video" : "voice";
}

export function toRtcCallMode(type: RtcCallType): string {
  return type === "video" ? "video" : "voice";
}

/** The peer of a 1:1 call is the initiator unless the local participant initiated. */
export function resolveRtcCallPeerUserId(
  session: { initiatorId?: string | null },
  participantId: string | undefined,
): string | undefined {
  if (!session.initiatorId) {
    return undefined;
  }
  if (!participantId || session.initiatorId !== participantId) {
    return session.initiatorId;
  }
  return undefined;
}

export function normalizeRtcIdSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);
}

export function createRtcRuntimeId(prefix: string, stablePart: string): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${normalizeRtcIdSegment(stablePart) || "conversation"}-${randomPart}`;
}

export function formatRtcCallDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds >= 0
    ? Math.floor(totalSeconds)
    : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function toRtcCallErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return typeof error === "string" && error.trim().length > 0
    ? error
    : "Call signaling failed.";
}
