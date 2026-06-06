import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:volc_engine_rtc/volc_engine_rtc.dart';
import 'package:volc_engine_rtc/codegen/pack/keytype.dart' as volc_pack;

const _defaultOptions = _RtcCallSmokeOptions(
  appId: 'volc-app-smoke',
  sessionId: 'rtc-session-smoke',
  conversationId: 'conversation-smoke',
  roomId: 'room-smoke',
  participantId: 'user-smoke',
  signalingStreamId: 'signal-smoke',
  deviceId: 'device-smoke',
  reuseLiveConnection: false,
  json: false,
  help: false,
);

final class _RtcCallSmokeOptions {
  const _RtcCallSmokeOptions({
    required this.appId,
    required this.sessionId,
    required this.conversationId,
    required this.roomId,
    required this.participantId,
    required this.signalingStreamId,
    required this.deviceId,
    required this.reuseLiveConnection,
    required this.json,
    required this.help,
  });

  final String appId;
  final String sessionId;
  final String conversationId;
  final String roomId;
  final String participantId;
  final String signalingStreamId;
  final String deviceId;
  final bool reuseLiveConnection;
  final bool json;
  final bool help;
}

Never _fail(String message) {
  throw ArgumentError(message);
}

void _writeLine(IOSink sink, [String line = '']) {
  sink.writeln(line);
}

String _normalizeOptionName(String token) {
  return token.replaceFirst(RegExp(r'^-+'), '').trim();
}

Map<String, Object> _parseOptionEntries(List<String> argv) {
  final entries = <String, Object>{};

  for (var index = 0; index < argv.length; index += 1) {
    final token = argv[index];
    if (!token.startsWith('-')) {
      _fail('Unexpected positional argument "$token".');
    }

    final normalizedToken = _normalizeOptionName(token);
    if (normalizedToken.isEmpty) {
      _fail('Invalid empty option token "$token".');
    }

    final inlineEqualsIndex = normalizedToken.indexOf('=');
    final optionName = inlineEqualsIndex >= 0
        ? normalizedToken.substring(0, inlineEqualsIndex)
        : normalizedToken;
    final inlineValue = inlineEqualsIndex >= 0
        ? normalizedToken.substring(inlineEqualsIndex + 1)
        : null;
    final nextToken = index + 1 < argv.length ? argv[index + 1] : null;
    final hasSeparateValue =
        inlineValue == null && nextToken != null && !nextToken.startsWith('-');

    if (inlineValue != null) {
      entries[optionName] = inlineValue;
      continue;
    }

    if (hasSeparateValue) {
      entries[optionName] = nextToken;
      index += 1;
      continue;
    }

    entries[optionName] = true;
  }

  return entries;
}

String _readStringOption(
  Map<String, Object> entries,
  String optionName,
  String fallback,
) {
  final value = entries[optionName];
  if (value == null || value == true) {
    return fallback;
  }

  final normalized = value.toString().trim();
  if (normalized.isEmpty) {
    _fail('$optionName must not be empty.');
  }

  return normalized;
}

_RtcCallSmokeOptions _parseRtcCallSmokeArgs(List<String> argv) {
  final entries = _parseOptionEntries(argv);
  final helpRequested = entries['help'] == true || entries['h'] == true;

  if (helpRequested) {
    return const _RtcCallSmokeOptions(
      appId: 'volc-app-smoke',
      sessionId: 'rtc-session-smoke',
      conversationId: 'conversation-smoke',
      roomId: 'room-smoke',
      participantId: 'user-smoke',
      signalingStreamId: 'signal-smoke',
      deviceId: 'device-smoke',
      reuseLiveConnection: false,
      json: false,
      help: true,
    );
  }

  return _RtcCallSmokeOptions(
    appId: _readStringOption(entries, 'app-id', _defaultOptions.appId),
    sessionId:
        _readStringOption(entries, 'session-id', _defaultOptions.sessionId),
    conversationId: _readStringOption(
      entries,
      'conversation-id',
      _defaultOptions.conversationId,
    ),
    roomId: _readStringOption(entries, 'room-id', _defaultOptions.roomId),
    participantId: _readStringOption(
      entries,
      'participant-id',
      _defaultOptions.participantId,
    ),
    signalingStreamId: _readStringOption(
      entries,
      'signaling-stream-id',
      _defaultOptions.signalingStreamId,
    ),
    deviceId: _readStringOption(entries, 'device-id', _defaultOptions.deviceId),
    reuseLiveConnection: entries['reuse-live-connection'] == true,
    json: entries['json'] == true,
    help: false,
  );
}

