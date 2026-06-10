import 'rtc_errors.dart';
import 'rtc_provider_selection.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';

final class StandardRtcClient<TNativeClient> implements RtcClient<TNativeClient> {
  StandardRtcClient({
    required this.metadata,
    required this.selection,
    required TNativeClient nativeClient,
    RtcRuntimeController<TNativeClient>? runtimeController,
  })  : _nativeClient = nativeClient,
        _runtimeController = runtimeController;

  @override
  final RtcProviderMetadata metadata;

  @override
  final RtcProviderSelection selection;

  final TNativeClient _nativeClient;
  final RtcRuntimeController<TNativeClient>? _runtimeController;

  RtcRuntimeControllerContext<TNativeClient> get _runtimeContext {
    return RtcRuntimeControllerContext<TNativeClient>(
      metadata: metadata,
      selection: selection,
      nativeClient: _nativeClient,
    );
  }

  RtcRuntimeController<TNativeClient> _requireRuntimeController(
    String methodName,
  ) {
    if (_runtimeController != null) {
      return _runtimeController;
    }

    throw RtcSdkException(
      code: RtcStandardContract.runtimeSurfaceFailureCode,
      message: 'RTC runtime bridge method not available: $methodName',
      providerKey: metadata.providerKey,
      pluginId: metadata.pluginId,
      details: <String, Object?>{
        'methodName': methodName,
      },
    );
  }

  RtcScreenShareRuntimeController<TNativeClient>?
      _resolveScreenShareRuntimeController() {
    final runtimeController = _runtimeController;
    if (runtimeController is RtcScreenShareRuntimeController<TNativeClient>) {
      return runtimeController as RtcScreenShareRuntimeController<TNativeClient>;
    }

    return null;
  }

  @override
  Future<RtcSessionDescriptor> join(RtcJoinOptions options) {
    return _requireRuntimeController('join').join(options, _runtimeContext);
  }

  @override
  Future<RtcSessionDescriptor> leave() {
    return _requireRuntimeController('leave').leave(_runtimeContext);
  }

  @override
  Future<RtcTrackPublication> publish(RtcPublishOptions options) {
    return _requireRuntimeController('publish').publish(options, _runtimeContext);
  }

  @override
  Future<void> unpublish(String trackId) {
    return _requireRuntimeController('unpublish').unpublish(
      trackId,
      _runtimeContext,
    );
  }

  @override
  Future<RtcTrackPublication> startScreenShare(
    RtcScreenShareOptions options,
  ) {
    requireCapability('screen-share');
    final runtimeController = _requireRuntimeController('startScreenShare');
    final screenShareRuntimeController = _resolveScreenShareRuntimeController();
    if (screenShareRuntimeController != null) {
      return screenShareRuntimeController.startScreenShare(options, _runtimeContext);
    }

    return runtimeController.publish(
      RtcPublishOptions(
        trackId: options.trackId,
        kind: RtcTrackKind.screenShare,
        metadata: options.metadata,
      ),
      _runtimeContext,
    );
  }

  @override
  Future<void> stopScreenShare(String trackId) {
    requireCapability('screen-share');
    final runtimeController = _requireRuntimeController('stopScreenShare');
    final screenShareRuntimeController = _resolveScreenShareRuntimeController();
    if (screenShareRuntimeController != null) {
      return screenShareRuntimeController.stopScreenShare(trackId, _runtimeContext);
    }

    return runtimeController.unpublish(trackId, _runtimeContext);
  }

  @override
  Future<RtcMuteState> muteAudio(bool muted) {
    return _requireRuntimeController('muteAudio').muteAudio(
      muted,
      _runtimeContext,
    );
  }

  @override
  Future<RtcMuteState> muteVideo(bool muted) {
    return _requireRuntimeController('muteVideo').muteVideo(
      muted,
      _runtimeContext,
    );
  }

  @override
  List<String> getProviderExtensions() {
    return List<String>.unmodifiable(metadata.extensionKeys);
  }

  @override
  bool supportsProviderExtension(String extensionKey) {
    return metadata.extensionKeys.contains(extensionKey);
  }

  @override
  bool supportsCapability(String capability) {
    return metadata.requiredCapabilities.contains(capability) ||
        metadata.optionalCapabilities.contains(capability);
  }

  @override
  void requireCapability(String capability) {
    if (supportsCapability(capability)) {
      return;
    }

    throw RtcSdkException(
      code: 'capability_not_supported',
      message: 'RTC capability not supported: $capability',
      providerKey: metadata.providerKey,
      pluginId: metadata.pluginId,
      details: <String, Object?>{
        'capability': capability,
      },
    );
  }

  @override
  TNativeClient unwrap() => _nativeClient;
}
