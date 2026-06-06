import 'dart:convert';

import 'package:volc_engine_rtc/volc_engine_rtc.dart';

import 'rtc_driver.dart';
import 'rtc_errors.dart';
import 'rtc_provider_metadata.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';

class RtcVolcengineFlutterRoomConfig {
  const RtcVolcengineFlutterRoomConfig({
    this.profile = RoomProfile.communication,
    this.streamId,
    this.publishAudioOnJoin = false,
    this.publishVideoOnJoin = false,
    this.autoSubscribeAudio = true,
    this.autoSubscribeVideo = true,
  });

  final RoomProfile profile;
  final String? streamId;
  final bool publishAudioOnJoin;
  final bool publishVideoOnJoin;
  final bool autoSubscribeAudio;
  final bool autoSubscribeVideo;
}

class RtcVolcengineFlutterNativeConfig {
  const RtcVolcengineFlutterNativeConfig({
    required this.appId,
    this.engineParameters,
    this.userExtraInfo,
    this.userVisibility = true,
    this.isGameScene = false,
    this.autoCreateVideoEffectInterface = false,
    this.autoCreateAudioEffectPlayer = false,
    this.autoCreateWtnStream = false,
    this.room = const RtcVolcengineFlutterRoomConfig(),
  });

  final String appId;
  final Map<String, dynamic>? engineParameters;
  final Map<String, Object?>? userExtraInfo;
  final bool userVisibility;
  final bool isGameScene;
  final bool autoCreateVideoEffectInterface;
  final bool autoCreateAudioEffectPlayer;
  final bool autoCreateWtnStream;
  final RtcVolcengineFlutterRoomConfig room;
}

typedef RtcVolcengineFlutterEngineFactory = Future<RTCEngine> Function(
  RtcVolcengineFlutterNativeConfig config,
);

class RtcVolcengineFlutterNativeClient {
  RtcVolcengineFlutterNativeClient({
    required this.resolvedConfig,
    required this.config,
    required this.engineFactory,
  });

  final RtcResolvedClientConfig resolvedConfig;
  final RtcVolcengineFlutterNativeConfig config;
  final RtcVolcengineFlutterEngineFactory engineFactory;

  RTCEngine? engine;
  RTCRoom? room;
  RtcSessionDescriptor? joinedSession;
  final Map<String, RtcTrackKind> publishedTracks = <String, RtcTrackKind>{};
}

RtcProviderDriver<RtcVolcengineFlutterNativeClient>
    createOfficialVolcengineFlutterRtcDriver({
  RtcVolcengineFlutterEngineFactory? engineFactory,
}) {
  final metadata = getOfficialRtcProviderMetadataByKey('volcengine');
  if (metadata == null) {
    throw const RtcSdkException(
      code: 'vendor_error',
      message: 'Volcengine provider metadata is missing from the official catalog.',
    );
  }

  return createRtcProviderDriver<RtcVolcengineFlutterNativeClient>(
    metadata: metadata,
    nativeFactory: (config) {
      final nativeConfig = _resolveNativeConfig(config);
      return RtcVolcengineFlutterNativeClient(
        resolvedConfig: config,
        config: nativeConfig,
        engineFactory: engineFactory ?? _createRtcEngine,
      );
    },
    runtimeController: _OfficialVolcengineFlutterRtcRuntimeController(),
  );
}

