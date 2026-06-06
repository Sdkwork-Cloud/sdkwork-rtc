import 'dart:async';

import 'rtc_call_types.dart';
import 'rtc_signaling_adapter.dart';

class RtcCallControllerSessionSubscriptionManager {
  RtcCallControllerSessionSubscriptionManager({
    required RtcCallSignalingAdapter signaling,
    required FutureOr<void> Function(RtcCallSignal signal) onSignal,
  })  : _signaling = signaling,
        _onSignal = onSignal;

  final RtcCallSignalingAdapter _signaling;
  final FutureOr<void> Function(RtcCallSignal signal) _onSignal;

  String? _activeSessionId;
  RtcCallSignalSubscription? _activeSessionSubscription;

  String? get activeSessionId => _activeSessionId;

  Future<void> subscribe(String rtcSessionId) async {
    if (_activeSessionId == rtcSessionId && _activeSessionSubscription != null) {
      return;
    }

    final nextSubscription = await _signaling.subscribeSessionSignals(
      rtcSessionId,
      (signal) {
        unawaited(Future<void>.sync(() => _onSignal(signal)));
      },
    );

    final previousSubscription = _activeSessionSubscription;
    _activeSessionId = rtcSessionId;
    _activeSessionSubscription = nextSubscription;
    previousSubscription?.unsubscribe();
  }

  void clear() {
    _activeSessionSubscription?.unsubscribe();
    _activeSessionSubscription = null;
    _activeSessionId = null;
  }
}

class RtcCallControllerConversationSubscriptionManager {
  RtcCallControllerConversationSubscriptionManager({
    required RtcSignalingRealtimeDispatcher realtimeDispatcher,
    required FutureOr<void> Function(RtcConversationSignalMessage signal)
        onSignal,
  })  : _realtimeDispatcher = realtimeDispatcher,
        _onSignal = onSignal;

  final RtcSignalingRealtimeDispatcher _realtimeDispatcher;
  final FutureOr<void> Function(RtcConversationSignalMessage signal)
      _onSignal;
  final Map<String, RtcCallSignalSubscription> _conversationSubscriptions =
      <String, RtcCallSignalSubscription>{};

  Future<void> replaceWatchedConversations(
    Iterable<String> conversationIds,
  ) async {
    final nextIds = conversationIds.toSet();
    final currentIds = _conversationSubscriptions.keys.toSet();
    final removedIds = currentIds.difference(nextIds);
    final addedIds = nextIds.difference(currentIds);
    final addedSubscriptions = <String, RtcCallSignalSubscription>{};

    try {
      for (final conversationId in addedIds) {
        addedSubscriptions[conversationId] =
            await _realtimeDispatcher.subscribeConversationSignals(
          conversationId,
          (signal) {
            unawaited(Future<void>.sync(() => _onSignal(signal)));
          },
        );
      }
    } catch (_) {
      for (final subscription in addedSubscriptions.values) {
        subscription.unsubscribe();
      }
      rethrow;
    }

    for (final conversationId in removedIds) {
      _conversationSubscriptions.remove(conversationId)?.unsubscribe();
    }

    _conversationSubscriptions.addAll(addedSubscriptions);
  }

  void clear() {
    for (final subscription in _conversationSubscriptions.values) {
      subscription.unsubscribe();
    }

    _conversationSubscriptions.clear();
  }
}