String getRtcCallSmokeHelpText() {
  return <String>[
    'SDKWork RTC Flutter call smoke CLI',
    '',
    'Usage:',
    '  flutter pub run ./bin/sdk-call-smoke.dart [--json] [--app-id <id>] [--session-id <id>]',
    '',
    'Behavior:',
    '  runs the public rtc_sdk surface against a local RTC signaling adapter fake',
    '  and a fake official Volcengine Flutter engine factory',
    '  does not hit external services or require live credentials',
    '',
    'Options:',
    '  --json                        Print the smoke summary as JSON',
    '  --app-id <id>                Override the mocked Volcengine appId',
    '  --session-id <id>            Override the RTC session id',
    '  --conversation-id <id>       Override the conversation id',
    '  --room-id <id>               Override the room id',
    '  --participant-id <id>        Override the participant id',
    '  --signaling-stream-id <id>   Override the signaling stream id',
    '  --device-id <id>             Override the RTC signaling device id',
    '  --reuse-live-connection      Reuse one preconnected RTC WebSocket live connection',
  ].join('\n');
}

RtcSignalingConnectOptions buildRtcCallSmokeConnectOptions({
  required String deviceId,
  String? conversationId,
  bool includeConversationSubscriptions = false,
}) {
  if (includeConversationSubscriptions && conversationId != null) {
    return RtcSignalingConnectOptions(
      deviceId: deviceId,
      subscriptions: RtcSignalingRealtimeSubscriptionGroups(
        conversations: <String>[conversationId],
      ),
      webSocketAuth: const RtcSignalingWebSocketAuthOptions.automatic(),
    );
  }

  return RtcSignalingConnectOptions(
    deviceId: deviceId,
    webSocketAuth: const RtcSignalingWebSocketAuthOptions.automatic(),
  );
}

Map<String, Object?> buildRtcCallSmokeSignalingTransportSummary({
  required String deviceId,
  RtcSignalingConnectOptions? connectOptions,
  RtcSignalingLiveConnection? liveConnection,
}) {
  final resolvedConnectOptions =
      connectOptions ?? buildRtcCallSmokeConnectOptions(deviceId: deviceId);
  return describeRtcSignalingTransport(
    deviceId: deviceId,
    connectOptions: resolvedConnectOptions,
    liveConnection: liveConnection,
  ).toJson();
}

String _nowIso() {
  return DateTime.now().toUtc().toIso8601String();
}

final class _FakeRtcSignalingClient implements RtcSignalingClient {
  _FakeRtcSignalingClient(this.options, this.transportCalls)
      : _liveConnection = _FakeRtcSignalingLiveConnection(transportCalls),
        _rtc = _FakeRtcSignalingRtcModule(options, transportCalls),
        _realtime = _FakeRtcSignalingRealtimeModule(transportCalls),
        _conversations = _FakeRtcSignalingConversationModule(transportCalls);

  final _RtcCallSmokeOptions options;
  final List<String> transportCalls;
  final _FakeRtcSignalingLiveConnection _liveConnection;
  final _FakeRtcSignalingRtcModule _rtc;
  final _FakeRtcSignalingRealtimeModule _realtime;
  final _FakeRtcSignalingConversationModule _conversations;

  @override
  RtcSignalingRtcModule get rtc => _rtc;

  @override
  RtcSignalingRealtimeModule get realtime => _realtime;

  @override
  RtcSignalingConversationModule get conversations => _conversations;

  @override
  Future<RtcSignalingLiveConnection> connect([
    RtcSignalingConnectOptions options = const RtcSignalingConnectOptions(),
  ]) async {
    transportCalls.add('realtime.ws.connect');
    _liveConnection.applyConnectOptions(options);
    return _liveConnection;
  }

