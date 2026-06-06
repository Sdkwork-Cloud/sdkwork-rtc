typedef RtcSignalingUnsubscribe = void Function();

enum RtcSignalingWebSocketAuthMode {
  automatic,
  headerBearer,
  queryBearer,
  none,
}

class RtcSignalingWebSocketAuthOptions {
  const RtcSignalingWebSocketAuthOptions.automatic()
      : mode = RtcSignalingWebSocketAuthMode.automatic;

  const RtcSignalingWebSocketAuthOptions.headerBearer()
      : mode = RtcSignalingWebSocketAuthMode.headerBearer;

  const RtcSignalingWebSocketAuthOptions.queryBearer()
      : mode = RtcSignalingWebSocketAuthMode.queryBearer;

  const RtcSignalingWebSocketAuthOptions.none()
      : mode = RtcSignalingWebSocketAuthMode.none;

  final RtcSignalingWebSocketAuthMode mode;
}

class RtcSignalingRealtimeSubscriptionItem {
  const RtcSignalingRealtimeSubscriptionItem({
    required this.scopeType,
    required this.scopeId,
    this.eventTypes,
  });

  factory RtcSignalingRealtimeSubscriptionItem.fromJson(
    Map<String, dynamic> json,
  ) {
    return RtcSignalingRealtimeSubscriptionItem(
      scopeType: json['scopeType']?.toString() ?? '',
      scopeId: json['scopeId']?.toString() ?? '',
      eventTypes: (json['eventTypes'] as List<dynamic>?)
          ?.map((item) => item.toString())
          .toList(growable: false),
    );
  }

  final String scopeType;
  final String scopeId;
  final List<String>? eventTypes;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'scopeType': scopeType,
      'scopeId': scopeId,
      'eventTypes': eventTypes,
    };
  }
}

class RtcSignalingRealtimeSubscriptionGroups {
  const RtcSignalingRealtimeSubscriptionGroups({
    this.conversations = const <String>[],
    this.rtcSessions = const <String>[],
    this.items = const <RtcSignalingRealtimeSubscriptionItem>[],
  });

  final List<String> conversations;
  final List<String> rtcSessions;
  final List<RtcSignalingRealtimeSubscriptionItem> items;
}

class RtcSignalingConnectOptions {
  const RtcSignalingConnectOptions({
    this.deviceId,
    this.subscriptions,
    this.url,
    this.headers,
    this.protocols,
    this.connectTimeout,
    this.webSocketAuth,
  });

  final String? deviceId;
  final RtcSignalingRealtimeSubscriptionGroups? subscriptions;
  final String? url;
  final Map<String, String>? headers;
  final List<String>? protocols;
  final Duration? connectTimeout;
  final RtcSignalingWebSocketAuthOptions? webSocketAuth;
}

class CreateRtcSessionRequest {
  const CreateRtcSessionRequest({
    required this.rtcSessionId,
    this.conversationId,
    required this.rtcMode,
  });

  final String rtcSessionId;
  final String? conversationId;
  final String rtcMode;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'conversationId': conversationId,
      'rtcMode': rtcMode,
    };
  }
}

class InviteRtcSessionRequest {
  const InviteRtcSessionRequest({
    this.signalingStreamId,
  });

  final String? signalingStreamId;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'signalingStreamId': signalingStreamId,
    };
  }
}

class UpdateRtcSessionRequest {
  const UpdateRtcSessionRequest();

  Map<String, Object?> toJson() => <String, Object?>{};
}

class IssueRtcParticipantCredentialRequest {
  const IssueRtcParticipantCredentialRequest({
    required this.participantId,
  });

  final String participantId;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'participantId': participantId,
    };
  }
}

class RtcSignalingPostJsonSignalOptions {
  const RtcSignalingPostJsonSignalOptions({
    this.payload,
    this.signalingStreamId,
    this.schemaRef,
  });

  final Object? payload;
  final String? signalingStreamId;
  final String? schemaRef;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'payload': payload,
      'signalingStreamId': signalingStreamId,
      'schemaRef': schemaRef,
    };
  }
}

class RtcSignalingPostConversationSignalRequest {
  const RtcSignalingPostConversationSignalRequest({
    required this.signalType,
    this.schemaRef,
    required this.text,
    required this.payload,
  });

  final String signalType;
  final String? schemaRef;
  final String text;
  final Object payload;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'type': 'signal',
      'content': <String, Object?>{
        'signalType': signalType,
        'schemaRef': schemaRef,
        'encoding': 'application/json',
        'payload': payload,
      },
      'text': text,
    };
  }
}

