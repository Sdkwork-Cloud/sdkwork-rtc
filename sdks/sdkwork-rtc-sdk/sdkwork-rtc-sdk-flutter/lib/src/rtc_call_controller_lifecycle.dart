import 'rtc_call_controller_contract.dart';
import 'rtc_call_controller_models.dart';
import 'rtc_call_types.dart';

RtcCallInvitePayload createRtcCallControllerOutgoingInvitationPayload({
  required RtcCallControllerOutgoingOptions options,
  required RtcCallSessionSnapshot sessionSnapshot,
  required String sentAt,
}) {
  return RtcCallInvitePayload(
    rtcSessionId: options.rtcSessionId,
    conversationId: options.conversationId!,
    rtcMode: options.rtcMode,
    roomId: sessionSnapshot.roomId ?? options.roomId ?? options.rtcSessionId,
    signalingStreamId:
        sessionSnapshot.signalingStreamId ?? options.signalingStreamId,
    initiatorId: options.participantId,
    initiatorDisplayName: options.initiatorDisplayName,
    sentAt: sentAt,
    metadata: options.invitationMetadata,
  );
}

RtcCallLifecyclePayload createRtcCallControllerAcceptedLifecyclePayload({
  required RtcCallControllerAcceptOptions options,
  required RtcCallSessionSnapshot sessionSnapshot,
  required String occurredAt,
}) {
  return RtcCallLifecyclePayload(
    rtcSessionId: options.rtcSessionId,
    conversationId: sessionSnapshot.conversationId,
    rtcMode: sessionSnapshot.rtcMode,
    participantId: options.participantId,
    occurredAt: occurredAt,
    metadata: options.metadata,
  );
}

RtcCallLifecyclePayload createRtcCallControllerRejectedLifecyclePayload({
  required RtcCallControllerRejectOptions options,
  required RtcIncomingCallInvitation? activeInvitation,
  required String occurredAt,
}) {
  return RtcCallLifecyclePayload(
    rtcSessionId: options.rtcSessionId,
    conversationId: activeInvitation?.conversationId,
    rtcMode: activeInvitation?.rtcMode,
    reason: options.reason,
    occurredAt: occurredAt,
    metadata: options.metadata,
  );
}

RtcCallLifecyclePayload createRtcCallControllerEndedLifecyclePayload({
  required String rtcSessionId,
  required RtcCallControllerEndOptions options,
  required RtcCallSessionSnapshot sessionSnapshot,
  required RtcIncomingCallInvitation? activeInvitation,
  required String occurredAt,
}) {
  return RtcCallLifecyclePayload(
    rtcSessionId: rtcSessionId,
    conversationId:
        sessionSnapshot.conversationId ?? activeInvitation?.conversationId,
    rtcMode: sessionSnapshot.rtcMode ?? activeInvitation?.rtcMode,
    participantId: sessionSnapshot.participantId,
    reason: options.reason,
    occurredAt: occurredAt,
    metadata: options.metadata,
  );
}

RtcCallSignalSendOptions createRtcCallControllerSignalSendOptions({
  required RtcCallSessionSnapshot sessionSnapshot,
  required RtcIncomingCallInvitation? activeInvitation,
  required String schemaRef,
}) {
  return RtcCallSignalSendOptions(
    signalingStreamId:
        sessionSnapshot.signalingStreamId ?? activeInvitation?.signalingStreamId,
    schemaRef: schemaRef,
  );
}

RtcCallSessionRecord createRtcCallControllerTerminalSessionRecord({
  required RtcCallSignal signal,
  required RtcCallControllerState nextState,
}) {
  return RtcCallSessionRecord(
    rtcSessionId: signal.rtcSessionId,
    conversationId: signal.conversationId,
    rtcMode: signal.rtcMode,
    state: _toTerminalRtcCallState(nextState),
    signalingStreamId: signal.signalingStreamId,
    endedAt: signal.occurredAt,
  );
}

RtcCallState _toTerminalRtcCallState(RtcCallControllerState nextState) {
  switch (nextState) {
    case RtcCallControllerState.rejected:
      return RtcCallState.rejected;
    case RtcCallControllerState.ended:
      return RtcCallState.ended;
    default:
      throw ArgumentError.value(
        nextState,
        'nextState',
        'RTC controller terminal state must be rejected or ended.',
      );
  }
}
