import 'rtc_types.dart';

const String rtcCallTrackIdSeparator = '-';

String createRtcCallTrackId(String rtcSessionId, RtcTrackKind kind) {
  return '$rtcSessionId$rtcCallTrackIdSeparator${rtcTrackKindWireName(kind)}';
}

enum RtcCallState {
  idle,
  started,
  accepted,
  connected,
  rejected,
  ended,
}

class RtcCallSignal {
  const RtcCallSignal({
    required this.rtcSessionId,
    this.conversationId,
    this.rtcMode,
    required this.signalType,
    this.payload,
    required this.rawPayload,
    this.senderId,
    this.signalingStreamId,
    this.occurredAt,
  });

  final String rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final String signalType;
  final Object? payload;
  final String rawPayload;
  final String? senderId;
  final String? signalingStreamId;
  final String? occurredAt;
}

class RtcCallParticipantCredential {
  const RtcCallParticipantCredential({
    required this.rtcSessionId,
    required this.participantId,
    required this.credential,
    this.expiresAt,
  });

  final String rtcSessionId;
  final String participantId;
  final String credential;
  final String? expiresAt;
}

class RtcCallSessionRecord {
  const RtcCallSessionRecord({
    required this.rtcSessionId,
    this.conversationId,
    this.rtcMode,
    required this.state,
    this.signalingStreamId,
    this.initiatorId,
    this.providerPluginId,
    this.providerSessionId,
    this.accessEndpoint,
    this.providerRegion,
    this.startedAt,
    this.endedAt,
  });

  final String rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final RtcCallState state;
  final String? signalingStreamId;
  final String? initiatorId;
  final String? providerPluginId;
  final String? providerSessionId;
  final String? accessEndpoint;
  final String? providerRegion;
  final String? startedAt;
  final String? endedAt;
}

class RtcCallSessionSnapshot {
  const RtcCallSessionSnapshot({
    this.rtcSessionId,
    this.conversationId,
    this.rtcMode,
    this.roomId,
    this.participantId,
    this.providerKey,
    this.signalingStreamId,
    this.providerPluginId,
    this.providerSessionId,
    this.accessEndpoint,
    this.providerRegion,
    this.startedAt,
    this.endedAt,
    required this.state,
    this.mediaConnectionState,
  });

  final String? rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final String? roomId;
  final String? participantId;
  final String? providerKey;
  final String? signalingStreamId;
  final String? providerPluginId;
  final String? providerSessionId;
  final String? accessEndpoint;
  final String? providerRegion;
  final String? startedAt;
  final String? endedAt;
  final RtcCallState state;
  final RtcSessionConnectionState? mediaConnectionState;
}

class RtcCallAutoPublishOptions {
  const RtcCallAutoPublishOptions({
    this.audio = false,
    this.video = false,
  });

  final bool audio;
  final bool video;
}

class RtcCallSignalSendOptions {
  const RtcCallSignalSendOptions({
    this.signalingStreamId,
    this.schemaRef,
  });

  final String? signalingStreamId;
  final String? schemaRef;
}

class RtcOutgoingCallOptions {
  const RtcOutgoingCallOptions({
    required this.rtcSessionId,
    this.conversationId,
    required this.rtcMode,
    this.roomId,
    required this.participantId,
    this.signalingStreamId,
    this.subscribeSignals = true,
    this.autoPublish = const RtcCallAutoPublishOptions(),
  });

  final String rtcSessionId;
  final String? conversationId;
  final String rtcMode;
  final String? roomId;
  final String participantId;
  final String? signalingStreamId;
  final bool subscribeSignals;
  final RtcCallAutoPublishOptions autoPublish;
}

class RtcIncomingCallAcceptOptions {
  const RtcIncomingCallAcceptOptions({
    required this.rtcSessionId,
    this.conversationId,
    this.rtcMode,
    this.roomId,
    required this.participantId,
    this.subscribeSignals = true,
    this.autoPublish = const RtcCallAutoPublishOptions(),
  });

  final String rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final String? roomId;
  final String participantId;
  final bool subscribeSignals;
  final RtcCallAutoPublishOptions autoPublish;
}

class RtcIncomingCallRejectOptions {
  const RtcIncomingCallRejectOptions({
    required this.rtcSessionId,
  });

  final String rtcSessionId;
}

abstract interface class RtcCallSignalSubscription {
  void unsubscribe();
}

typedef RtcCallSignalHandler = void Function(RtcCallSignal signal);

abstract interface class RtcCallSignalingAdapter {
  Future<RtcCallSessionRecord> createSession({
    required String rtcSessionId,
    String? conversationId,
    required String rtcMode,
  });

  Future<RtcCallSessionRecord> inviteSession(
    String rtcSessionId, {
    String? signalingStreamId,
  });

  Future<RtcCallSessionRecord> acceptSession(String rtcSessionId);

  Future<RtcCallSessionRecord> rejectSession(String rtcSessionId);

  Future<RtcCallSessionRecord> endSession(String rtcSessionId);

  Future<RtcCallSignal> sendSignal(
    String rtcSessionId,
    String signalType,
    Object? payload, {
    RtcCallSignalSendOptions options = const RtcCallSignalSendOptions(),
  });

  Future<RtcCallParticipantCredential> issueParticipantCredential(
    String rtcSessionId, {
    required String participantId,
  });

  Future<RtcCallSignalSubscription> subscribeSessionSignals(
    String rtcSessionId,
    RtcCallSignalHandler handler,
  );
}