class RtcSignalingSessionRecord {
  const RtcSignalingSessionRecord({
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

  factory RtcSignalingSessionRecord.fromJson(Map<String, dynamic> json) {
    return RtcSignalingSessionRecord(
      rtcSessionId: json['rtcSessionId']?.toString() ?? '',
      conversationId: json['conversationId']?.toString(),
      rtcMode: json['rtcMode']?.toString(),
      state: json['state']?.toString() ?? '',
      signalingStreamId: json['signalingStreamId']?.toString(),
      initiatorId: json['initiatorId']?.toString(),
      providerPluginId: json['providerPluginId']?.toString(),
      providerSessionId: json['providerSessionId']?.toString(),
      accessEndpoint: json['accessEndpoint']?.toString(),
      providerRegion: json['providerRegion']?.toString(),
      startedAt: json['startedAt']?.toString(),
      endedAt: json['endedAt']?.toString(),
    );
  }

  final String rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final String state;
  final String? signalingStreamId;
  final String? initiatorId;
  final String? providerPluginId;
  final String? providerSessionId;
  final String? accessEndpoint;
  final String? providerRegion;
  final String? startedAt;
  final String? endedAt;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'conversationId': conversationId,
      'rtcMode': rtcMode,
      'state': state,
      'signalingStreamId': signalingStreamId,
      'initiatorId': initiatorId,
      'providerPluginId': providerPluginId,
      'providerSessionId': providerSessionId,
      'accessEndpoint': accessEndpoint,
      'providerRegion': providerRegion,
      'startedAt': startedAt,
      'endedAt': endedAt,
    };
  }
}

class RtcSignalingParticipantCredential {
  const RtcSignalingParticipantCredential({
    required this.rtcSessionId,
    required this.participantId,
    required this.credential,
    this.expiresAt,
  });

  factory RtcSignalingParticipantCredential.fromJson(
    Map<String, dynamic> json,
  ) {
    return RtcSignalingParticipantCredential(
      rtcSessionId: json['rtcSessionId']?.toString() ?? '',
      participantId: json['participantId']?.toString() ?? '',
      credential: json['credential']?.toString() ?? '',
      expiresAt: json['expiresAt']?.toString(),
    );
  }

  final String rtcSessionId;
  final String participantId;
  final String credential;
  final String? expiresAt;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'participantId': participantId,
      'credential': credential,
      'expiresAt': expiresAt,
    };
  }
}

class RtcSignalingSignalEvent {
  const RtcSignalingSignalEvent({
    required this.rtcSessionId,
    this.conversationId,
    this.rtcMode,
    required this.signalType,
    this.schemaRef,
    this.payload,
    this.rawPayload,
    this.senderId,
    this.signalingStreamId,
    this.occurredAt,
  });

  factory RtcSignalingSignalEvent.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'];
    return RtcSignalingSignalEvent(
      rtcSessionId: json['rtcSessionId']?.toString() ?? '',
      conversationId: json['conversationId']?.toString(),
      rtcMode: json['rtcMode']?.toString(),
      signalType: json['signalType']?.toString() ?? '',
      schemaRef: json['schemaRef']?.toString(),
      payload: json['payload'],
      rawPayload: json['rawPayload']?.toString(),
      senderId: sender is Map ? sender['id']?.toString() : json['senderId']?.toString(),
      signalingStreamId: json['signalingStreamId']?.toString(),
      occurredAt: json['occurredAt']?.toString(),
    );
  }

  final String rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final String signalType;
  final String? schemaRef;
  final Object? payload;
  final String? rawPayload;
  final String? senderId;
  final String? signalingStreamId;
  final String? occurredAt;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'conversationId': conversationId,
      'rtcMode': rtcMode,
      'signalType': signalType,
      'schemaRef': schemaRef,
      'payload': payload,
      'rawPayload': rawPayload,
      'senderId': senderId,
      'signalingStreamId': signalingStreamId,
      'occurredAt': occurredAt,
    };
  }
}

class RtcSignalingRealtimeEvent {
  const RtcSignalingRealtimeEvent({
    this.scopeType,
    this.scopeId,
    this.eventType,
    this.payload,
    this.occurredAt,
    this.signal,
    this.conversationMessage,
  });

