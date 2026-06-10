import 'dart:async';
import 'dart:convert';

import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:volc_engine_rtc/volc_engine_rtc.dart' as volc;

final RtcProviderMetadata VOLCENGINE_RTC_PROVIDER_METADATA =
    _requireVolcengineProviderMetadata();

final class RtcVolcengineFlutterNativeConfig {
  const RtcVolcengineFlutterNativeConfig({
    this.appId,
    this.engineParameters,
    this.userExtraInfo,
    this.userVisibility = true,
    this.isPublishAudio = false,
    this.isPublishVideo = false,
    this.isAutoSubscribeAudio = true,
    this.isAutoSubscribeVideo = true,
    this.destroyEngineOnLeave = true,
  });

  final String? appId;
  final Map<String, Object?>? engineParameters;
  final Map<String, Object?>? userExtraInfo;
  final bool userVisibility;
  final bool isPublishAudio;
  final bool isPublishVideo;
  final bool isAutoSubscribeAudio;
  final bool isAutoSubscribeVideo;
  final bool destroyEngineOnLeave;

  static RtcVolcengineFlutterNativeConfig from(Object? value) {
    if (value is RtcVolcengineFlutterNativeConfig) {
      return value;
    }

    if (value == null) {
      return const RtcVolcengineFlutterNativeConfig();
    }

    if (value is! Map) {
      throw _invalidNativeConfig(
        'RTC nativeConfig must be an object for the official Volcengine Flutter bridge.',
        details: <String, Object?>{
          'receivedType': value.runtimeType.toString(),
        },
      );
    }

    return RtcVolcengineFlutterNativeConfig(
      appId: _readString(value, 'appId'),
      engineParameters: _readStringObjectMap(value['engineParameters'], 'engineParameters') ??
          _readStringObjectMap(value['parameters'], 'parameters'),
      userExtraInfo: _readStringObjectMap(value['userExtraInfo'], 'userExtraInfo'),
      userVisibility: _readBool(value, 'userVisibility', true),
      isPublishAudio: _readBool(value, 'isPublishAudio', false),
      isPublishVideo: _readBool(value, 'isPublishVideo', false),
      isAutoSubscribeAudio: _readBool(value, 'isAutoSubscribeAudio', true),
      isAutoSubscribeVideo: _readBool(value, 'isAutoSubscribeVideo', true),
      destroyEngineOnLeave: _readBool(value, 'destroyEngineOnLeave', true),
    );
  }
}

typedef RtcVolcengineFlutterEngineFactory = FutureOr<dynamic> Function(
  RtcVolcengineFlutterNativeConfig nativeConfig,
);

final class CreateOfficialVolcengineFlutterRtcDriverOptions {
  const CreateOfficialVolcengineFlutterRtcDriverOptions({
    this.engineFactory,
  });

  final RtcVolcengineFlutterEngineFactory? engineFactory;
}

final class RtcVolcengineOfficialFlutterNativeClient {
  RtcVolcengineOfficialFlutterNativeClient({
    required this.resolvedConfig,
    required this.nativeConfig,
    required this.engineFactory,
  });

  final RtcResolvedClientConfig resolvedConfig;
  final RtcVolcengineFlutterNativeConfig nativeConfig;
  final RtcVolcengineFlutterEngineFactory engineFactory;
  final Map<String, RtcTrackKind> publishedTracks = <String, RtcTrackKind>{};

  dynamic engine;
  dynamic room;
  RtcSessionDescriptor? joinedSession;
}

