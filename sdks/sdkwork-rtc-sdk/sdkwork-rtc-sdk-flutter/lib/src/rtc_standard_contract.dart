import 'rtc_provider_selection.dart';
import 'rtc_types.dart';

abstract interface class RtcProviderDriver<TNativeClient> {
  RtcProviderMetadata get metadata;
  Future<RtcClient<TNativeClient>> connect(RtcResolvedClientConfig config);
}

abstract interface class RtcClient<TNativeClient> {
  RtcProviderMetadata get metadata;
  RtcProviderSelection get selection;
  Future<RtcSessionDescriptor> join(RtcJoinOptions options);
  Future<RtcSessionDescriptor> leave();
  Future<RtcTrackPublication> publish(RtcPublishOptions options);
  Future<void> unpublish(String trackId);
  Future<RtcMuteState> muteAudio(bool muted);
  Future<RtcMuteState> muteVideo(bool muted);
  List<String> getProviderExtensions();
  bool supportsProviderExtension(String extensionKey);
  bool supportsCapability(String capability);
  void requireCapability(String capability);
  TNativeClient unwrap();
}

abstract interface class RtcRuntimeController<TNativeClient> {
  Future<RtcSessionDescriptor> join(
    RtcJoinOptions options,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcSessionDescriptor> leave(
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcTrackPublication> publish(
    RtcPublishOptions options,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<void> unpublish(
    String trackId,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcMuteState> muteAudio(
    bool muted,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
  Future<RtcMuteState> muteVideo(
    bool muted,
    RtcRuntimeControllerContext<TNativeClient> context,
  );
}

final class RtcStandardContract {
  static const String symbol = 'RtcStandardContract';
  static const List<String> jdbcStyleResolutionTypes = <String>[
    'RtcDriverManager',
    'RtcDataSource',
  ];
  static const List<String> runtimeSurfaceMethods = <String>[
    'join',
    'leave',
    'publish',
    'unpublish',
    'muteAudio',
    'muteVideo',
  ];
  static const String runtimeSurfaceFailureCode = 'native_sdk_not_available';

  const RtcStandardContract._();
}
