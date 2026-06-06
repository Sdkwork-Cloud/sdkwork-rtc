import 'rtc_call_controller_contract.dart';
import 'rtc_call_session.dart';
import 'rtc_call_types.dart';
import 'rtc_signaling_adapter.dart';

class RtcCallInvitePayload {
  const RtcCallInvitePayload({
    required this.rtcSessionId,
    required this.conversationId,
    required this.rtcMode,
    this.roomId,
    this.signalingStreamId,
    this.initiatorId,
    this.initiatorDisplayName,
    this.sentAt,
    this.metadata,
  });

  final String rtcSessionId;
  final String conversationId;
  final String rtcMode;
  final String? roomId;
  final String? signalingStreamId;
  final String? initiatorId;
  final String? initiatorDisplayName;
  final String? sentAt;
  final Map<String, Object?>? metadata;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'conversationId': conversationId,
      'rtcMode': rtcMode,
      'roomId': roomId,
      'signalingStreamId': signalingStreamId,
      'initiatorId': initiatorId,
      'initiatorDisplayName': initiatorDisplayName,
      'sentAt': sentAt,
      'metadata': metadata,
    };
  }
}

class RtcIncomingCallInvitation extends RtcCallInvitePayload {
  const RtcIncomingCallInvitation({
    required super.rtcSessionId,
    required super.conversationId,
    required super.rtcMode,
    super.roomId,
    super.signalingStreamId,
    super.initiatorId,
    super.initiatorDisplayName,
    super.sentAt,
    super.metadata,
    this.occurredAt,
  });

  final String? occurredAt;
}

class RtcCallLifecyclePayload {
  const RtcCallLifecyclePayload({
    required this.rtcSessionId,
    this.conversationId,
    this.rtcMode,
    this.participantId,
    this.reason,
    this.occurredAt,
    this.metadata,
  });

  final String rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final String? participantId;
  final String? reason;
  final String? occurredAt;
  final Map<String, Object?>? metadata;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'conversationId': conversationId,
      'rtcMode': rtcMode,
      'participantId': participantId,
      'reason': reason,
      'occurredAt': occurredAt,
      'metadata': metadata,
    };
  }
}

class RtcCallSessionDescriptionPayload {
  const RtcCallSessionDescriptionPayload({
    required this.sdp,
  });

  final String sdp;

  Map<String, Object?> toJson() => <String, Object?>{'sdp': sdp};
}

class RtcCallIceCandidatePayload {
  const RtcCallIceCandidatePayload({
    required this.candidate,
    this.sdpMid,
    this.sdpMLineIndex,
  });

  final String candidate;
  final String? sdpMid;
  final int? sdpMLineIndex;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'candidate': candidate,
      'sdpMid': sdpMid,
      'sdpMLineIndex': sdpMLineIndex,
    };
  }
}

class RtcCallControllerSnapshot extends RtcCallSessionSnapshot {
  const RtcCallControllerSnapshot({
    super.rtcSessionId,
    super.conversationId,
    super.rtcMode,
    super.roomId,
    super.participantId,
    super.providerKey,
    super.signalingStreamId,
    super.providerPluginId,
    super.providerSessionId,
    super.accessEndpoint,
    super.providerRegion,
    super.startedAt,
    super.endedAt,
    required super.state,
    super.mediaConnectionState,
    required this.controllerState,
    required this.watchedConversationIds,
    this.direction,
    this.activeInvitation,
    this.lastSignal,
    this.lastError,
  });

  final RtcCallControllerState controllerState;
  final List<String> watchedConversationIds;
  final RtcCallControllerDirection? direction;
  final RtcIncomingCallInvitation? activeInvitation;
  final RtcCallSignal? lastSignal;
  final Object? lastError;
}

enum RtcCallControllerEventType {
  snapshot,
  incomingInvitation,
  signal,
  error,
}

class RtcCallControllerEvent {
  const RtcCallControllerEvent({
    required this.type,
    required this.snapshot,
    this.invitation,
    this.signal,
    this.error,
  });

  final RtcCallControllerEventType type;
  final RtcCallControllerSnapshot snapshot;
  final RtcIncomingCallInvitation? invitation;
  final RtcCallSignal? signal;
  final Object? error;
}

typedef RtcCallControllerEventHandler = void Function(
  RtcCallControllerEvent event,
);
typedef RtcCallControllerSnapshotHandler = void Function(
  RtcCallControllerSnapshot snapshot,
);

class RtcCallControllerOutgoingOptions extends RtcOutgoingCallOptions {
  const RtcCallControllerOutgoingOptions({
    required super.rtcSessionId,
    required super.conversationId,
    required super.rtcMode,
    super.roomId,
    required super.participantId,
    super.signalingStreamId,
    super.subscribeSignals = false,
    super.autoPublish = const RtcCallAutoPublishOptions(),
    this.invitationText,
    this.initiatorDisplayName,
    this.invitationMetadata,
  });

  final String? invitationText;
  final String? initiatorDisplayName;
  final Map<String, Object?>? invitationMetadata;
}

class RtcCallControllerAcceptOptions extends RtcIncomingCallAcceptOptions {
  const RtcCallControllerAcceptOptions({
    required super.rtcSessionId,
    super.conversationId,
    super.rtcMode,
    super.roomId,
    required super.participantId,
    super.subscribeSignals = false,
    super.autoPublish = const RtcCallAutoPublishOptions(),
    this.metadata,
  });

  final Map<String, Object?>? metadata;
}

class RtcCallControllerRejectOptions extends RtcIncomingCallRejectOptions {
  const RtcCallControllerRejectOptions({
    required super.rtcSessionId,
    this.reason,
    this.metadata,
  });

  final String? reason;
  final Map<String, Object?>? metadata;
}

class RtcCallControllerEndOptions {
  const RtcCallControllerEndOptions({
    this.reason,
    this.metadata,
  });

  final String? reason;
  final Map<String, Object?>? metadata;
}

class CreateStandardRtcCallControllerOptions<TNativeClient> {
  const CreateStandardRtcCallControllerOptions({
    required this.sdk,
    required this.callSession,
    required this.deviceId,
    Duration reconnectInterval = const Duration(seconds: 1),
    this.watchConversationIds = const <String>[],
    this.liveConnection,
    this.connectOptions,
    this.signaling,
    this.realtimeDispatcher,
  }) : reconnectInterval = reconnectInterval;

  final RtcSignalingClient sdk;
  final StandardRtcCallSession<TNativeClient> callSession;
  final String deviceId;
  final Duration reconnectInterval;
  final List<String> watchConversationIds;
  final RtcSignalingLiveConnection? liveConnection;
  final RtcSignalingConnectOptions? connectOptions;
  final RtcCallSignalingAdapter? signaling;
  final RtcSignalingRealtimeDispatcher? realtimeDispatcher;
}
