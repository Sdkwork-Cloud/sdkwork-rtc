import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcCallSessionRecord,
  RtcCallSessionSnapshot,
  RtcCallSignal,
  RtcCallSignalSendOptions,
} from './call-types.js';
import type { RtcCallControllerState } from './call-controller-contract.js';
import type {
  RtcCallControllerAcceptOptions,
  RtcCallControllerEndOptions,
  RtcCallControllerOutgoingOptions,
  RtcCallControllerRejectOptions,
  RtcCallInvitePayload,
  RtcCallLifecyclePayload,
  RtcIncomingCallInvitation,
} from './call-controller-models.js';

type RtcCallControllerTerminalState = Extract<RtcCallControllerState, 'rejected' | 'ended'>;

export function createRtcCallControllerOutgoingInvitationPayload(input: {
  options: RtcCallControllerOutgoingOptions;
  sessionSnapshot: Pick<RtcCallSessionSnapshot, 'roomId' | 'signalingStreamId'>;
  sentAt: string;
}): RtcCallInvitePayload {
  return freezeRtcRuntimeValue({
    rtcSessionId: input.options.rtcSessionId,
    conversationId: input.options.conversationId,
    rtcMode: input.options.rtcMode,
    roomId:
      input.sessionSnapshot.roomId ?? input.options.roomId ?? input.options.rtcSessionId,
    signalingStreamId:
      input.sessionSnapshot.signalingStreamId ?? input.options.signalingStreamId,
    initiatorId: input.options.participantId,
    initiatorDisplayName: input.options.initiatorDisplayName,
    sentAt: input.sentAt,
    metadata: input.options.invitationMetadata,
  });
}

export function createRtcCallControllerAcceptedLifecyclePayload(input: {
  options: RtcCallControllerAcceptOptions;
  sessionSnapshot: Pick<RtcCallSessionSnapshot, 'conversationId' | 'rtcMode'>;
  occurredAt: string;
}): RtcCallLifecyclePayload {
  return freezeRtcRuntimeValue({
    rtcSessionId: input.options.rtcSessionId,
    conversationId: input.sessionSnapshot.conversationId,
    rtcMode: input.sessionSnapshot.rtcMode,
    participantId: input.options.participantId,
    occurredAt: input.occurredAt,
    metadata: input.options.metadata,
  });
}

export function createRtcCallControllerRejectedLifecyclePayload(input: {
  options: RtcCallControllerRejectOptions;
  activeInvitation?: RtcIncomingCallInvitation;
  occurredAt: string;
}): RtcCallLifecyclePayload {
  return freezeRtcRuntimeValue({
    rtcSessionId: input.options.rtcSessionId,
    conversationId: input.activeInvitation?.conversationId,
    rtcMode: input.activeInvitation?.rtcMode,
    reason: input.options.reason,
    occurredAt: input.occurredAt,
    metadata: input.options.metadata,
  });
}

export function createRtcCallControllerEndedLifecyclePayload(input: {
  rtcSessionId: string;
  options: RtcCallControllerEndOptions;
  sessionSnapshot: Pick<RtcCallSessionSnapshot, 'conversationId' | 'rtcMode' | 'participantId'>;
  activeInvitation?: RtcIncomingCallInvitation;
  occurredAt: string;
}): RtcCallLifecyclePayload {
  return freezeRtcRuntimeValue({
    rtcSessionId: input.rtcSessionId,
    conversationId:
      input.sessionSnapshot.conversationId ?? input.activeInvitation?.conversationId,
    rtcMode: input.sessionSnapshot.rtcMode ?? input.activeInvitation?.rtcMode,
    participantId: input.sessionSnapshot.participantId,
    reason: input.options.reason,
    occurredAt: input.occurredAt,
    metadata: input.options.metadata,
  });
}

export function createRtcCallControllerSignalSendOptions(input: {
  sessionSnapshot: Pick<RtcCallSessionSnapshot, 'signalingStreamId'>;
  activeInvitation?: RtcIncomingCallInvitation;
  schemaRef: string;
}): RtcCallSignalSendOptions {
  return freezeRtcRuntimeValue({
    signalingStreamId:
      input.sessionSnapshot.signalingStreamId ?? input.activeInvitation?.signalingStreamId,
    schemaRef: input.schemaRef,
  });
}

export function createRtcCallControllerTerminalSessionRecord(input: {
  signal: RtcCallSignal;
  nextState: Extract<RtcCallSessionRecord['state'], RtcCallControllerTerminalState>;
}): RtcCallSessionRecord {
  return freezeRtcRuntimeValue({
    rtcSessionId: input.signal.rtcSessionId,
    conversationId: input.signal.conversationId,
    rtcMode: input.signal.rtcMode,
    state: input.nextState,
    signalingStreamId: input.signal.signalingStreamId,
    endedAt: input.signal.occurredAt,
  });
}
