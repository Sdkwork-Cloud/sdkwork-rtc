import {
  RTC_CALL_ENDED_SIGNAL_TYPE,
  RTC_CALL_REJECTED_SIGNAL_TYPE,
} from './call-controller-contract.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcCallSignal, RtcCallSessionSnapshot } from './call-types.js';
import type {
  RtcCallControllerDirection,
  RtcCallControllerState,
} from './call-controller-contract.js';
import type {
  RtcCallControllerSnapshot,
  RtcIncomingCallInvitation,
} from './call-controller-models.js';

export function resolveRtcCallControllerWatchState(input: {
  watchedConversationCount: number;
  activeSessionId?: string;
  controllerState: RtcCallControllerState;
}): RtcCallControllerState {
  if (!input.watchedConversationCount && !input.activeSessionId) {
    return 'idle';
  }

  if (!input.activeSessionId) {
    return 'watching';
  }

  return input.controllerState;
}

export function resolveRtcCallControllerTerminalState(
  signalType: string,
): Extract<RtcCallControllerState, 'rejected' | 'ended'> | undefined {
  if (signalType === RTC_CALL_REJECTED_SIGNAL_TYPE) {
    return 'rejected';
  }

  if (signalType === RTC_CALL_ENDED_SIGNAL_TYPE) {
    return 'ended';
  }

  return undefined;
}

export function hasRtcCallControllerActiveCall(input: {
  currentRtcSessionId?: string;
  controllerState: RtcCallControllerState;
}): boolean {
  return Boolean(
    input.currentRtcSessionId
      && input.controllerState !== 'idle'
      && input.controllerState !== 'watching'
      && input.controllerState !== 'rejected'
      && input.controllerState !== 'ended',
  );
}

export function createRtcCallControllerSnapshot(input: {
  sessionSnapshot: RtcCallSessionSnapshot;
  controllerState: RtcCallControllerState;
  watchedConversationIds: readonly string[];
  direction?: RtcCallControllerDirection;
  activeInvitation?: RtcIncomingCallInvitation;
  lastSignal?: RtcCallSignal;
  lastError?: unknown;
}): RtcCallControllerSnapshot {
  const sessionSnapshot = input.sessionSnapshot;
  const activeInvitation = input.activeInvitation;

  return freezeRtcRuntimeValue({
    ...sessionSnapshot,
    rtcSessionId: sessionSnapshot.rtcSessionId ?? activeInvitation?.rtcSessionId,
    conversationId: sessionSnapshot.conversationId ?? activeInvitation?.conversationId,
    rtcMode: sessionSnapshot.rtcMode ?? activeInvitation?.rtcMode,
    roomId: sessionSnapshot.roomId ?? activeInvitation?.roomId,
    signalingStreamId:
      sessionSnapshot.signalingStreamId ?? activeInvitation?.signalingStreamId,
    controllerState: input.controllerState,
    direction: input.direction,
    watchedConversationIds: [...input.watchedConversationIds],
    activeInvitation,
    lastSignal: input.lastSignal,
    lastError: input.lastError,
  });
}