final class VolcengineRtcRuntimeController
    implements
        RtcRuntimeController<RtcVolcengineOfficialFlutterNativeClient>,
        RtcScreenShareRuntimeController<RtcVolcengineOfficialFlutterNativeClient> {
  const VolcengineRtcRuntimeController();

  @override
  Future<RtcSessionDescriptor> join(
    RtcJoinOptions options,
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final runtime = await _ensureVolcengineRuntime(context, options.roomId);
    final userInfo = _buildUserInfo(options, runtime.nativeConfig);
    final roomConfig = volc.RoomConfig(
      isPublishAudio: runtime.nativeConfig.isPublishAudio,
      isPublishVideo: runtime.nativeConfig.isPublishVideo,
      isAutoSubscribeAudio: runtime.nativeConfig.isAutoSubscribeAudio,
      isAutoSubscribeVideo: runtime.nativeConfig.isAutoSubscribeVideo,
    );

    await Future<Object?>.value(
      runtime.room.joinRoom(
        token: options.token ?? '',
        userInfo: userInfo,
        roomConfig: roomConfig,
        userVisibility: runtime.nativeConfig.userVisibility,
      ),
    );

    final sessionDescriptor = RtcSessionDescriptor(
      sessionId: options.sessionId,
      roomId: options.roomId,
      participantId: options.participantId,
      providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
      connectionState: RtcSessionConnectionState.joined,
    );
    context.nativeClient.joinedSession = sessionDescriptor;

    return sessionDescriptor;
  }

  @override
  Future<RtcSessionDescriptor> leave(
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final nativeClient = context.nativeClient;
    final joinedSession = nativeClient.joinedSession;

    if (nativeClient.room != null) {
      await Future<Object?>.value(nativeClient.room.leaveRoom());
      nativeClient.room = null;
    }

    if (nativeClient.engine != null && nativeClient.nativeConfig.destroyEngineOnLeave) {
      nativeClient.engine.destroy();
      nativeClient.engine = null;
    }

    nativeClient.joinedSession = null;
    nativeClient.publishedTracks.clear();

    return RtcSessionDescriptor(
      sessionId: joinedSession?.sessionId ?? '',
      roomId: joinedSession?.roomId ?? '',
      participantId: joinedSession?.participantId ?? '',
      providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
      connectionState: RtcSessionConnectionState.left,
    );
  }

  @override
  Future<RtcTrackPublication> publish(
    RtcPublishOptions options,
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final mediaKind = _resolvePublishedMediaKind(options);
    final roomId = _requireJoinedRoomId(context.nativeClient);
    final runtime = await _ensureVolcengineRuntime(context, roomId);
    await _publishMediaKind(runtime, mediaKind, publish: true);
    context.nativeClient.publishedTracks[options.trackId] = mediaKind;

    return RtcTrackPublication(
      trackId: options.trackId,
      kind: options.kind,
      muted: false,
    );
  }

  @override
  Future<void> unpublish(
    String trackId,
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final mediaKind = context.nativeClient.publishedTracks[trackId];
    if (mediaKind == null) {
      return;
    }

    final roomId = _requireJoinedRoomId(context.nativeClient);
    final runtime = await _ensureVolcengineRuntime(context, roomId);
    await _publishMediaKind(runtime, mediaKind, publish: false);
    context.nativeClient.publishedTracks.remove(trackId);
  }

  @override
  Future<RtcTrackPublication> startScreenShare(
    RtcScreenShareOptions options,
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final roomId = _requireJoinedRoomId(context.nativeClient);
    final runtime = await _ensureVolcengineRuntime(context, roomId);
    await _publishMediaKind(runtime, RtcTrackKind.screenShare, publish: true);
    context.nativeClient.publishedTracks[options.trackId] = RtcTrackKind.screenShare;

    return RtcTrackPublication(
      trackId: options.trackId,
      kind: RtcTrackKind.screenShare,
      muted: false,
    );
  }

  @override
  Future<void> stopScreenShare(
    String trackId,
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final mediaKind = context.nativeClient.publishedTracks[trackId];
    if (mediaKind != RtcTrackKind.screenShare) {
      return;
    }

    final roomId = _requireJoinedRoomId(context.nativeClient);
    final runtime = await _ensureVolcengineRuntime(context, roomId);
    await _publishMediaKind(runtime, RtcTrackKind.screenShare, publish: false);
    context.nativeClient.publishedTracks.remove(trackId);
  }

  @override
  Future<RtcMuteState> muteAudio(
    bool muted,
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final roomId = _requireJoinedRoomId(context.nativeClient);
    final runtime = await _ensureVolcengineRuntime(context, roomId);
    await _publishMediaKind(runtime, RtcTrackKind.audio, publish: !muted);

    return RtcMuteState(kind: RtcTrackKind.audio, muted: muted);
  }

  @override
  Future<RtcMuteState> muteVideo(
    bool muted,
    RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  ) async {
    final roomId = _requireJoinedRoomId(context.nativeClient);
    final runtime = await _ensureVolcengineRuntime(context, roomId);
    await _publishMediaKind(runtime, RtcTrackKind.video, publish: !muted);

    if (muted) {
      await Future<Object?>.value(runtime.engine.stopVideoCapture());
    }

    return RtcMuteState(kind: RtcTrackKind.video, muted: muted);
  }
}