  Future<void> emitAcceptedSignal() async {
    await _liveConnection.emitRtcSignal(
      RtcSignalingSignalEvent(
        rtcSessionId: options.sessionId,
        conversationId: options.conversationId,
        rtcMode: 'video_call',
        signalType: rtcCallAcceptedSignalType,
        schemaRef: rtcCallLifecycleSchemaRef,
        payload: <String, Object?>{
          'rtcSessionId': options.sessionId,
          'conversationId': options.conversationId,
          'acceptedBy': 'remote-user-smoke',
          'occurredAt': _nowIso(),
        },
        senderId: 'remote-user-smoke',
        signalingStreamId: options.signalingStreamId,
        occurredAt: _nowIso(),
      ),
    );
  }
}

final class _FakeRtcSignalingRtcModule implements RtcSignalingRtcModule {
  _FakeRtcSignalingRtcModule(this.options, this.transportCalls);

  final _RtcCallSmokeOptions options;
  final List<String> transportCalls;
  String _sessionState = 'idle';
  String? _startedAt;
  String? _endedAt;
  String? _signalingStreamId;

  @override
  Future<RtcSignalingSessionRecord> create(CreateRtcSessionRequest body) async {
    transportCalls.add('rtc.create');
    _sessionState = 'started';
    _startedAt ??= _nowIso();
    return _session(
      rtcSessionId: body.rtcSessionId,
      conversationId: body.conversationId,
      rtcMode: body.rtcMode,
    );
  }

  @override
  Future<RtcSignalingSessionRecord> invite(
    String rtcSessionId,
    InviteRtcSessionRequest body,
  ) async {
    transportCalls.add('rtc.invite');
    _signalingStreamId = body.signalingStreamId ?? options.signalingStreamId;
    return _session(rtcSessionId: rtcSessionId);
  }

  @override
  Future<RtcSignalingSessionRecord> accept(
    String rtcSessionId,
    UpdateRtcSessionRequest body,
  ) async {
    transportCalls.add('rtc.accept');
    _sessionState = 'accepted';
    return _session(rtcSessionId: rtcSessionId);
  }

  @override
  Future<RtcSignalingSessionRecord> reject(
    String rtcSessionId,
    UpdateRtcSessionRequest body,
  ) async {
    transportCalls.add('rtc.reject');
    _sessionState = 'rejected';
    return _session(rtcSessionId: rtcSessionId);
  }

  @override
  Future<RtcSignalingSessionRecord> end(
    String rtcSessionId,
    UpdateRtcSessionRequest body,
  ) async {
    transportCalls.add('rtc.end');
    _sessionState = 'ended';
    _endedAt = _nowIso();
    return _session(rtcSessionId: rtcSessionId);
  }

  @override
  Future<RtcSignalingSignalEvent> postJsonSignal(
    String rtcSessionId, {
    required String signalType,
    required RtcSignalingPostJsonSignalOptions options,
  }) async {
    transportCalls.add('rtc.postSignal:$signalType');
    return RtcSignalingSignalEvent(
      rtcSessionId: rtcSessionId,
      conversationId: this.options.conversationId,
      rtcMode: 'video_call',
      signalType: signalType,
      schemaRef: options.schemaRef,
      payload: options.payload,
      rawPayload: jsonEncode(options.payload),
      senderId: this.options.participantId,
      signalingStreamId: options.signalingStreamId ?? _signalingStreamId,
      occurredAt: _nowIso(),
    );
  }

  @override
  Future<RtcSignalingParticipantCredential> issueParticipantCredential(
    String rtcSessionId,
    IssueRtcParticipantCredentialRequest body,
  ) async {
    transportCalls.add('rtc.issueParticipantCredential');
    return RtcSignalingParticipantCredential(
      rtcSessionId: rtcSessionId,
      participantId: body.participantId,
      credential: 'volc-token-smoke',
      expiresAt: DateTime.now()
          .toUtc()
          .add(const Duration(minutes: 30))
          .toIso8601String(),
    );
  }

