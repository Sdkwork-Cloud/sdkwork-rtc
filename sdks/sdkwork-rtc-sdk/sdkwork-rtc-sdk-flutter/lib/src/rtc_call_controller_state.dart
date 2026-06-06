import 'rtc_call_controller_contract.dart';
import 'rtc_call_controller_models.dart';
import 'rtc_call_types.dart';

RtcCallControllerState resolveRtcCallControllerWatchState({
  required int watchedConversationCount,
  required String? activeSessionId,
  required RtcCallControllerState controllerState,
}) {
  if (watchedConversationCount == 0 && activeSessionId == null) {
    return RtcCallControllerState.idle;
  }

  if (activeSessionId == null) {
    return RtcCallControllerState.watching;
  }

  return controllerState;
}

RtcCallControllerState? resolveRtcCallControllerTerminalState(
  String signalType,
) {
  if (signalType == rtcCallRejectedSignalType) {
    return RtcCallControllerState.rejected;
  }

  if (signalType == rtcCallEndedSignalType) {
    return RtcCallControllerState.ended;
  }

  return null;
}

bool hasRtcCallControllerActiveCall({
  required String? currentRtcSessionId,
  required RtcCallControllerState controllerState,
}) {
  return currentRtcSessionId != null &&
      controllerState != RtcCallControllerState.idle &&
      controllerState != RtcCallControllerState.watching &&
      controllerState != RtcCallControllerState.rejected &&
      controllerState != RtcCallControllerState.ended;
}

RtcCallControllerSnapshot createRtcCallControllerSnapshot({
  required RtcCallSessionSnapshot sessionSnapshot,
  required RtcCallControllerState controllerState,
  required List<String> watchedConversationIds,
  required RtcCallControllerDirection? direction,
  required RtcIncomingCallInvitation? activeInvitation,
  required RtcCallSignal? lastSignal,
  required Object? lastError,
}) {
  return RtcCallControllerSnapshot(
    rtcSessionId: sessionSnapshot.rtcSessionId ?? activeInvitation?.rtcSessionId,
    conversationId:
        sessionSnapshot.conversationId ?? activeInvitation?.conversationId,
    rtcMode: sessionSnapshot.rtcMode ?? activeInvitation?.rtcMode,
    roomId: sessionSnapshot.roomId ?? activeInvitation?.roomId,
    participantId: sessionSnapshot.participantId,
    providerKey: sessionSnapshot.providerKey,
    signalingStreamId:
        sessionSnapshot.signalingStreamId ?? activeInvitation?.signalingStreamId,
    providerPluginId: sessionSnapshot.providerPluginId,
    providerSessionId: sessionSnapshot.providerSessionId,
    accessEndpoint: sessionSnapshot.accessEndpoint,
    providerRegion: sessionSnapshot.providerRegion,
    startedAt: sessionSnapshot.startedAt,
    endedAt: sessionSnapshot.endedAt,
    state: sessionSnapshot.state,
    mediaConnectionState: sessionSnapshot.mediaConnectionState,
    controllerState: controllerState,
    direction: direction,
    watchedConversationIds: List<String>.unmodifiable(watchedConversationIds),
    activeInvitation: activeInvitation,
    lastSignal: lastSignal,
    lastError: lastError,
  );
}