final class _OfficialVolcengineFlutterRtcRuntimeController
    implements RtcRuntimeController<RtcVolcengineFlutterNativeClient> {
  @override
  Future<RtcSessionDescriptor> join(
    RtcJoinOptions options,
    RtcRuntimeControllerContext<RtcVolcengineFlutterNativeClient> context,
  ) async {
    await _leaveActiveSession(context.nativeClient);

    final engine = await _ensureEngine(context.nativeClient);
    final room = await _ensureRoom(context.nativeClient, engine, options.roomId);
    final roomConfig = _buildRoomConfig(context.nativeClient.config.room, options);
    final userInfo = _buildUserInfo(options, context.nativeClient.config);

    final joinCode = await room.joinRoom(
      token: options.token ?? '',
      userInfo: userInfo,
      userVisibility: context.nativeClient.config.userVisibility,
      roomConfig: roomConfig,
    );
    _assertRtcReturnCode(
      joinCode,
      action: 'joinRoom',
      providerKey: context.metadata.providerKey,
      pluginId: context.metadata.pluginId,
    );

    final sessionDescriptor = RtcSessionDescriptor(
      sessionId: options.sessionId,
      roomId: options.roomId,
      participantId: options.participantId,
      providerKey: context.metadata.providerKey,
      connectionState: RtcSessionConnectionState.joined,
    );

    context.nativeClient.joinedSession = sessionDescriptor;
    return sessionDescriptor;
  }

  @override
  Future<RtcSessionDescriptor> leave(
    RtcRuntimeControllerContext<RtcVolcengineFlutterNativeClient> context,
  ) async {
    return _leaveActiveSession(context.nativeClient);
  }

  @override
  Future<RtcTrackPublication> publish(
    RtcPublishOptions options,
    RtcRuntimeControllerContext<RtcVolcengineFlutterNativeClient> context,
  ) async {
    final engine = await _requireEngine(
      context.nativeClient,
      metadata: context.metadata,
    );
    final room = _requireRoom(
      context.nativeClient,
      metadata: context.metadata,
    );

    switch (options.kind) {
      case RtcTrackKind.audio:
        _assertRtcReturnCode(
          await engine.startAudioCapture(),
          action: 'startAudioCapture',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        _assertRtcReturnCode(
          await room.publishStreamAudio(true),
          action: 'publishStreamAudio',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        break;
      case RtcTrackKind.video:
        _assertRtcReturnCode(
          await engine.startVideoCapture(),
          action: 'startVideoCapture',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        _assertRtcReturnCode(
          await room.publishStreamVideo(true),
          action: 'publishStreamVideo',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        break;
      case RtcTrackKind.screenShare:
      case RtcTrackKind.data:
        throw RtcSdkException(
          code: 'capability_not_supported',
          message: 'Official Volcengine Flutter bridge does not support publishing ${rtcTrackKindWireName(options.kind)} through the standard runtime surface.',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
    }

    context.nativeClient.publishedTracks[options.trackId] = options.kind;
    return RtcTrackPublication(
      trackId: options.trackId,
      kind: options.kind,
      muted: false,
    );
  }

  @override
  Future<void> unpublish(
    String trackId,
    RtcRuntimeControllerContext<RtcVolcengineFlutterNativeClient> context,
  ) async {
    final trackKind = context.nativeClient.publishedTracks[trackId];
    if (trackKind == null) {
      return;
    }

    final engine = await _requireEngine(
      context.nativeClient,
      metadata: context.metadata,
    );
    final room = _requireRoom(
      context.nativeClient,
      metadata: context.metadata,
    );

    switch (trackKind) {
      case RtcTrackKind.audio:
        _assertRtcReturnCode(
          await room.publishStreamAudio(false),
          action: 'unpublishStreamAudio',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        _assertRtcReturnCode(
          await engine.stopAudioCapture(),
          action: 'stopAudioCapture',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        break;
      case RtcTrackKind.video:
        _assertRtcReturnCode(
          await room.publishStreamVideo(false),
          action: 'unpublishStreamVideo',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        _assertRtcReturnCode(
          await engine.stopVideoCapture(),
          action: 'stopVideoCapture',
          providerKey: context.metadata.providerKey,
          pluginId: context.metadata.pluginId,
        );
        break;
      case RtcTrackKind.screenShare:
      case RtcTrackKind.data:
        break;
    }

    context.nativeClient.publishedTracks.remove(trackId);
  }

  @override
  Future<RtcMuteState> muteAudio(
    bool muted,
    RtcRuntimeControllerContext<RtcVolcengineFlutterNativeClient> context,
  ) async {
    final engine = await _requireEngine(
      context.nativeClient,
      metadata: context.metadata,
    );
    final room = _requireRoom(
      context.nativeClient,
      metadata: context.metadata,
    );

    if (muted) {
      _assertRtcReturnCode(
        await room.publishStreamAudio(false),
        action: 'publishStreamAudio(false)',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
      _assertRtcReturnCode(
        await engine.stopAudioCapture(),
        action: 'stopAudioCapture',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
    } else {
      _assertRtcReturnCode(
        await engine.startAudioCapture(),
        action: 'startAudioCapture',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
      _assertRtcReturnCode(
        await room.publishStreamAudio(true),
        action: 'publishStreamAudio(true)',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
    }

    return RtcMuteState(
      kind: RtcTrackKind.audio,
      muted: muted,
    );
  }

  @override
  Future<RtcMuteState> muteVideo(
    bool muted,
    RtcRuntimeControllerContext<RtcVolcengineFlutterNativeClient> context,
  ) async {
    final engine = await _requireEngine(
      context.nativeClient,
      metadata: context.metadata,
    );
    final room = _requireRoom(
      context.nativeClient,
      metadata: context.metadata,
    );

    if (muted) {
      _assertRtcReturnCode(
        await room.publishStreamVideo(false),
        action: 'publishStreamVideo(false)',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
      _assertRtcReturnCode(
        await engine.stopVideoCapture(),
        action: 'stopVideoCapture',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
    } else {
      _assertRtcReturnCode(
        await engine.startVideoCapture(),
        action: 'startVideoCapture',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
      _assertRtcReturnCode(
        await room.publishStreamVideo(true),
        action: 'publishStreamVideo(true)',
        providerKey: context.metadata.providerKey,
        pluginId: context.metadata.pluginId,
      );
    }

    return RtcMuteState(
      kind: RtcTrackKind.video,
      muted: muted,
    );
  }
}

Future<RTCEngine> _createRtcEngine(
  RtcVolcengineFlutterNativeConfig config,
) {
  return RTCEngine.createRTCEngine(
    RTCVideoContext(
      appId: config.appId,
      parameters: config.engineParameters,
      isGameScene: config.isGameScene,
      autoCreateAudioEffectPlayer: config.autoCreateAudioEffectPlayer,
      autoCreateVideoEffectInterface: config.autoCreateVideoEffectInterface,
      autoCreateWTNStream: config.autoCreateWtnStream,
    ),
  );
}

RtcVolcengineFlutterNativeConfig _resolveNativeConfig(
  RtcResolvedClientConfig config,
) {
  final nativeConfig = config.nativeConfig;
  if (nativeConfig is RtcVolcengineFlutterNativeConfig) {
    return nativeConfig;
  }

  if (nativeConfig is Map<String, Object?>) {
    final roomMap = nativeConfig['room'];
    return RtcVolcengineFlutterNativeConfig(
      appId: _requireAppId(nativeConfig['appId']),
      engineParameters: _readDynamicMap(nativeConfig['engineParameters']),
      userExtraInfo: _readObjectMap(nativeConfig['userExtraInfo']),
      userVisibility: _readBool(nativeConfig['userVisibility'], fallback: true),
      isGameScene: _readBool(nativeConfig['isGameScene'], fallback: false),
      autoCreateAudioEffectPlayer: _readBool(
        nativeConfig['autoCreateAudioEffectPlayer'],
        fallback: false,
      ),
      autoCreateVideoEffectInterface: _readBool(
        nativeConfig['autoCreateVideoEffectInterface'],
        fallback: false,
      ),
      autoCreateWtnStream: _readBool(
        nativeConfig['autoCreateWtnStream'],
        fallback: false,
      ),
      room: RtcVolcengineFlutterRoomConfig(
        streamId: roomMap is Map<String, Object?> ? roomMap['streamId']?.toString() : null,
        publishAudioOnJoin: roomMap is Map<String, Object?>
            ? _readBool(roomMap['publishAudioOnJoin'], fallback: false)
            : false,
        publishVideoOnJoin: roomMap is Map<String, Object?>
            ? _readBool(roomMap['publishVideoOnJoin'], fallback: false)
            : false,
        autoSubscribeAudio: roomMap is Map<String, Object?>
            ? _readBool(roomMap['autoSubscribeAudio'], fallback: true)
            : true,
        autoSubscribeVideo: roomMap is Map<String, Object?>
            ? _readBool(roomMap['autoSubscribeVideo'], fallback: true)
            : true,
      ),
    );
  }

  throw RtcSdkException(
    code: 'invalid_native_config',
    message: 'Official Volcengine Flutter runtime requires nativeConfig as RtcVolcengineFlutterNativeConfig or a Map containing appId.',
    details: <String, Object?>{
      'providerKey': config.providerKey,
      'nativeConfigType': nativeConfig.runtimeType.toString(),
    },
  );
}

Future<RTCEngine> _ensureEngine(
  RtcVolcengineFlutterNativeClient nativeClient,
) async {
  final existingEngine = nativeClient.engine;
  if (existingEngine != null) {
    return existingEngine;
  }

  final createdEngine = await nativeClient.engineFactory(nativeClient.config);
  nativeClient.engine = createdEngine;
  return createdEngine;
}

Future<RTCRoom> _ensureRoom(
  RtcVolcengineFlutterNativeClient nativeClient,
  RTCEngine engine,
  String roomId,
) async {
  final existingRoom = nativeClient.room;
  if (existingRoom != null && nativeClient.joinedSession?.roomId == roomId) {
    return existingRoom;
  }

  final createdRoom = await engine.createRTCRoom(roomId);
  if (createdRoom != null) {
    nativeClient.room = createdRoom;
    return createdRoom;
  }

  throw RtcSdkException(
    code: 'vendor_error',
    message: 'Volcengine Flutter SDK could not create room: $roomId',
  );
}

Future<RTCEngine> _requireEngine(
  RtcVolcengineFlutterNativeClient nativeClient, {
  required RtcProviderMetadata metadata,
}) async {
  final engine = nativeClient.engine;
  if (engine != null) {
    return engine;
  }

  throw RtcSdkException(
    code: 'call_state_invalid',
    message: 'RTC engine is not initialized. Join the room before publishing or muting media.',
    providerKey: metadata.providerKey,
    pluginId: metadata.pluginId,
  );
}

RTCRoom _requireRoom(
  RtcVolcengineFlutterNativeClient nativeClient, {
  required RtcProviderMetadata metadata,
}) {
  final room = nativeClient.room;
  if (room != null) {
    return room;
  }

  throw RtcSdkException(
    code: 'call_state_invalid',
    message: 'RTC room is not initialized. Join the room before publishing or muting media.',
    providerKey: metadata.providerKey,
    pluginId: metadata.pluginId,
  );
}

Future<RtcSessionDescriptor> _leaveActiveSession(
  RtcVolcengineFlutterNativeClient nativeClient,
) async {
  final joinedSession = nativeClient.joinedSession;
  final room = nativeClient.room;
  final engine = nativeClient.engine;

  if (room != null) {
    await room.leaveRoom();
  }

  if (engine != null) {
    if (_containsTrackKind(nativeClient.publishedTracks, RtcTrackKind.audio)) {
      await engine.stopAudioCapture();
    }
    if (_containsTrackKind(nativeClient.publishedTracks, RtcTrackKind.video)) {
      await engine.stopVideoCapture();
    }
    engine.destroy();
  }

  nativeClient.room = null;
  nativeClient.engine = null;
  nativeClient.joinedSession = null;
  nativeClient.publishedTracks.clear();

  return RtcSessionDescriptor(
    sessionId: joinedSession?.sessionId ?? '',
    roomId: joinedSession?.roomId ?? '',
    participantId: joinedSession?.participantId ?? '',
    providerKey: joinedSession?.providerKey ?? 'volcengine',
    connectionState: RtcSessionConnectionState.left,
  );
}

RoomConfig _buildRoomConfig(
  RtcVolcengineFlutterRoomConfig config,
  RtcJoinOptions options,
) {
  return RoomConfig(
    profile: config.profile,
    streamId: config.streamId ?? options.participantId,
    isPublishAudio: config.publishAudioOnJoin,
    isPublishVideo: config.publishVideoOnJoin,
    isAutoSubscribeAudio: config.autoSubscribeAudio,
    isAutoSubscribeVideo: config.autoSubscribeVideo,
  );
}

UserInfo _buildUserInfo(
  RtcJoinOptions options,
  RtcVolcengineFlutterNativeConfig config,
) {
  final mergedExtraInfo = <String, Object?>{
    ...?config.userExtraInfo,
    ...?options.metadata,
  };

  return UserInfo(
    userId: options.participantId,
    extraInfo: mergedExtraInfo.isEmpty ? '' : jsonEncode(mergedExtraInfo),
  );
}

void _assertRtcReturnCode(
  int? returnCode, {
  required String action,
  required String providerKey,
  required String pluginId,
}) {
  if (returnCode == null || returnCode == 0) {
    return;
  }

  throw RtcSdkException(
    code: 'vendor_error',
    message: 'Volcengine Flutter SDK action failed: $action',
    providerKey: providerKey,
    pluginId: pluginId,
    details: <String, Object?>{
      'action': action,
      'returnCode': returnCode,
    },
  );
}

String _requireAppId(Object? value) {
  final appId = value?.toString();
  if (appId != null && appId.isNotEmpty) {
    return appId;
  }

  throw const RtcSdkException(
    code: 'invalid_native_config',
    message: 'Official Volcengine Flutter runtime requires nativeConfig.appId.',
  );
}

bool _readBool(Object? value, {required bool fallback}) {
  if (value is bool) {
    return value;
  }

  return fallback;
}

Map<String, dynamic>? _readDynamicMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return value.map<String, dynamic>(
      (Object? key, Object? mapValue) => MapEntry(
        key.toString(),
        mapValue,
      ),
    );
  }

  return null;
}

Map<String, Object?>? _readObjectMap(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }

  if (value is Map) {
    return value.map<String, Object?>(
      (Object? key, Object? mapValue) => MapEntry(
        key.toString(),
        mapValue,
      ),
    );
  }

  return null;
}

bool _containsTrackKind(
  Map<String, RtcTrackKind> publishedTracks,
  RtcTrackKind trackKind,
) {
  return publishedTracks.values.any((value) => value == trackKind);
}