  RtcSignalingSessionRecord _session({
    required String rtcSessionId,
    String? conversationId,
    String? rtcMode,
  }) {
    return RtcSignalingSessionRecord(
      rtcSessionId: rtcSessionId,
      conversationId: conversationId ?? options.conversationId,
      rtcMode: rtcMode ?? 'video_call',
      initiatorId: options.participantId,
      providerPluginId: 'rtc-volcengine',
      providerSessionId: 'provider-$rtcSessionId',
      accessEndpoint: 'volcengine://smoke-endpoint',
      providerRegion: 'cn-shanghai',
      state: _sessionState,
      signalingStreamId: _signalingStreamId,
      startedAt: _startedAt,
      endedAt: _endedAt,
    );
  }
}

final class _FakeRtcSignalingRealtimeModule
    implements RtcSignalingRealtimeModule {
  _FakeRtcSignalingRealtimeModule(this.transportCalls);

  final List<String> transportCalls;

  @override
  Future<Object?> replaceSubscriptions(
    RtcSignalingSyncRealtimeSubscriptionsRequest body,
  ) async {
    transportCalls.add('realtime.sync');
    return body.toJson();
  }
}

final class _FakeRtcSignalingConversationModule
    implements RtcSignalingConversationModule {
  _FakeRtcSignalingConversationModule(this.transportCalls);

  final List<String> transportCalls;

  @override
  Future<void> postSignalMessage(
    String conversationId,
    RtcSignalingPostConversationSignalRequest body,
  ) async {
    transportCalls.add('conversation.postSignalMessage');
  }
}

final class _FakeRtcSignalingLiveConnection
    implements RtcSignalingLiveConnection {
  _FakeRtcSignalingLiveConnection(this.transportCalls)
      : _events = _FakeRtcSignalingLiveEventStream();

  final List<String> transportCalls;
  final _FakeRtcSignalingLiveEventStream _events;
  final _FakeRtcSignalingLiveLifecycleStream _lifecycle =
      _FakeRtcSignalingLiveLifecycleStream();

  void applyConnectOptions(RtcSignalingConnectOptions options) {
    final groups = options.subscriptions;
    if (groups == null) {
      return;
    }
    if (groups.rtcSessions.isNotEmpty || groups.conversations.isNotEmpty) {
      transportCalls.add('realtime.connect.subscriptions');
    }
  }

  Future<void> emitRtcSignal(RtcSignalingSignalEvent signal) async {
    _events.emit(_FakeRtcSignalingSignalContext(signal));
  }

  @override
  RtcSignalingLiveEventStream get events => _events;

  @override
  RtcSignalingLiveLifecycleStream get lifecycle => _lifecycle;

  @override
  Future<void> disconnect([int? code, String? reason]) async {
    transportCalls.add('realtime.ws.disconnect');
    _lifecycle.emit(
      const RtcSignalingLiveLifecycleState(
        status: RtcSignalingLiveConnectionStatus.closed,
      ),
    );
  }
}

final class _FakeRtcSignalingLiveEventStream
    implements RtcSignalingLiveEventStream {
  final Set<void Function(RtcSignalingReceiveContext context)> _handlers =
      <void Function(RtcSignalingReceiveContext context)>{};

  @override
  RtcSignalingUnsubscribe on(
    void Function(RtcSignalingReceiveContext context) handler,
  ) {
    _handlers.add(handler);
    return () {
      _handlers.remove(handler);
    };
  }

  void emit(RtcSignalingReceiveContext context) {
    for (final handler in _handlers.toList(growable: false)) {
      handler(context);
    }
  }
}

final class _FakeRtcSignalingLiveLifecycleStream
    implements RtcSignalingLiveLifecycleStream {
  final Set<void Function(RtcSignalingLiveLifecycleState state)> _handlers =
      <void Function(RtcSignalingLiveLifecycleState state)>{};

  @override
  RtcSignalingUnsubscribe onStateChange(
    void Function(RtcSignalingLiveLifecycleState state) handler,
  ) {
    _handlers.add(handler);
    return () {
      _handlers.remove(handler);
    };
  }

  void emit(RtcSignalingLiveLifecycleState state) {
    for (final handler in _handlers.toList(growable: false)) {
      handler(state);
    }
  }
}

