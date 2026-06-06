import 'dart:async';

export 'rtc_call_controller_contract.dart';
export 'rtc_call_controller_models.dart';

import 'rtc_call_controller_message.dart';
import 'rtc_call_controller_emission.dart';
import 'rtc_call_controller_lifecycle.dart';
import 'rtc_call_controller_subscription.dart';
import 'rtc_call_controller_contract.dart';
import 'rtc_call_controller_models.dart';
import 'rtc_call_controller_state.dart';
import 'rtc_call_session.dart';
import 'rtc_call_types.dart';
import 'rtc_errors.dart';
import 'rtc_signaling_adapter.dart';

class StandardRtcCallController<TNativeClient> implements RtcCloseable {
  factory StandardRtcCallController(
    CreateStandardRtcCallControllerOptions<TNativeClient> options,
  ) {
    final realtimeDispatcher = options.realtimeDispatcher ??
        RtcSignalingRealtimeDispatcher(
          CreateRtcSignalingAdapterOptions(
            sdk: options.sdk,
            deviceId: options.deviceId,
            reconnectInterval: options.reconnectInterval,
            liveConnection: options.liveConnection,
            connectOptions: options.connectOptions,
          ),
        );
    final signaling = options.signaling ??
        createRtcSignalingAdapter(
          CreateRtcSignalingAdapterOptions(
            sdk: options.sdk,
            deviceId: options.deviceId,
            reconnectInterval: options.reconnectInterval,
            liveConnection: options.liveConnection,
            connectOptions: options.connectOptions,
            realtimeDispatcher: realtimeDispatcher,
          ),
        );

    return StandardRtcCallController._(
      sdk: options.sdk,
      callSession: options.callSession,
      signaling: signaling,
      realtimeDispatcher: realtimeDispatcher,
      watchConversationIds: options.watchConversationIds,
    );
  }

  StandardRtcCallController._({
    required RtcSignalingClient sdk,
    required StandardRtcCallSession<TNativeClient> callSession,
    required RtcCallSignalingAdapter signaling,
    required RtcSignalingRealtimeDispatcher realtimeDispatcher,
    required List<String> watchConversationIds,
  })  : _sdk = sdk,
        _callSession = callSession,
        _signaling = signaling {
    _sessionSubscriptionManager = RtcCallControllerSessionSubscriptionManager(
      signaling: _signaling,
      onSignal: _handleSessionSignal,
    );
    _conversationSubscriptionManager =
        RtcCallControllerConversationSubscriptionManager(
      realtimeDispatcher: realtimeDispatcher,
      onSignal: _handleConversationSignal,
    );
    _watchedConversationIds.addAll(watchConversationIds);
  }

  final RtcSignalingClient _sdk;
  final StandardRtcCallSession<TNativeClient> _callSession;
  final RtcCallSignalingAdapter _signaling;
  late final RtcCallControllerSessionSubscriptionManager
      _sessionSubscriptionManager;
  late final RtcCallControllerConversationSubscriptionManager
      _conversationSubscriptionManager;
  final Set<RtcCallControllerEventHandler> _eventHandlers =
      <RtcCallControllerEventHandler>{};
  final Set<RtcCallControllerSnapshotHandler> _snapshotHandlers =
      <RtcCallControllerSnapshotHandler>{};
  final Set<String> _watchedConversationIds = <String>{};

  RtcCallControllerState _controllerState = RtcCallControllerState.idle;
  RtcCallControllerDirection? _direction;
  RtcIncomingCallInvitation? _activeInvitation;
  RtcCallSignal? _lastSignal;
  Object? _lastError;

  RtcCallControllerSnapshot getSnapshot() => _createSnapshot();

  void Function() onEvent(RtcCallControllerEventHandler handler) {
    _eventHandlers.add(handler);
    return () {
      _eventHandlers.remove(handler);
    };
  }

