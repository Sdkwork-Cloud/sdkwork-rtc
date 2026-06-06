export const RTC_CALL_INVITE_SIGNAL_TYPE = 'sdkwork.rtc.call.invite';
export const RTC_CALL_ACCEPTED_SIGNAL_TYPE = 'sdkwork.rtc.call.accepted';
export const RTC_CALL_REJECTED_SIGNAL_TYPE = 'sdkwork.rtc.call.rejected';
export const RTC_CALL_ENDED_SIGNAL_TYPE = 'sdkwork.rtc.call.ended';
export const RTC_CALL_OFFER_SIGNAL_TYPE = 'sdkwork.rtc.call.offer';
export const RTC_CALL_ANSWER_SIGNAL_TYPE = 'sdkwork.rtc.call.answer';
export const RTC_CALL_ICE_CANDIDATE_SIGNAL_TYPE = 'sdkwork.rtc.call.ice-candidate';

export const RTC_CALL_INVITE_SCHEMA_REF = 'urn:sdkwork:rtc:call:invite:v1';
export const RTC_CALL_LIFECYCLE_SCHEMA_REF = 'urn:sdkwork:rtc:call:lifecycle:v1';
export const RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF =
  'urn:sdkwork:rtc:call:session-description:v1';
export const RTC_CALL_ICE_CANDIDATE_SCHEMA_REF =
  'urn:sdkwork:rtc:call:ice-candidate:v1';

export type RtcCallControllerDirection = 'incoming' | 'outgoing';

export type RtcCallControllerState =
  | 'idle'
  | 'watching'
  | 'incoming_ringing'
  | 'outgoing_ringing'
  | 'connecting'
  | 'connected'
  | 'rejected'
  | 'ended'
  | 'errored';