final class _FakeRtcSignalingSignalContext
    implements RtcSignalingSignalContext {
  _FakeRtcSignalingSignalContext(this.signal);

  @override
  final RtcSignalingSignalEvent signal;

  @override
  RtcSignalingRealtimeEvent get rawEvent => RtcSignalingRealtimeEvent(
        scopeType: 'rtc_session',
        scopeId: signal.rtcSessionId,
        eventType: 'rtc.signal',
        payload: jsonEncode(signal.toJson()),
        occurredAt: signal.occurredAt,
        signal: signal,
      );

  @override
  Future<RtcSignalingLiveAckState> ack() async {
    return const RtcSignalingLiveAckState(ackedThroughSeq: 1);
  }
}

final class _FakeVolcengineEngine extends RTCEngine {
  _FakeVolcengineEngine(this.runtimeCalls);

  final List<String> runtimeCalls;

  @override
  Future<RTCRoom?> createRTCRoom(
    String roomId, {
    bool autoInitRangeAudio = false,
    bool autoInitSpatialAudio = false,
  }) async {
    runtimeCalls.add('volcengine.createRTCRoom');
    return _FakeVolcengineRoom(roomId, runtimeCalls);
  }

  @override
  Future<int?> startAudioCapture() async {
    runtimeCalls.add('volcengine.startAudioCapture');
    return 0;
  }

  @override
  Future<int?> stopAudioCapture() async {
    runtimeCalls.add('volcengine.stopAudioCapture');
    return 0;
  }

  @override
  Future<int?> startVideoCapture() async {
    runtimeCalls.add('volcengine.startVideoCapture');
    return 0;
  }

  @override
  Future<int?> stopVideoCapture() async {
    runtimeCalls.add('volcengine.stopVideoCapture');
    return 0;
  }

  @override
  void destroy() {
    runtimeCalls.add('volcengine.destroy');
  }
}

final class _FakeVolcengineRoom extends RTCRoom {
  _FakeVolcengineRoom(super.roomId, this.runtimeCalls);

  final List<String> runtimeCalls;

  @override
  Future<int?> joinRoom({
    required string token,
    required UserInfo userInfo,
    required bool userVisibility,
    required volc_pack.RoomConfig roomConfig,
  }) async {
    runtimeCalls.add('volcengine.joinRoom');
    return 0;
  }

  @override
  Future<int?> leaveRoom() async {
    runtimeCalls.add('volcengine.leaveRoom');
    return 0;
  }

  @override
  Future<int?> publishStreamAudio(bool publish) async {
    runtimeCalls.add('volcengine.publishStreamAudio:$publish');
    return 0;
  }

  @override
  Future<int?> publishStreamVideo(bool publish) async {
    runtimeCalls.add('volcengine.publishStreamVideo:$publish');
    return 0;
  }
}

Future<void> _waitForControllerState(
  StandardRtcCallController<RtcVolcengineFlutterNativeClient> controller,
  RtcCallControllerState expectedState,
) async {
  final deadline = DateTime.now().add(const Duration(seconds: 2));
  while (DateTime.now().isBefore(deadline)) {
    if (controller.getSnapshot().controllerState == expectedState) {
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 20));
  }

  throw StateError(
    'Timed out waiting for controller state ${expectedState.name}. '
    'Current state: ${controller.getSnapshot().controllerState.name}',
  );
}

