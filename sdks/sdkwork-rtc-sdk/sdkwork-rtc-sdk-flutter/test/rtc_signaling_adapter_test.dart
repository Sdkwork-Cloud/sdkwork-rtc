import 'package:flutter_test/flutter_test.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

void main() {
  test(
    'RtcSignalingRealtimeDispatcher fails fast when websocket auth connect is rejected',
    () async {
      final sdk = _FakeRtcSignalingClient(
        connectImpl: ([
          RtcSignalingConnectOptions options =
              const RtcSignalingConnectOptions(),
        ]) async {
          throw StateError('websocket auth rejected');
        },
      );
      final dispatcher = RtcSignalingRealtimeDispatcher(
        CreateRtcSignalingAdapterOptions(
          sdk: sdk,
          deviceId: 'device-1',
          reconnectInterval: const Duration(milliseconds: 20),
          connectOptions: const RtcSignalingConnectOptions(
            webSocketAuth: RtcSignalingWebSocketAuthOptions.queryBearer(),
          ),
        ),
      );

      await expectLater(
        dispatcher.subscribeRtcSessionSignals(
          'rtc-session-1',
          (signal) async {},
        ),
        throwsA(
          isA<StateError>().having(
            (error) => error.message,
            'message',
            contains('auth rejected'),
          ),
        ),
      );

      await Future<void>.delayed(const Duration(milliseconds: 80));

      expect(sdk.connectCalls, 1);
      expect(sdk.lastConnectOptions?.deviceId, 'device-1');
      expect(
        sdk.lastConnectOptions?.subscriptions?.rtcSessions,
        <String>['rtc-session-1'],
      );
      expect(
        sdk.lastConnectOptions?.webSocketAuth?.mode,
        RtcSignalingWebSocketAuthMode.queryBearer,
      );
      expect(sdk.fakeRealtime.replaceSubscriptionsCalls, 0);
    },
  );
}

class _FakeRtcSignalingClient implements RtcSignalingClient {
  _FakeRtcSignalingClient({
    required this.connectImpl,
  }) : fakeRealtime = _FakeRealtimeModule();

  final _FakeRealtimeModule fakeRealtime;
  final Future<RtcSignalingLiveConnection> Function([
    RtcSignalingConnectOptions options,
  ]) connectImpl;
  int connectCalls = 0;
  RtcSignalingConnectOptions? lastConnectOptions;

  @override
  RtcSignalingRtcModule get rtc => throw UnimplementedError();

  @override
  RtcSignalingRealtimeModule get realtime => fakeRealtime;

  @override
  RtcSignalingConversationModule get conversations => throw UnimplementedError();

  @override
  Future<RtcSignalingLiveConnection> connect([
    RtcSignalingConnectOptions options = const RtcSignalingConnectOptions(),
  ]) {
    connectCalls += 1;
    lastConnectOptions = options;
    return connectImpl(options);
  }
}

class _FakeRealtimeModule implements RtcSignalingRealtimeModule {
  int replaceSubscriptionsCalls = 0;

  @override
  Future<Object?> replaceSubscriptions(
    RtcSignalingSyncRealtimeSubscriptionsRequest body,
  ) async {
    replaceSubscriptionsCalls += 1;
    return null;
  }
}
