import 'rtc_provider_selection.dart';

enum RtcTrackKind {
  audio,
  video,
  screenShare,
  data,
}

String rtcTrackKindWireName(RtcTrackKind kind) {
  switch (kind) {
    case RtcTrackKind.audio:
      return 'audio';
    case RtcTrackKind.video:
      return 'video';
    case RtcTrackKind.screenShare:
      return 'screen-share';
    case RtcTrackKind.data:
      return 'data';
  }
}

enum RtcSessionConnectionState {
  joined,
  left,
}

class RtcProviderMetadata {
  const RtcProviderMetadata({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
    required this.displayName,
    required this.defaultSelected,
    this.requiredCapabilities = const <String>[],
    this.optionalCapabilities = const <String>[],
    this.extensionKeys = const <String>[],
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
  final String displayName;
  final bool defaultSelected;
  final List<String> requiredCapabilities;
  final List<String> optionalCapabilities;
  final List<String> extensionKeys;

  Map<String, Object?> toDebugMap() {
    return <String, Object?>{
      'providerKey': providerKey,
      'pluginId': pluginId,
      'driverId': driverId,
      'displayName': displayName,
      'defaultSelected': defaultSelected,
      'requiredCapabilities': requiredCapabilities,
      'optionalCapabilities': optionalCapabilities,
      'extensionKeys': extensionKeys,
    };
  }
}

class RtcJoinOptions {
  const RtcJoinOptions({
    required this.sessionId,
    required this.roomId,
    required this.participantId,
    this.token,
    this.metadata,
  });

  final String sessionId;
  final String roomId;
  final String participantId;
  final String? token;
  final Map<String, Object?>? metadata;
}

class RtcSessionDescriptor {
  const RtcSessionDescriptor({
    required this.sessionId,
    required this.roomId,
    required this.participantId,
    required this.providerKey,
    required this.connectionState,
  });

  final String sessionId;
  final String roomId;
  final String participantId;
  final String providerKey;
  final RtcSessionConnectionState connectionState;
}

class RtcPublishOptions {
  const RtcPublishOptions({
    required this.trackId,
    required this.kind,
    this.metadata,
  });

  final String trackId;
  final RtcTrackKind kind;
  final Map<String, Object?>? metadata;
}

class RtcTrackPublication {
  const RtcTrackPublication({
    required this.trackId,
    required this.kind,
    required this.muted,
  });

  final String trackId;
  final RtcTrackKind kind;
  final bool muted;
}

class RtcMuteState {
  const RtcMuteState({
    required this.kind,
    required this.muted,
  });

  final RtcTrackKind kind;
  final bool muted;
}

class RtcClientConfig {
  const RtcClientConfig({
    this.providerUrl,
    this.providerKey,
    this.tenantOverrideProviderKey,
    this.deploymentProfileProviderKey,
    this.defaultProviderKey,
    this.nativeConfig,
  });

  final String? providerUrl;
  final String? providerKey;
  final String? tenantOverrideProviderKey;
  final String? deploymentProfileProviderKey;
  final String? defaultProviderKey;
  final Object? nativeConfig;
}

class RtcResolvedClientConfig extends RtcClientConfig {
  const RtcResolvedClientConfig({
    super.providerUrl,
    required super.providerKey,
    super.tenantOverrideProviderKey,
    super.deploymentProfileProviderKey,
    super.defaultProviderKey,
    super.nativeConfig,
    required this.selectionSource,
  });

  final RtcProviderSelectionSource selectionSource;
}

class RtcRuntimeControllerContext<TNativeClient> {
  const RtcRuntimeControllerContext({
    required this.metadata,
    required this.selection,
    required this.nativeClient,
  });

  final RtcProviderMetadata metadata;
  final RtcProviderSelection selection;
  final TNativeClient nativeClient;
}