  factory RtcSignalingRealtimeEvent.fromJson(Map<String, dynamic> json) {
    final signal = json['signal'];
    return RtcSignalingRealtimeEvent(
      scopeType: json['scopeType']?.toString(),
      scopeId: json['scopeId']?.toString(),
      eventType: json['eventType']?.toString(),
      payload: json['payload']?.toString(),
      occurredAt: json['occurredAt']?.toString(),
      signal: signal is Map
          ? RtcSignalingSignalEvent.fromJson(signal.cast<String, dynamic>())
          : null,
      conversationMessage: json['conversationMessage'],
    );
  }

  final String? scopeType;
  final String? scopeId;
  final String? eventType;
  final String? payload;
  final String? occurredAt;
  final RtcSignalingSignalEvent? signal;
  final Object? conversationMessage;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'scopeType': scopeType,
      'scopeId': scopeId,
      'eventType': eventType,
      'payload': payload,
      'occurredAt': occurredAt,
      'signal': signal?.toJson(),
      'conversationMessage': conversationMessage,
    };
  }
}

class RtcSignalingSyncRealtimeSubscriptionsRequest {
  const RtcSignalingSyncRealtimeSubscriptionsRequest({
    required this.deviceId,
    required this.items,
  });

  final String deviceId;
  final List<RtcSignalingRealtimeSubscriptionItem> items;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'deviceId': deviceId,
      'items': items.map((item) => item.toJson()).toList(growable: false),
    };
  }
}

class RtcSignalingLiveAckState {
  const RtcSignalingLiveAckState({
    this.ackedThroughSeq,
    this.trimmedThroughSeq,
  });

  final int? ackedThroughSeq;
  final int? trimmedThroughSeq;
}

enum RtcSignalingLiveConnectionStatus {
  connecting,
  connected,
  error,
  closed,
}

class RtcSignalingLiveLifecycleState {
  const RtcSignalingLiveLifecycleState({
    required this.status,
  });

  final RtcSignalingLiveConnectionStatus status;
}

abstract interface class RtcSignalingReceiveContext {
  RtcSignalingRealtimeEvent get rawEvent;

  Future<RtcSignalingLiveAckState> ack();
}

abstract interface class RtcSignalingSignalContext
    implements RtcSignalingReceiveContext {
  RtcSignalingSignalEvent get signal;
}

abstract interface class RtcSignalingLiveEventStream {
  RtcSignalingUnsubscribe on(
    void Function(RtcSignalingReceiveContext context) handler,
  );
}

abstract interface class RtcSignalingLiveLifecycleStream {
  RtcSignalingUnsubscribe onStateChange(
    void Function(RtcSignalingLiveLifecycleState state) handler,
  );
}

abstract interface class RtcSignalingLiveConnection {
  RtcSignalingLiveEventStream get events;

  RtcSignalingLiveLifecycleStream get lifecycle;

  Future<void> disconnect([int? code, String? reason]);
}

abstract interface class RtcSignalingRealtimeModule {
  Future<Object?> replaceSubscriptions(
    RtcSignalingSyncRealtimeSubscriptionsRequest body,
  );
}

abstract interface class RtcSignalingConversationModule {
  Future<void> postSignalMessage(
    String conversationId,
    RtcSignalingPostConversationSignalRequest body,
  );
}

abstract interface class RtcSignalingRtcModule {
  Future<RtcSignalingSessionRecord> create(CreateRtcSessionRequest body);

  Future<RtcSignalingSessionRecord> invite(
    String rtcSessionId,
    InviteRtcSessionRequest body,
  );

  Future<RtcSignalingSessionRecord> accept(
    String rtcSessionId,
    UpdateRtcSessionRequest body,
  );

  Future<RtcSignalingSessionRecord> reject(
    String rtcSessionId,
    UpdateRtcSessionRequest body,
  );

  Future<RtcSignalingSessionRecord> end(
    String rtcSessionId,
    UpdateRtcSessionRequest body,
  );

  Future<RtcSignalingSignalEvent> postJsonSignal(
    String rtcSessionId, {
    required String signalType,
    required RtcSignalingPostJsonSignalOptions options,
  });

  Future<RtcSignalingParticipantCredential> issueParticipantCredential(
    String rtcSessionId,
    IssueRtcParticipantCredentialRequest body,
  );
}

abstract interface class RtcSignalingClient {
  RtcSignalingRtcModule get rtc;

  RtcSignalingRealtimeModule get realtime;

  RtcSignalingConversationModule get conversations;

  Future<RtcSignalingLiveConnection> connect([
    RtcSignalingConnectOptions options,
  ]);
}
