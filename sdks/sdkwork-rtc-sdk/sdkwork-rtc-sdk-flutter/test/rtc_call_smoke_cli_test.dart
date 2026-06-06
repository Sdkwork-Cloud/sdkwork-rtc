import 'package:flutter_test/flutter_test.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

import '../bin/sdk-call-smoke.dart' as smoke_cli;

void main() {
  test('Flutter call smoke helper emits the RTC signaling transport descriptor', () {
    final signalingTransport = smoke_cli.buildRtcCallSmokeSignalingTransportSummary(
      deviceId: 'device-smoke',
    );

    expect(signalingTransport, <String, Object?>{
      'deviceId': 'device-smoke',
      'connectOptionsDeviceId': 'device-smoke',
      'authMode': 'automatic',
      'usesSharedLiveConnection': false,
      'transportTerm': 'websocket-only',
      'authConfigPath': 'connectOptions.webSocketAuth',
      'authPassThroughTerm': 'signaling-adapter-pass-through',
      'recommendedAuthMode': 'automatic',
      'deviceIdAuthorityTerm': 'top-level-device-id',
      'connectOptionsDeviceIdRuleTerm': 'must-match-top-level-device-id',
      'liveConnectionTerm': 'shared-rtc-live-connection',
      'pollingFallbackTerm': 'not-supported',
      'authFailureTerm': 'fail-fast',
    });
  });

  test('Flutter call smoke helper reports shared RTC WebSocket reuse in the signaling descriptor',
      () {
    final signalingTransport = smoke_cli.buildRtcCallSmokeSignalingTransportSummary(
      deviceId: 'device-smoke',
      liveConnection: _FakeRtcSignalingLiveConnection(),
    );

    expect(signalingTransport['usesSharedLiveConnection'], true);
    expect(signalingTransport['deviceId'], 'device-smoke');
    expect(signalingTransport['connectOptionsDeviceId'], 'device-smoke');
    expect(signalingTransport['authMode'], 'automatic');
  });
}

class _FakeRtcSignalingLiveConnection implements RtcSignalingLiveConnection {
  @override
  RtcSignalingLiveEventStream get events => throw UnimplementedError();

  @override
  RtcSignalingLiveLifecycleStream get lifecycle => throw UnimplementedError();

  @override
  Future<void> disconnect([int? code, String? reason]) async {}
}
