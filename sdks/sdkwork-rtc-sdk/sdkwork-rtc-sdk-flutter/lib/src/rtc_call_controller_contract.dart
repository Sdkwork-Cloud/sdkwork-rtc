const String rtcCallInviteSignalType = 'sdkwork.rtc.call.invite';
const String rtcCallAcceptedSignalType = 'sdkwork.rtc.call.accepted';
const String rtcCallRejectedSignalType = 'sdkwork.rtc.call.rejected';
const String rtcCallEndedSignalType = 'sdkwork.rtc.call.ended';
const String rtcCallOfferSignalType = 'sdkwork.rtc.call.offer';
const String rtcCallAnswerSignalType = 'sdkwork.rtc.call.answer';
const String rtcCallIceCandidateSignalType = 'sdkwork.rtc.call.ice-candidate';

const String rtcCallInviteSchemaRef = 'urn:sdkwork:rtc:call:invite:v1';
const String rtcCallLifecycleSchemaRef = 'urn:sdkwork:rtc:call:lifecycle:v1';
const String rtcCallSessionDescriptionSchemaRef =
    'urn:sdkwork:rtc:call:session-description:v1';
const String rtcCallIceCandidateSchemaRef =
    'urn:sdkwork:rtc:call:ice-candidate:v1';

enum RtcCallControllerDirection {
  incoming,
  outgoing,
}

enum RtcCallControllerState {
  idle,
  watching,
  incomingRinging,
  outgoingRinging,
  connecting,
  connected,
  rejected,
  ended,
  errored,
}