final class RtcProviderVolcenginePackageContract {
  static const String providerKey = "volcengine";
  static const String pluginId = "rtc-volcengine";
  static const String driverId = "sdkwork-rtc-driver-volcengine";
  static const String packageIdentity = "rtc_sdk_provider_volcengine";
  static const String status = "package_reference_boundary";
  static const String runtimeBridgeStatus = "reference-baseline";
  static const bool rootPublic = false;
  static final RtcProviderModule<RtcVolcengineOfficialFlutterNativeClient>
      providerModule = VOLCENGINE_RTC_PROVIDER_MODULE;

  const RtcProviderVolcenginePackageContract._();
}

RtcProviderDriver<RtcVolcengineOfficialFlutterNativeClient>
    createOfficialVolcengineFlutterRtcDriver([
  CreateOfficialVolcengineFlutterRtcDriverOptions? options,
]) {
  final engineFactory = options?.engineFactory ?? _createDefaultVolcengineEngine;

  return createRtcProviderDriver<RtcVolcengineOfficialFlutterNativeClient>(
    metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
    nativeFactory: (config) async {
      return RtcVolcengineOfficialFlutterNativeClient(
        resolvedConfig: config,
        nativeConfig: RtcVolcengineFlutterNativeConfig.from(config.nativeConfig),
        engineFactory: engineFactory,
      );
    },
    runtimeController: const VolcengineRtcRuntimeController(),
  );
}

RtcProviderDriver<TNativeClient> createVolcengineRtcDriver<TNativeClient>([
  RtcProviderModuleDriverOptions<TNativeClient>? options,
]) {
  if (options == null) {
    return createOfficialVolcengineFlutterRtcDriver()
        as RtcProviderDriver<TNativeClient>;
  }

  return createRtcProviderDriver<TNativeClient>(
    metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  );
}

final RtcProviderModule<RtcVolcengineOfficialFlutterNativeClient>
    VOLCENGINE_RTC_PROVIDER_MODULE =
        RtcProviderModule<RtcVolcengineOfficialFlutterNativeClient>(
  packageName: "rtc_sdk_provider_volcengine",
  metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
  builtin: getRtcProviderPackageByProviderKey("volcengine")?.builtin ?? false,
  createDriver: createVolcengineRtcDriver<RtcVolcengineOfficialFlutterNativeClient>,
);

RtcProviderMetadata _requireVolcengineProviderMetadata() {
  final metadata = getOfficialRtcProviderMetadataByKey("volcengine");
  if (metadata == null) {
    throw const RtcSdkException(
      code: 'provider_not_official',
      message: 'Volcengine RTC provider metadata is missing from the root RTC provider catalog.',
      providerKey: "volcengine",
      pluginId: "rtc-volcengine",
    );
  }

  return metadata;
}

Future<dynamic> _createDefaultVolcengineEngine(
  RtcVolcengineFlutterNativeConfig nativeConfig,
) async {
  _assertRequiredVolcengineConfig(nativeConfig);

  return volc.RTCEngine.createRTCEngine(
    volc.RTCVideoContext(
      appId: nativeConfig.appId!,
      parameters: nativeConfig.engineParameters == null
          ? null
          : Map<String, dynamic>.from(nativeConfig.engineParameters!),
    ),
  );
}

void _assertRequiredVolcengineConfig(
  RtcVolcengineFlutterNativeConfig nativeConfig,
) {
  if ((nativeConfig.appId ?? '').trim().isNotEmpty) {
    return;
  }

  throw RtcSdkException(
    code: 'invalid_native_config',
    message: 'Official Volcengine Flutter RTC runtime requires nativeConfig.appId.',
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: <String, Object?>{
      'missingConfigKeys': <String>['appId'],
    },
  );
}

volc.UserInfo _buildUserInfo(
  RtcJoinOptions options,
  RtcVolcengineFlutterNativeConfig nativeConfig,
) {
  final extraInfo = <String, Object?>{
    ...?nativeConfig.userExtraInfo,
    ...?options.metadata,
  };

  return volc.UserInfo(
    userId: options.participantId,
    extraInfo: extraInfo.isEmpty ? '' : jsonEncode(extraInfo),
  );
}

