export 'rtc_closeable.dart';

import 'rtc_closeable.dart';
import 'rtc_call_types.dart';
import 'rtc_errors.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';

const RtcCallSessionSnapshot _idleRtcCallSessionSnapshot =
    RtcCallSessionSnapshot(
  state: RtcCallState.idle,
);

class StandardRtcCallSession<TNativeClient> implements RtcCloseable {
  StandardRtcCallSession({
    required RtcClient<TNativeClient> mediaClient,
    required RtcCallSignalingAdapter signaling,
  })  : _mediaClient = mediaClient,
        _signaling = signaling;

  final RtcClient<TNativeClient> _mediaClient;
  final RtcCallSignalingAdapter _signaling;
  final Set<RtcCallSignalHandler> _signalHandlers = <RtcCallSignalHandler>{};

  RtcCallSignalSubscription? _signalSubscription;
  RtcCallSessionSnapshot _snapshot = _idleRtcCallSessionSnapshot;

  RtcCallSessionSnapshot getSnapshot() => _snapshot;

  void Function() onSignal(RtcCallSignalHandler handler) {
    _signalHandlers.add(handler);
    return () {
      _signalHandlers.remove(handler);
    };
  }

  Future<RtcCallSessionSnapshot> startOutgoing(
    RtcOutgoingCallOptions options,
  ) async {
    if (options.subscribeSignals) {
      await _ensureSignalSubscription(options.rtcSessionId);
    }

    final createdSession = await _signaling.createSession(
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId,
      rtcMode: options.rtcMode,
    );
    _applySessionRecord(createdSession);

    final invitedSession = await _signaling.inviteSession(
      options.rtcSessionId,
      signalingStreamId: options.signalingStreamId,
    );
    _applySessionRecord(invitedSession);

    return _connectMedia(
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId ?? invitedSession.conversationId,
      rtcMode: options.rtcMode,
      roomId: options.roomId ?? options.rtcSessionId,
      participantId: options.participantId,
      autoPublish: options.autoPublish,
    );
  }

  Future<RtcCallSessionSnapshot> acceptIncoming(
    RtcIncomingCallAcceptOptions options,
  ) async {
    if (options.subscribeSignals) {
      await _ensureSignalSubscription(options.rtcSessionId);
    }

    final acceptedSession = await _signaling.acceptSession(options.rtcSessionId);
    _applySessionRecord(acceptedSession);

    return _connectMedia(
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId ?? acceptedSession.conversationId,
      rtcMode: options.rtcMode ?? acceptedSession.rtcMode ?? 'video_call',
      roomId: options.roomId ?? options.rtcSessionId,
      participantId: options.participantId,
      autoPublish: options.autoPublish,
    );
  }

  Future<RtcCallSessionSnapshot> rejectIncoming(
    RtcIncomingCallRejectOptions options,
  ) async {
    final rejectedSession = await _signaling.rejectSession(options.rtcSessionId);
    _applySessionRecord(rejectedSession);
    _snapshot = RtcCallSessionSnapshot(
      rtcSessionId: _snapshot.rtcSessionId,
      conversationId: _snapshot.conversationId,
      rtcMode: _snapshot.rtcMode,
      roomId: _snapshot.roomId,
      participantId: _snapshot.participantId,
      providerKey: _snapshot.providerKey,
      signalingStreamId: _snapshot.signalingStreamId,
      providerPluginId: _snapshot.providerPluginId,
      providerSessionId: _snapshot.providerSessionId,
      accessEndpoint: _snapshot.accessEndpoint,
      providerRegion: _snapshot.providerRegion,
      startedAt: _snapshot.startedAt,
      endedAt: _snapshot.endedAt,
      state: RtcCallState.rejected,
      mediaConnectionState: _snapshot.mediaConnectionState,
    );
    return _snapshot;
  }

  RtcCallSessionSnapshot reconcileSessionRecord(RtcCallSessionRecord record) {
    _applySessionRecord(record);
    return _snapshot;
  }

  Future<RtcCallSessionSnapshot> leaveMedia() async {
    if (_snapshot.mediaConnectionState != RtcSessionConnectionState.joined) {
      return _snapshot;
    }

    final mediaSession = await _mediaClient.leave();
    _snapshot = RtcCallSessionSnapshot(
      rtcSessionId: _snapshot.rtcSessionId,
      conversationId: _snapshot.conversationId,
      rtcMode: _snapshot.rtcMode,
      roomId: _snapshot.roomId,
      participantId: _snapshot.participantId,
      providerKey: mediaSession.providerKey,
      signalingStreamId: _snapshot.signalingStreamId,
      providerPluginId: _snapshot.providerPluginId,
      providerSessionId: _snapshot.providerSessionId,
      accessEndpoint: _snapshot.accessEndpoint,
      providerRegion: _snapshot.providerRegion,
      startedAt: _snapshot.startedAt,
      endedAt: _snapshot.endedAt,
      state: _snapshot.state,
      mediaConnectionState: mediaSession.connectionState,
    );
    return _snapshot;
  }

  Future<RtcCallSignal> sendSignal(
    String signalType,
    Object? payload, {
    RtcCallSignalSendOptions options = const RtcCallSignalSendOptions(),
  }) {
    return _signaling.sendSignal(
      _requireSessionId(),
      signalType,
      payload,
      options: RtcCallSignalSendOptions(
        signalingStreamId: options.signalingStreamId ?? _snapshot.signalingStreamId,
        schemaRef: options.schemaRef,
      ),
    );
  }