Map<String, Object?> _buildSummary({
  required _RtcCallSmokeOptions options,
  required RtcSignalingConnectOptions connectOptions,
  required RtcSignalingLiveConnection? liveConnection,
  required StandardRtcCallControllerStack<RtcVolcengineFlutterNativeClient>
      stack,
  required RtcCallControllerSnapshot endedSnapshot,
  required RtcCallControllerState acceptedControllerState,
  required List<String> runtimeCalls,
  required List<String> transportCalls,
  required List<String> eventTypes,
  required List<String> snapshotStates,
}) {
  final selection = stack.dataSource.describeSelection();
  return <String, Object?>{
    'defaultProviderKey': RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    'selectedProviderKey': selection.providerKey,
    'mediaProviderKey': stack.mediaClient.metadata.providerKey,
    'reuseLiveConnection': options.reuseLiveConnection,
    'acceptedControllerState': acceptedControllerState.name,
    'endedControllerState': endedSnapshot.controllerState.name,
    'endedCallState': endedSnapshot.state.name,
    'closedControllerState':
        stack.callController.getSnapshot().controllerState.name,
    'closedCallState': stack.callController.getSnapshot().state.name,
    'signalingTransport': buildRtcCallSmokeSignalingTransportSummary(
      deviceId: options.deviceId,
      connectOptions: connectOptions,
      liveConnection: liveConnection,
    ),
    'webSocketConnectCount':
        transportCalls.where((call) => call == 'realtime.ws.connect').length,
    'pollingPullCount':
        transportCalls.where((call) => call == 'realtime.pull').length,
    'sessionId': options.sessionId,
    'conversationId': options.conversationId,
    'runtimeCalls': runtimeCalls,
    'transportCalls': transportCalls,
    'eventTypes': eventTypes,
    'snapshotStates': snapshotStates,
  };
}

String _createTextSummary(Map<String, Object?> summary) {
  final runtimeCalls = (summary['runtimeCalls'] as List<Object?>).join(', ');
  final transportCalls =
      (summary['transportCalls'] as List<Object?>).join(', ');
  final eventTypes = (summary['eventTypes'] as List<Object?>).join(', ');
  final signalingTransport =
      summary['signalingTransport'] as Map<String, Object?>;
  return <String>[
    'SDKWork RTC Flutter call smoke',
    'default provider: ${summary['defaultProviderKey']}',
    'selected provider: ${summary['selectedProviderKey']}',
    'media provider: ${summary['mediaProviderKey']}',
    'reuse live connection: ${summary['reuseLiveConnection']}',
    'signaling transport: ${signalingTransport['transportTerm']}',
    'signaling auth mode: ${signalingTransport['authMode']}',
    'signaling device id: ${signalingTransport['deviceId']}',
    'signaling connectOptions.deviceId: '
        '${signalingTransport['connectOptionsDeviceId'] ?? 'n/a'}',
    'signaling shared live connection: '
        '${signalingTransport['usesSharedLiveConnection']}',
    'signaling polling fallback: '
        '${signalingTransport['pollingFallbackTerm']}',
    'accepted controller state: ${summary['acceptedControllerState']}',
    'ended controller state: ${summary['endedControllerState']}',
    'closed controller state: ${summary['closedControllerState']}',
    'websocket connect count: ${summary['webSocketConnectCount']}',
    'polling pull count: ${summary['pollingPullCount']}',
    'runtime calls: $runtimeCalls',
    'transport calls: $transportCalls',
    'event types: $eventTypes',
  ].join('\n');
}

