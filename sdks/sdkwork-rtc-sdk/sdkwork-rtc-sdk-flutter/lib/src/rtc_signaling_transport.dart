import 'rtc_signaling_adapter.dart';

const String rtcSignalingTransportTerm = 'websocket-only';
const String rtcSignalingTransportAuthConfigPath =
    'connectOptions.webSocketAuth';
const String rtcSignalingTransportAuthPassThroughTerm =
    'signaling-adapter-pass-through';
const List<String> rtcSignalingTransportAuthModeTerms = <String>[
  'automatic',
  'headerBearer',
  'queryBearer',
  'none',
];
const String rtcSignalingTransportRecommendedAuthMode = 'automatic';
const String rtcSignalingTransportDeviceIdAuthorityTerm =
    'top-level-device-id';
const String rtcSignalingTransportConnectOptionsDeviceIdRuleTerm =
    'must-match-top-level-device-id';
const String rtcSignalingTransportLiveConnectionTerm =
    'shared-rtc-live-connection';
const String rtcSignalingTransportPollingFallbackTerm = 'not-supported';
const String rtcSignalingTransportAuthFailureTerm = 'fail-fast';

const Map<String, Object> rtcSignalingTransportStandard = <String, Object>{
  'transportTerm': rtcSignalingTransportTerm,
  'authConfigPath': rtcSignalingTransportAuthConfigPath,
  'authPassThroughTerm': rtcSignalingTransportAuthPassThroughTerm,
  'authModeTerms': rtcSignalingTransportAuthModeTerms,
  'recommendedAuthMode': rtcSignalingTransportRecommendedAuthMode,
  'deviceIdAuthorityTerm': rtcSignalingTransportDeviceIdAuthorityTerm,
  'connectOptionsDeviceIdRuleTerm':
      rtcSignalingTransportConnectOptionsDeviceIdRuleTerm,
  'liveConnectionTerm': rtcSignalingTransportLiveConnectionTerm,
  'pollingFallbackTerm': rtcSignalingTransportPollingFallbackTerm,
  'authFailureTerm': rtcSignalingTransportAuthFailureTerm,
};

class RtcSignalingTransportDescriptor {
  const RtcSignalingTransportDescriptor({
    required this.deviceId,
    required this.connectOptionsDeviceId,
    required this.authMode,
    required this.usesSharedLiveConnection,
    required this.transportTerm,
    required this.authConfigPath,
    required this.authPassThroughTerm,
    required this.recommendedAuthMode,
    required this.deviceIdAuthorityTerm,
    required this.connectOptionsDeviceIdRuleTerm,
    required this.liveConnectionTerm,
    required this.pollingFallbackTerm,
    required this.authFailureTerm,
  });

  final String deviceId;
  final String? connectOptionsDeviceId;
  final String authMode;
  final bool usesSharedLiveConnection;
  final String transportTerm;
  final String authConfigPath;
  final String authPassThroughTerm;
  final String recommendedAuthMode;
  final String deviceIdAuthorityTerm;
  final String connectOptionsDeviceIdRuleTerm;
  final String liveConnectionTerm;
  final String pollingFallbackTerm;
  final String authFailureTerm;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'deviceId': deviceId,
      'connectOptionsDeviceId': connectOptionsDeviceId,
      'authMode': authMode,
      'usesSharedLiveConnection': usesSharedLiveConnection,
      'transportTerm': transportTerm,
      'authConfigPath': authConfigPath,
      'authPassThroughTerm': authPassThroughTerm,
      'recommendedAuthMode': recommendedAuthMode,
      'deviceIdAuthorityTerm': deviceIdAuthorityTerm,
      'connectOptionsDeviceIdRuleTerm': connectOptionsDeviceIdRuleTerm,
      'liveConnectionTerm': liveConnectionTerm,
      'pollingFallbackTerm': pollingFallbackTerm,
      'authFailureTerm': authFailureTerm,
    };
  }
}

String _normalizeRtcSignalingTransportDeviceId(String deviceId) {
  final normalized = deviceId.trim();
  if (normalized.isEmpty) {
    throw ArgumentError.value(
      deviceId,
      'deviceId',
      'RTC signaling deviceId must not be empty.',
    );
  }
  return normalized;
}

String _resolveRtcSignalingTransportAuthMode(
  RtcSignalingConnectOptions? connectOptions,
) {
  final authMode = connectOptions?.webSocketAuth?.mode.name;
  if (authMode == null) {
    return rtcSignalingTransportRecommendedAuthMode;
  }

  if (!rtcSignalingTransportAuthModeTerms.contains(authMode)) {
    throw ArgumentError.value(
      authMode,
      'connectOptions.webSocketAuth.mode',
      'Unsupported RTC signaling auth mode.',
    );
  }

  return authMode;
}

RtcSignalingTransportDescriptor describeRtcSignalingTransport({
  required String deviceId,
  RtcSignalingConnectOptions? connectOptions,
  RtcSignalingLiveConnection? liveConnection,
}) {
  final normalizedDeviceId = _normalizeRtcSignalingTransportDeviceId(deviceId);
  final connectOptionsDeviceId = connectOptions?.deviceId == null
      ? null
      : _normalizeRtcSignalingTransportDeviceId(connectOptions!.deviceId!);

  if (connectOptionsDeviceId != null &&
      connectOptionsDeviceId != normalizedDeviceId) {
    throw ArgumentError.value(
      connectOptionsDeviceId,
      'connectOptions.deviceId',
      'RTC signaling deviceId must match connectOptions.deviceId when both are provided.',
    );
  }

  return RtcSignalingTransportDescriptor(
    deviceId: normalizedDeviceId,
    connectOptionsDeviceId: connectOptionsDeviceId,
    authMode: _resolveRtcSignalingTransportAuthMode(connectOptions),
    usesSharedLiveConnection: liveConnection != null,
    transportTerm: rtcSignalingTransportTerm,
    authConfigPath: rtcSignalingTransportAuthConfigPath,
    authPassThroughTerm: rtcSignalingTransportAuthPassThroughTerm,
    recommendedAuthMode: rtcSignalingTransportRecommendedAuthMode,
    deviceIdAuthorityTerm: rtcSignalingTransportDeviceIdAuthorityTerm,
    connectOptionsDeviceIdRuleTerm:
        rtcSignalingTransportConnectOptionsDeviceIdRuleTerm,
    liveConnectionTerm: rtcSignalingTransportLiveConnectionTerm,
    pollingFallbackTerm: rtcSignalingTransportPollingFallbackTerm,
    authFailureTerm: rtcSignalingTransportAuthFailureTerm,
  );
}