  Future<RtcCallSessionSnapshot> end() async {
    final rtcSessionId = _requireSessionId();
    await leaveMedia();

    final endedSession = await _signaling.endSession(rtcSessionId);
    _applySessionRecord(endedSession);
    _snapshot = RtcCallSessionSnapshot(
      rtcSessionId: _snapshot.rtcSessionId,
      conversationId: _snapshot.conversationId,
      rtcMode: _snapshot.rtcMode,
      roomId: _snapshot.roomId,
      participantId: _snapshot.participantId,
      providerKey: _snapshot.providerKey,
      signalingStreamId: _snapshot.signalingStreamId,
      providerPluginId: _snapshot.providerPluginId,
      providerSessionId: _snapshot.providerSessionId,
      accessEndpoint: _snapshot.accessEndpoint,
      providerRegion: _snapshot.providerRegion,
      startedAt: _snapshot.startedAt,
      endedAt: _snapshot.endedAt,
      state: RtcCallState.ended,
      mediaConnectionState: _snapshot.mediaConnectionState,
    );
    _disposeSignalSubscription();
    return _snapshot;
  }

  @override
  Future<void> close() async {
    try {
      if (_snapshot.mediaConnectionState == RtcSessionConnectionState.joined) {
        await _mediaClient.leave();
      }
    } finally {
      _disposeSignalSubscription();
      _signalHandlers.clear();
    }

    _resetSnapshot();
  }

  String _requireSessionId() {
    final rtcSessionId = _snapshot.rtcSessionId;
    if (rtcSessionId != null && rtcSessionId.isNotEmpty) {
      return rtcSessionId;
    }

    throw RtcSdkException(
      code: 'call_state_invalid',
      message: 'RTC call session is not initialized.',
      providerKey: _mediaClient.metadata.providerKey,
      pluginId: _mediaClient.metadata.pluginId,
    );
  }

  Future<void> _ensureSignalSubscription(String rtcSessionId) async {
    if (_signalSubscription != null) {
      return;
    }

    _signalSubscription = await _signaling.subscribeSessionSignals(
      rtcSessionId,
      (signal) {
        final handlers = _signalHandlers.toList(growable: false);
        for (final handler in handlers) {
          handler(signal);
        }
      },
    );
  }

  Future<RtcCallSessionSnapshot> _connectMedia({
    required String rtcSessionId,
    String? conversationId,
    required String rtcMode,
    required String roomId,
    required String participantId,
    required RtcCallAutoPublishOptions autoPublish,
  }) async {
    final credential = await _signaling.issueParticipantCredential(
      rtcSessionId,
      participantId: participantId,
    );

    final joinedSession = await _mediaClient.join(
      RtcJoinOptions(
        sessionId: rtcSessionId,
        roomId: roomId,
        participantId: participantId,
        token: credential.credential,
        metadata: <String, Object?>{
          'rtcMode': rtcMode,
          'conversationId': conversationId,
        },
      ),
    );

    _snapshot = RtcCallSessionSnapshot(
      rtcSessionId: rtcSessionId,
      conversationId: conversationId,
      rtcMode: rtcMode,
      roomId: roomId,
      participantId: participantId,
      providerKey: joinedSession.providerKey,
      signalingStreamId: _snapshot.signalingStreamId,
      providerPluginId: _snapshot.providerPluginId,
      providerSessionId: _snapshot.providerSessionId,
      accessEndpoint: _snapshot.accessEndpoint,
      providerRegion: _snapshot.providerRegion,
      startedAt: _snapshot.startedAt,
      endedAt: _snapshot.endedAt,
      state: RtcCallState.connected,
      mediaConnectionState: joinedSession.connectionState,
    );

    await _autoPublishTracks(rtcSessionId, autoPublish);
    return _snapshot;
  }

  Future<void> _autoPublishTracks(
    String rtcSessionId,
    RtcCallAutoPublishOptions autoPublish,
  ) async {
    if (autoPublish.audio) {
      await _mediaClient.publish(
        RtcPublishOptions(
          trackId: createRtcCallTrackId(rtcSessionId, RtcTrackKind.audio),
          kind: RtcTrackKind.audio,
          metadata: const <String, Object?>{
            'source': 'auto-publish',
          },
        ),
      );
    }

    if (autoPublish.video) {
      await _mediaClient.publish(
        RtcPublishOptions(
          trackId: createRtcCallTrackId(rtcSessionId, RtcTrackKind.video),
          kind: RtcTrackKind.video,
          metadata: const <String, Object?>{
            'source': 'auto-publish',
          },
        ),
      );
    }
  }

  void _applySessionRecord(RtcCallSessionRecord record) {
    _snapshot = RtcCallSessionSnapshot(
      rtcSessionId: record.rtcSessionId,
      conversationId: record.conversationId ?? _snapshot.conversationId,
      rtcMode: record.rtcMode ?? _snapshot.rtcMode,
      roomId: _snapshot.roomId,
      participantId: _snapshot.participantId,
      providerKey: _snapshot.providerKey,
      signalingStreamId: record.signalingStreamId ?? _snapshot.signalingStreamId,
      providerPluginId: record.providerPluginId ?? _snapshot.providerPluginId,
      providerSessionId: record.providerSessionId ?? _snapshot.providerSessionId,
      accessEndpoint: record.accessEndpoint ?? _snapshot.accessEndpoint,
      providerRegion: record.providerRegion ?? _snapshot.providerRegion,
      startedAt: record.startedAt ?? _snapshot.startedAt,
      endedAt: record.endedAt ?? _snapshot.endedAt,
      state: record.state,
      mediaConnectionState: _snapshot.mediaConnectionState,
    );
  }

  void _disposeSignalSubscription() {
    _signalSubscription?.unsubscribe();
    _signalSubscription = null;
  }

  void _resetSnapshot() {
    _snapshot = _idleRtcCallSessionSnapshot;
  }
}
