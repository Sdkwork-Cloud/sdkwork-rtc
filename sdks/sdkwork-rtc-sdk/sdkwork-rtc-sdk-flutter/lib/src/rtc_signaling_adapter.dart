import 'dart:async';

export 'rtc_signaling_message.dart';
export 'rtc_signaling_protocol.dart';

import 'rtc_call_types.dart';
import 'rtc_errors.dart';
import 'rtc_signaling_codec.dart';
import 'rtc_signaling_message.dart';
import 'rtc_signaling_protocol.dart';
import 'rtc_signaling_transport.dart';

const List<String> _defaultRtcConversationEventTypes = <String>[
  'message.created',
  'message.updated',
  'message.recalled',
];

const List<String> _defaultRtcSessionEventTypes = <String>[
  'rtc.signal',
];

List<String> _mergeScopeIds(
  List<String> baseline,
  Iterable<String> dynamicScopeIds,
) {
  return <String>{
    ...baseline,
    ...dynamicScopeIds,
  }.toList(growable: false)
    ..sort();
}

List<RtcSignalingRealtimeSubscriptionItem> _dedupeSubscriptionItems(
  Iterable<RtcSignalingRealtimeSubscriptionItem> items,
) {
  final deduped = <String, RtcSignalingRealtimeSubscriptionItem>{};

  for (final item in items) {
    final eventTypesKey = (item.eventTypes ?? const <String>[]).join('|');
    final key = '${item.scopeType}:${item.scopeId}:$eventTypesKey';
    deduped[key] = item;
  }

  return deduped.values.toList(growable: false);
}

class CreateRtcSignalingAdapterOptions {
  const CreateRtcSignalingAdapterOptions({
    required this.sdk,
    required this.deviceId,
    Duration reconnectInterval = const Duration(seconds: 1),
    this.liveConnection,
    this.connectOptions,
    this.realtimeDispatcher,
  }) : reconnectInterval = reconnectInterval;

  final RtcSignalingClient sdk;
  final String deviceId;
  final Duration reconnectInterval;
  final RtcSignalingLiveConnection? liveConnection;
  final RtcSignalingConnectOptions? connectOptions;
  final RtcSignalingRealtimeDispatcher? realtimeDispatcher;
}

RtcCallSignalingAdapter createRtcSignalingAdapter(
  CreateRtcSignalingAdapterOptions options,
) {
  return _RtcSignalingAdapter(options);
}

final class _RtcSignalingAdapter implements RtcCallSignalingAdapter {
  _RtcSignalingAdapter(CreateRtcSignalingAdapterOptions options)
      : _sdk = options.sdk,
        _dispatcher =
            options.realtimeDispatcher ?? RtcSignalingRealtimeDispatcher(options);

  final RtcSignalingClient _sdk;
  final RtcSignalingRealtimeDispatcher _dispatcher;