Future<Map<String, Object?>> runRtcCallSmokeScenario(
  _RtcCallSmokeOptions options,
) async {
  final runtimeCalls = <String>[];
  final transportCalls = <String>[];
  final eventTypes = <String>[];
  final snapshotStates = <String>[];
  final signalingClient = _FakeRtcSignalingClient(options, transportCalls);
  final driverManager = RtcDriverManager(
    registerDefaultDrivers: false,
    drivers: <RtcProviderDriver<dynamic>>[
      createOfficialVolcengineFlutterRtcDriver(
        engineFactory: (_) async {
          runtimeCalls.add('volcengine.createEngine');
          return _FakeVolcengineEngine(runtimeCalls);
        },
      ),
    ],
  );

  StandardRtcCallControllerStack<RtcVolcengineFlutterNativeClient>? stack;
  RtcSignalingLiveConnection? providedLiveConnection;
  final connectOptions =
      buildRtcCallSmokeConnectOptions(deviceId: options.deviceId);
  try {
    if (options.reuseLiveConnection) {
      providedLiveConnection = await signalingClient.connect(
        buildRtcCallSmokeConnectOptions(
          deviceId: options.deviceId,
          conversationId: options.conversationId,
          includeConversationSubscriptions: true,
        ),
      );
    }

    stack = await createStandardRtcCallControllerStack<
        RtcVolcengineFlutterNativeClient>(
      CreateStandardRtcCallControllerStackOptions(
        sdk: signalingClient,
        deviceId: options.deviceId,
        liveConnection: providedLiveConnection,
        reconnectInterval: const Duration(milliseconds: 10),
        connectOptions: connectOptions,
        driverManager: driverManager,
        dataSourceOptions: RtcDataSourceOptions(
          nativeConfig: RtcVolcengineFlutterNativeConfig(
            appId: options.appId,
          ),
        ),
      ),
    );

    final stopEventSubscription = stack.callController.onEvent((event) {
      eventTypes.add(event.type.name);
    });
    final stopSnapshotSubscription =
        stack.callController.onSnapshot((snapshot) {
      snapshotStates.add(snapshot.controllerState.name);
    });

    try {
      await stack.callController.startOutgoing(
        RtcCallControllerOutgoingOptions(
          rtcSessionId: options.sessionId,
          conversationId: options.conversationId,
          rtcMode: 'video_call',
          roomId: options.roomId,
          participantId: options.participantId,
          signalingStreamId: options.signalingStreamId,
          autoPublish: const RtcCallAutoPublishOptions(
            audio: true,
            video: true,
          ),
        ),
      );

      await signalingClient.emitAcceptedSignal();
      await _waitForControllerState(
        stack.callController,
        RtcCallControllerState.connected,
      );
      final acceptedControllerState =
          stack.callController.getSnapshot().controllerState;

      await stack.callController.sendOffer(
        const RtcCallSessionDescriptionPayload(
          sdp: 'offer-sdp-smoke',
        ),
      );
      await stack.callController.sendIceCandidate(
        const RtcCallIceCandidatePayload(
          candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
        ),
      );

      final webSocketConnectCount = transportCalls
          .where((call) => call == 'realtime.ws.connect')
          .length;
      if (webSocketConnectCount != 1) {
        _fail(
          'Expected exactly one RTC WebSocket connection in the Flutter RTC smoke, '
          'but observed $webSocketConnectCount.',
        );
      }

      final pollingPullCount =
          transportCalls.where((call) => call == 'realtime.pull').length;
      if (pollingPullCount != 0) {
        _fail(
          'Flutter RTC smoke must stay WebSocket-first. '
          'Observed $pollingPullCount realtime pull calls.',
        );
      }

      final endedSnapshot = await stack.callController.end();
      await stack.close();

      return _buildSummary(
        options: options,
        connectOptions: connectOptions,
        liveConnection: providedLiveConnection,
        stack: stack,
        endedSnapshot: endedSnapshot,
        acceptedControllerState: acceptedControllerState,
        runtimeCalls: runtimeCalls,
        transportCalls: transportCalls,
        eventTypes: eventTypes,
        snapshotStates: snapshotStates,
      );
    } finally {
      stopEventSubscription();
      stopSnapshotSubscription();
    }
  } finally {
    if (stack != null) {
      await stack.close();
    }
    if (providedLiveConnection != null) {
      await providedLiveConnection.disconnect();
    }
  }
}

Future<int> runRtcCallSmokeCli(
  List<String> argv, {
  IOSink? stdoutSink,
}) async {
  final stdoutWriter = stdoutSink ?? stdout;
  final options = _parseRtcCallSmokeArgs(argv);

  if (options.help) {
    _writeLine(stdoutWriter, getRtcCallSmokeHelpText());
    return 0;
  }

  final summary = await runRtcCallSmokeScenario(options);
  if (options.json) {
    _writeLine(
        stdoutWriter, const JsonEncoder.withIndent('  ').convert(summary));
  } else {
    _writeLine(stdoutWriter, _createTextSummary(summary));
  }

  return 0;
}

Future<void> main(List<String> args) async {
  try {
    final resultCode = await runRtcCallSmokeCli(args);
    if (resultCode != 0) {
      stderr.writeln('[sdkwork-rtc-sdk-flutter] sdk-call-smoke failed.');
    }
    exitCode = resultCode;
  } catch (error) {
    stderr.writeln('[sdkwork-rtc-sdk-flutter] $error');
    exitCode = 1;
  }
}