  void Function() onSnapshot(RtcCallControllerSnapshotHandler handler) {
    _snapshotHandlers.add(handler);
    return () {
      _snapshotHandlers.remove(handler);
    };
  }

  Future<RtcCallControllerSnapshot> replaceWatchedConversations(
    List<String> conversationIds,
  ) async {
    final nextIds = conversationIds.toSet();
    await _conversationSubscriptionManager.replaceWatchedConversations(nextIds);
    _watchedConversationIds
      ..clear()
      ..addAll(nextIds);

    _controllerState = resolveRtcCallControllerWatchState(
      watchedConversationCount: _watchedConversationIds.length,
      activeSessionId: _sessionSubscriptionManager.activeSessionId,
      controllerState: _controllerState,
    );

    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> startOutgoing(
    RtcCallControllerOutgoingOptions options,
  ) async {
    _ensureNoConflictingActiveCall(options.rtcSessionId);

    final sessionSnapshot = await _callSession.startOutgoing(
      RtcOutgoingCallOptions(
        rtcSessionId: options.rtcSessionId,
        conversationId: options.conversationId,
        rtcMode: options.rtcMode,
        roomId: options.roomId,
        participantId: options.participantId,
        signalingStreamId: options.signalingStreamId,
        subscribeSignals: false,
        autoPublish: options.autoPublish,
      ),
    );

    await _subscribeToSessionSignals(options.rtcSessionId);

    await publishRtcConversationSignal(
      _sdk,
      conversationId: options.conversationId!,
      signalType: rtcCallInviteSignalType,
      schemaRef: rtcCallInviteSchemaRef,
      text: options.invitationText ?? 'RTC call invite',
      payload: createRtcCallControllerOutgoingInvitationPayload(
        options: options,
        sessionSnapshot: sessionSnapshot,
        sentAt: DateTime.now().toUtc().toIso8601String(),
      ).toJson(),
    );

    _direction = RtcCallControllerDirection.outgoing;
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.outgoingRinging;
    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> acceptIncoming(
    RtcCallControllerAcceptOptions options,
  ) async {
    _ensureNoConflictingActiveCall(options.rtcSessionId);
    await _subscribeToSessionSignals(options.rtcSessionId);
    _controllerState = RtcCallControllerState.connecting;
    _emitSnapshot();

    await _callSession.acceptIncoming(
      RtcIncomingCallAcceptOptions(
        rtcSessionId: options.rtcSessionId,
        conversationId:
            options.conversationId ?? _activeInvitation?.conversationId,
        rtcMode: options.rtcMode ?? _activeInvitation?.rtcMode,
        roomId: options.roomId ?? _activeInvitation?.roomId,
        participantId: options.participantId,
        subscribeSignals: false,
        autoPublish: options.autoPublish,
      ),
    );

    final acceptedSessionSnapshot = _callSession.getSnapshot();
    await _signaling.sendSignal(
      options.rtcSessionId,
      rtcCallAcceptedSignalType,
      createRtcCallControllerAcceptedLifecyclePayload(
        options: options,
        sessionSnapshot: acceptedSessionSnapshot,
        occurredAt: DateTime.now().toUtc().toIso8601String(),
      ).toJson(),
      options: createRtcCallControllerSignalSendOptions(
        sessionSnapshot: acceptedSessionSnapshot,
        activeInvitation: _activeInvitation,
        schemaRef: rtcCallLifecycleSchemaRef,
      ),
    );

    _direction = RtcCallControllerDirection.incoming;
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.connected;
    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> rejectIncoming(
    RtcCallControllerRejectOptions options,
  ) async {
    await _signaling.sendSignal(
      options.rtcSessionId,
      rtcCallRejectedSignalType,
      createRtcCallControllerRejectedLifecyclePayload(
        options: options,
        activeInvitation: _activeInvitation,
        occurredAt: DateTime.now().toUtc().toIso8601String(),
      ).toJson(),
      options: createRtcCallControllerSignalSendOptions(
        sessionSnapshot: _callSession.getSnapshot(),
        activeInvitation: _activeInvitation,
        schemaRef: rtcCallLifecycleSchemaRef,
      ),
    );

    await _callSession.rejectIncoming(options);
    _direction = RtcCallControllerDirection.incoming;
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.rejected;
    _sessionSubscriptionManager.clear();
    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> end([
    RtcCallControllerEndOptions options = const RtcCallControllerEndOptions(),
  ]) async {
    final sessionSnapshot = _callSession.getSnapshot();
    final rtcSessionId =
        sessionSnapshot.rtcSessionId ?? _activeInvitation?.rtcSessionId;
    if (rtcSessionId == null || rtcSessionId.isEmpty) {
      throw RtcSdkException(
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session to end.',
      );
    }

    await _signaling.sendSignal(
      rtcSessionId,
      rtcCallEndedSignalType,
      createRtcCallControllerEndedLifecyclePayload(
        rtcSessionId: rtcSessionId,
        options: options,
        sessionSnapshot: sessionSnapshot,
        activeInvitation: _activeInvitation,
        occurredAt: DateTime.now().toUtc().toIso8601String(),
      ).toJson(),
      options: createRtcCallControllerSignalSendOptions(
        sessionSnapshot: sessionSnapshot,
        activeInvitation: _activeInvitation,
        schemaRef: rtcCallLifecycleSchemaRef,
      ),
    );

    await _callSession.end();
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.ended;
    _sessionSubscriptionManager.clear();
    return _emitSnapshot();
  }

  Future<RtcCallSignal> sendSignal(String signalType, Object? payload) async {
    final signal = await _callSession.sendSignal(signalType, payload);
    _lastSignal = signal;
    _emitSignal(signal);
    return signal;
  }

  Future<RtcCallSignal> sendOffer(
    RtcCallSessionDescriptionPayload payload,
  ) {
    return _sendTypedSignal(
      rtcCallOfferSignalType,
      payload.toJson(),
      rtcCallSessionDescriptionSchemaRef,
    );
  }

  Future<RtcCallSignal> sendAnswer(
    RtcCallSessionDescriptionPayload payload,
  ) {
    return _sendTypedSignal(
      rtcCallAnswerSignalType,
      payload.toJson(),
      rtcCallSessionDescriptionSchemaRef,
    );
  }

  Future<RtcCallSignal> sendIceCandidate(
    RtcCallIceCandidatePayload payload,
  ) {
    return _sendTypedSignal(
      rtcCallIceCandidateSignalType,
      payload.toJson(),
      rtcCallIceCandidateSchemaRef,
    );
  }

  @override
  Future<void> close() async {
    _sessionSubscriptionManager.clear();
    _conversationSubscriptionManager.clear();
    await _callSession.close();
    _watchedConversationIds.clear();
    _activeInvitation = null;
    _direction = null;
    _lastSignal = null;
    _lastError = null;
    _controllerState = RtcCallControllerState.idle;
    _emitSnapshot();
  }

  Future<void> _subscribeToSessionSignals(String rtcSessionId) async {
    await _sessionSubscriptionManager.subscribe(rtcSessionId);
  }

  Future<void> _handleSessionSignal(RtcCallSignal signal) async {
    _lastSignal = signal;

    if (signal.signalType == rtcCallAcceptedSignalType) {
      _controllerState = RtcCallControllerState.connected;
      _direction ??= RtcCallControllerDirection.outgoing;
    } else {
      final nextState =
          resolveRtcCallControllerTerminalState(signal.signalType);
      if (nextState == null) {
        _emitSignal(signal);
        return;
      }

      await _callSession.leaveMedia();
      _callSession.reconcileSessionRecord(
        createRtcCallControllerTerminalSessionRecord(
          signal: signal,
          nextState: nextState,
        ),
      );
      _controllerState = nextState;
      _activeInvitation = null;
      _sessionSubscriptionManager.clear();
    }

    _emitSignal(signal);
  }

  Future<void> _handleConversationSignal(
    RtcConversationSignalMessage signal,
  ) async {
    final invitation = toRtcIncomingCallInvitation(signal);
    if (invitation == null) {
      return;
    }

    _ensureNoConflictingActiveCall(invitation.rtcSessionId);
    await _subscribeToSessionSignals(invitation.rtcSessionId);
    _direction = RtcCallControllerDirection.incoming;
    _activeInvitation = invitation;
    _controllerState = RtcCallControllerState.incomingRinging;
    emitRtcCallControllerIncomingInvitation(
      invitation: invitation,
      snapshot: _createSnapshot(),
      eventHandlers: _eventHandlers.toList(growable: false),
      onError: (error) {
        _lastError = error;
      },
    );
    _emitSnapshot();
  }

  void _ensureNoConflictingActiveCall(String nextRtcSessionId) {
    final sessionSnapshot = _callSession.getSnapshot();
    final currentRtcSessionId =
        sessionSnapshot.rtcSessionId ?? _activeInvitation?.rtcSessionId;
    final hasActiveCall = hasRtcCallControllerActiveCall(
      currentRtcSessionId: currentRtcSessionId,
      controllerState: _controllerState,
    );

    if (hasActiveCall && currentRtcSessionId != nextRtcSessionId) {
      throw RtcSdkException(
        code: 'call_state_invalid',
        message: 'RTC call controller already has an active session.',
        details: <String, Object?>{
          'currentRtcSessionId': currentRtcSessionId,
          'nextRtcSessionId': nextRtcSessionId,
        },
      );
    }
  }

  RtcCallControllerSnapshot _createSnapshot() {
    return createRtcCallControllerSnapshot(
      sessionSnapshot: _callSession.getSnapshot(),
      controllerState: _controllerState,
      watchedConversationIds: _watchedConversationIds.toList(growable: false),
      direction: _direction,
      activeInvitation: _activeInvitation,
      lastSignal: _lastSignal,
      lastError: _lastError,
    );
  }

  RtcCallControllerSnapshot _emitSnapshot() {
    return emitRtcCallControllerSnapshot(
      snapshot: _createSnapshot(),
      snapshotHandlers: _snapshotHandlers.toList(growable: false),
      eventHandlers: _eventHandlers.toList(growable: false),
      onError: (error) {
        _lastError = error;
      },
    );
  }

  void _emitSignal(RtcCallSignal signal) {
    emitRtcCallControllerSignal(
      signal: signal,
      snapshot: _createSnapshot(),
      eventHandlers: _eventHandlers.toList(growable: false),
      onError: (error) {
        _lastError = error;
      },
    );
  }

  Future<RtcCallSignal> _sendTypedSignal(
    String signalType,
    Object payload,
    String schemaRef,
  ) async {
    final sessionSnapshot = _callSession.getSnapshot();
    final rtcSessionId = sessionSnapshot.rtcSessionId;
    if (rtcSessionId == null || rtcSessionId.isEmpty) {
      throw RtcSdkException(
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session for signaling.',
      );
    }

    final signal = await _signaling.sendSignal(
      rtcSessionId,
      signalType,
      payload,
      options: RtcCallSignalSendOptions(
        signalingStreamId: sessionSnapshot.signalingStreamId,
        schemaRef: schemaRef,
      ),
    );
    _lastSignal = signal;
    _emitSignal(signal);
    return signal;
  }
}

Future<StandardRtcCallController<TNativeClient>>
    createStandardRtcCallController<TNativeClient>(
  CreateStandardRtcCallControllerOptions<TNativeClient> options,
) async {
  final controller = StandardRtcCallController<TNativeClient>(options);
  await controller.replaceWatchedConversations(options.watchConversationIds);
  return controller;
}