  @override
  Future<RtcCallSessionRecord> createSession({
    required String rtcSessionId,
    String? conversationId,
    required String rtcMode,
  }) async {
    final session = await _sdk.rtc.create(
      CreateRtcSessionRequest(
        rtcSessionId: rtcSessionId,
        conversationId: conversationId,
        rtcMode: rtcMode,
      ),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> inviteSession(
    String rtcSessionId, {
    String? signalingStreamId,
  }) async {
    final session = await _sdk.rtc.invite(
      rtcSessionId,
      InviteRtcSessionRequest(signalingStreamId: signalingStreamId),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> acceptSession(String rtcSessionId) async {
    final session = await _sdk.rtc.accept(
      rtcSessionId,
      const UpdateRtcSessionRequest(),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> rejectSession(String rtcSessionId) async {
    final session = await _sdk.rtc.reject(
      rtcSessionId,
      const UpdateRtcSessionRequest(),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> endSession(String rtcSessionId) async {
    final session = await _sdk.rtc.end(
      rtcSessionId,
      const UpdateRtcSessionRequest(),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSignal> sendSignal(
    String rtcSessionId,
    String signalType,
    Object? payload, {
    RtcCallSignalSendOptions options = const RtcCallSignalSendOptions(),
  }) async {
    final signalEvent = await _sdk.rtc.postJsonSignal(
      rtcSessionId,
      signalType: signalType,
      options: RtcSignalingPostJsonSignalOptions(
        payload: payload,
        signalingStreamId: options.signalingStreamId,
        schemaRef: options.schemaRef,
      ),
    );
    return toRtcCallSignal(signalEvent);
  }

  @override
  Future<RtcCallParticipantCredential> issueParticipantCredential(
    String rtcSessionId, {
    required String participantId,
  }) async {
    final credential = await _sdk.rtc.issueParticipantCredential(
      rtcSessionId,
      IssueRtcParticipantCredentialRequest(participantId: participantId),
    );
    return toRtcCallParticipantCredential(credential);
  }

  @override
  Future<RtcCallSignalSubscription> subscribeSessionSignals(
    String rtcSessionId,
    RtcCallSignalHandler handler,
  ) {
    return _dispatcher.subscribeRtcSessionSignals(rtcSessionId, handler);
  }
}

class RtcSignalingRealtimeDispatcher {
  RtcSignalingRealtimeDispatcher(CreateRtcSignalingAdapterOptions options)
      : _sdk = options.sdk,
        _deviceId = describeRtcSignalingTransport(
          deviceId: options.deviceId,
          connectOptions: options.connectOptions,
          liveConnection: options.liveConnection,
        ).deviceId,
        _reconnectInterval = options.reconnectInterval,
        _providedLiveConnection = options.liveConnection,
        _connectOptions = options.connectOptions;

  final RtcSignalingClient _sdk;
  final String _deviceId;
  final Duration _reconnectInterval;
  final RtcSignalingLiveConnection? _providedLiveConnection;
  final RtcSignalingConnectOptions? _connectOptions;
  final Map<String, Set<RtcCallSignalHandler>> _handlersBySessionId =
      <String, Set<RtcCallSignalHandler>>{};
  final Map<String, Set<RtcConversationSignalHandler>>
      _conversationHandlersById =
      <String, Set<RtcConversationSignalHandler>>{};

  RtcSignalingLiveConnection? _liveConnection;
  var _ownsLiveConnection = false;
  RtcSignalingUnsubscribe? _liveEventSubscription;
  RtcSignalingUnsubscribe? _liveStateSubscription;
  Future<void>? _connectTask;
  Timer? _reconnectTimer;
  var _subscriptionRevision = 0;
  var _appliedSubscriptionRevision = -1;

  Future<RtcCallSignalSubscription> subscribeRtcSessionSignals(
    String rtcSessionId,
    RtcCallSignalHandler handler,
  ) async {
    final handlers = _handlersBySessionId.putIfAbsent(
      rtcSessionId,
      () => <RtcCallSignalHandler>{},
    );
    handlers.add(handler);
    _markSubscriptionStateChanged();

    try {
      await _ensureLiveConnection();
      await _syncSubscriptionsIfNeeded();
    } catch (error) {
      final currentHandlers = _handlersBySessionId[rtcSessionId];
      currentHandlers?.remove(handler);
      if (currentHandlers != null && currentHandlers.isEmpty) {
        _handlersBySessionId.remove(rtcSessionId);
      }

      _markSubscriptionStateChanged();
      unawaited(_syncSubscriptionsIfNeeded());
      _closeIfIdle();
      rethrow;
    }

    return _RtcCallSignalSubscription(
      onUnsubscribe: () {
        final currentHandlers = _handlersBySessionId[rtcSessionId];
        if (currentHandlers == null) {
          return;
        }

        currentHandlers.remove(handler);
        if (currentHandlers.isEmpty) {
          _handlersBySessionId.remove(rtcSessionId);
        }

        _markSubscriptionStateChanged();
        unawaited(_syncSubscriptionsIfNeeded());
        _closeIfIdle();
      },
    );
  }

  Future<RtcCallSignalSubscription> subscribeConversationSignals(
    String conversationId,
    RtcConversationSignalHandler handler,
  ) async {
    final handlers = _conversationHandlersById.putIfAbsent(
      conversationId,
      () => <RtcConversationSignalHandler>{},
    );
    handlers.add(handler);
    _markSubscriptionStateChanged();

    try {
      await _ensureLiveConnection();
      await _syncSubscriptionsIfNeeded();
    } catch (error) {
      final currentHandlers = _conversationHandlersById[conversationId];
      currentHandlers?.remove(handler);
      if (currentHandlers != null && currentHandlers.isEmpty) {
        _conversationHandlersById.remove(conversationId);
      }

      _markSubscriptionStateChanged();
      unawaited(_syncSubscriptionsIfNeeded());
      _closeIfIdle();
      rethrow;
    }

    return _RtcCallSignalSubscription(
      onUnsubscribe: () {
        final currentHandlers = _conversationHandlersById[conversationId];
        if (currentHandlers == null) {
          return;
        }

        currentHandlers.remove(handler);
        if (currentHandlers.isEmpty) {
          _conversationHandlersById.remove(conversationId);
        }

        _markSubscriptionStateChanged();
        unawaited(_syncSubscriptionsIfNeeded());
        _closeIfIdle();
      },
    );
  }

  Future<void> _ensureLiveConnection() async {
    if (!_hasSubscriptions || _liveConnection != null) {
      return;
    }

    if (_connectTask != null) {
      await _connectTask;
      return;
    }

    _connectTask = _connectLive();
    await _connectTask;
  }

  Future<void> _connectLive() async {
    try {
      final providedLiveConnection = _providedLiveConnection;
      if (providedLiveConnection != null) {
        _attachLiveConnection(
          providedLiveConnection,
          ownsLiveConnection: false,
        );
        _appliedSubscriptionRevision = -1;
        await _syncSubscriptionsIfNeeded();
        return;
      }

      final requestedRevision = _subscriptionRevision;
      final live = await _sdk.connect(_buildConnectOptions());
      _attachLiveConnection(live, ownsLiveConnection: true);
      _appliedSubscriptionRevision = requestedRevision;
      await _syncSubscriptionsIfNeeded();
    } finally {
      _connectTask = null;
    }
  }

  Future<void> _syncSubscriptions() async {
    await _sdk.realtime.replaceSubscriptions(
      RtcSignalingSyncRealtimeSubscriptionsRequest(
        deviceId: _deviceId,
        items: _buildSubscriptionItems(),
      ),
    );
    _appliedSubscriptionRevision = _subscriptionRevision;
  }

  Future<void> _syncSubscriptionsIfNeeded() async {
    if (_liveConnection == null ||
        _appliedSubscriptionRevision == _subscriptionRevision) {
      return;
    }

    await _syncSubscriptions();
  }

  bool get _hasSubscriptions =>
      _handlersBySessionId.isNotEmpty || _conversationHandlersById.isNotEmpty;

  RtcSignalingRealtimeSubscriptionGroups _buildSubscriptionGroups() {
    final baselineSubscriptions = _connectOptions?.subscriptions;
    return RtcSignalingRealtimeSubscriptionGroups(
      conversations: _mergeScopeIds(
        baselineSubscriptions?.conversations ?? const <String>[],
        _conversationHandlersById.keys,
      ),
      rtcSessions: _mergeScopeIds(
        baselineSubscriptions?.rtcSessions ?? const <String>[],
        _handlersBySessionId.keys,
      ),
      items: baselineSubscriptions?.items ??
          const <RtcSignalingRealtimeSubscriptionItem>[],
    );
  }

  RtcSignalingConnectOptions _buildConnectOptions() {
    return RtcSignalingConnectOptions(
      deviceId: _deviceId,
      subscriptions: _buildSubscriptionGroups(),
      url: _connectOptions?.url,
      headers: _connectOptions?.headers,
      protocols: _connectOptions?.protocols,
      connectTimeout:
          _connectOptions?.connectTimeout ?? const Duration(seconds: 15),
      webSocketAuth: _connectOptions?.webSocketAuth,
    );
  }

  List<RtcSignalingRealtimeSubscriptionItem> _buildSubscriptionItems() {
    final groups = _buildSubscriptionGroups();
    return _dedupeSubscriptionItems(<RtcSignalingRealtimeSubscriptionItem>[
      ...groups.conversations.map(
        (conversationId) => RtcSignalingRealtimeSubscriptionItem(
          scopeType: 'conversation',
          scopeId: conversationId,
          eventTypes: _defaultRtcConversationEventTypes,
        ),
      ),
      ...groups.rtcSessions.map(
        (rtcSessionId) => RtcSignalingRealtimeSubscriptionItem(
          scopeType: 'rtc_session',
          scopeId: rtcSessionId,
          eventTypes: _defaultRtcSessionEventTypes,
        ),
      ),
      ...groups.items,
    ]);
  }

  void _dispatchRealtimeEvent(RtcSignalingReceiveContext context) {
    var shouldAck = false;
    final event = context.rawEvent;

    final conversationSignal =
        toRtcConversationSignalMessageFromRealtimeEvent(event);
    if (conversationSignal != null) {
      shouldAck = true;
      final handlers =
          _conversationHandlersById[conversationSignal.conversationId];
      if (handlers != null && handlers.isNotEmpty) {
        final dispatchedHandlers = handlers.toList(growable: false);
        for (final handler in dispatchedHandlers) {
          handler(conversationSignal);
        }
      }
    }

    if (event.scopeType == 'rtc_session' &&
        event.eventType == 'rtc.signal' &&
        event.scopeId != null) {
      final signal = context is RtcSignalingSignalContext
          ? RtcCallSignal(
              rtcSessionId: context.signal.rtcSessionId,
              conversationId: context.signal.conversationId,
              rtcMode: context.signal.rtcMode,
              signalType: context.signal.signalType,
              payload: context.signal.payload,
              rawPayload: context.signal.rawPayload ?? '',
              senderId: context.signal.senderId,
              signalingStreamId: context.signal.signalingStreamId,
              occurredAt: context.signal.occurredAt,
            )
          : toRtcCallSignalFromRealtimeEvent(event);
      if (signal != null) {
        shouldAck = true;
        final handlers = _handlersBySessionId[event.scopeId];
        if (handlers != null && handlers.isNotEmpty) {
          final dispatchedHandlers = handlers.toList(growable: false);
          for (final handler in dispatchedHandlers) {
            handler(signal);
          }
        }
      }
    }

    if (shouldAck) {
      unawaited(context.ack());
    }
  }

  void _markSubscriptionStateChanged() {
    _subscriptionRevision += 1;
  }

  void _scheduleReconnect() {
    if (_providedLiveConnection != null) {
      return;
    }

    _tearDownLiveBindings(disconnectLiveConnection: true);
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectInterval, () {
      _reconnectTimer = null;
      unawaited(_ensureLiveConnection());
    });
  }

  void _closeIfIdle() {
    if (_hasSubscriptions) {
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _tearDownLiveBindings(disconnectLiveConnection: true);
  }

  void _attachLiveConnection(
    RtcSignalingLiveConnection liveConnection, {
    required bool ownsLiveConnection,
  }) {
    _tearDownLiveBindings(disconnectLiveConnection: false);
    _liveConnection = liveConnection;
    _ownsLiveConnection = ownsLiveConnection;
    _liveEventSubscription = liveConnection.events.on(_dispatchRealtimeEvent);
    _liveStateSubscription = liveConnection.lifecycle.onStateChange((state) {
      if (!_hasSubscriptions || !ownsLiveConnection) {
        return;
      }
      if (state.status == RtcSignalingLiveConnectionStatus.error ||
          state.status == RtcSignalingLiveConnectionStatus.closed) {
        _scheduleReconnect();
      }
    });
  }

  void _tearDownLiveBindings({required bool disconnectLiveConnection}) {
    _liveEventSubscription?.call();
    _liveEventSubscription = null;
    _liveStateSubscription?.call();
    _liveStateSubscription = null;

    final liveConnection = _liveConnection;
    final ownsLiveConnection = _ownsLiveConnection;
    _liveConnection = null;
    _ownsLiveConnection = false;
    if (disconnectLiveConnection &&
        ownsLiveConnection &&
        liveConnection != null) {
      unawaited(liveConnection.disconnect());
    }
  }
}

final class _RtcCallSignalSubscription implements RtcCallSignalSubscription {
  _RtcCallSignalSubscription({
    required void Function() onUnsubscribe,
  }) : _onUnsubscribe = onUnsubscribe;

  final void Function() _onUnsubscribe;
  bool _unsubscribed = false;

  @override
  void unsubscribe() {
    if (_unsubscribed) {
      return;
    }

    _unsubscribed = true;
    _onUnsubscribe();
  }
}