Future<_ResolvedVolcengineRuntime> _ensureVolcengineRuntime(
  RtcRuntimeControllerContext<RtcVolcengineOfficialFlutterNativeClient> context,
  String roomId,
) async {
  final nativeClient = context.nativeClient;
  final nativeConfig = nativeClient.nativeConfig;
  _assertRequiredVolcengineConfig(nativeConfig);

  if (nativeClient.engine == null) {
    nativeClient.engine = await Future<dynamic>.value(
      nativeClient.engineFactory(nativeConfig),
    );
  }

  if (nativeClient.room != null && nativeClient.joinedSession?.roomId != roomId) {
    await Future<Object?>.value(nativeClient.room.leaveRoom());
    nativeClient.room = null;
    nativeClient.publishedTracks.clear();
  }

  if (nativeClient.room == null) {
    nativeClient.room = await Future<dynamic>.value(
      nativeClient.engine.createRTCRoom(roomId),
    );
  }

  if (nativeClient.room == null) {
    throw RtcSdkException(
      code: RtcStandardContract.runtimeSurfaceFailureCode,
      message: 'Official Volcengine Flutter RTC SDK could not create a room.',
      providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
      pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
      details: <String, Object?>{
        'roomId': roomId,
      },
    );
  }

  return _ResolvedVolcengineRuntime(
    nativeConfig: nativeConfig,
    engine: nativeClient.engine,
    room: nativeClient.room,
  );
}

String _requireJoinedRoomId(
  RtcVolcengineOfficialFlutterNativeClient nativeClient,
) {
  final roomId = nativeClient.joinedSession?.roomId;
  if (roomId != null && roomId.isNotEmpty) {
    return roomId;
  }

  throw RtcSdkException(
    code: 'room_not_joined',
    message: 'RTC runtime media operation requires a joined room.',
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
  );
}

RtcTrackKind _resolvePublishedMediaKind(RtcPublishOptions options) {
  if (options.kind == RtcTrackKind.audio ||
      options.kind == RtcTrackKind.video ||
      options.kind == RtcTrackKind.screenShare) {
    return options.kind;
  }

  throw RtcSdkException(
    code: 'capability_not_supported',
    message: 'Official Volcengine Flutter bridge only supports audio and video through the standard publish surface.',
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: <String, Object?>{
      'kind': rtcTrackKindWireName(options.kind),
    },
  );
}

Future<void> _publishMediaKind(
  _ResolvedVolcengineRuntime runtime,
  RtcTrackKind kind, {
  required bool publish,
}) async {
  if (kind == RtcTrackKind.audio) {
    if (publish) {
      await Future<Object?>.value(runtime.engine.startAudioCapture());
    }

    await Future<Object?>.value(runtime.room.publishStreamAudio(publish));
    return;
  }

  if (kind == RtcTrackKind.screenShare) {
    await Future<Object?>.value(runtime.room.publishScreen(publish));
    return;
  }

  if (publish) {
    await Future<Object?>.value(runtime.engine.startVideoCapture());
  }

  await Future<Object?>.value(runtime.room.publishStreamVideo(publish));
}

String? _readString(Map<dynamic, dynamic> map, String key) {
  final value = map[key];
  if (value == null) {
    return null;
  }

  if (value is String) {
    return value;
  }

  throw _invalidNativeConfig(
    'RTC nativeConfig.' + key + ' must be a string.',
    details: <String, Object?>{
      'key': key,
      'receivedType': value.runtimeType.toString(),
    },
  );
}

bool _readBool(Map<dynamic, dynamic> map, String key, bool defaultValue) {
  final value = map[key];
  if (value == null) {
    return defaultValue;
  }

  if (value is bool) {
    return value;
  }

  throw _invalidNativeConfig(
    'RTC nativeConfig.' + key + ' must be a boolean.',
    details: <String, Object?>{
      'key': key,
      'receivedType': value.runtimeType.toString(),
    },
  );
}

Map<String, Object?>? _readStringObjectMap(Object? value, String key) {
  if (value == null) {
    return null;
  }

  if (value is! Map) {
    throw _invalidNativeConfig(
      'RTC nativeConfig.' + key + ' must be an object.',
      details: <String, Object?>{
        'key': key,
        'receivedType': value.runtimeType.toString(),
      },
    );
  }

  final result = <String, Object?>{};
  for (final entry in value.entries) {
    if (entry.key is! String) {
      throw _invalidNativeConfig(
        'RTC nativeConfig.' + key + ' must contain string keys only.',
        details: <String, Object?>{
          'key': key,
          'receivedKeyType': entry.key.runtimeType.toString(),
        },
      );
    }

    result[entry.key as String] = entry.value;
  }

  return result;
}

RtcSdkException _invalidNativeConfig(
  String message, {
  Map<String, Object?>? details,
}) {
  return RtcSdkException(
    code: 'invalid_native_config',
    message: message,
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: details,
  );
}

final class _ResolvedVolcengineRuntime {
  const _ResolvedVolcengineRuntime({
    required this.nativeConfig,
    required this.engine,
    required this.room,
  });

  final RtcVolcengineFlutterNativeConfig nativeConfig;
  final dynamic engine;
  final dynamic room;
}
