import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:rtc_sdk_provider_volcengine/rtc_sdk_provider_volcengine.dart';

class RtcMediaRuntimeJoinInput {
  final String appId;
  final String sessionId;
  final String roomId;
  final String participantId;
  final String token;
  final String displayName;

  const RtcMediaRuntimeJoinInput({
    required this.appId,
    required this.sessionId,
    required this.roomId,
    required this.participantId,
    required this.token,
    required this.displayName,
  });
}

class RtcMediaRuntimeStatus {
  final bool connected;
  final String providerKey;
  final String? message;

  const RtcMediaRuntimeStatus({
    required this.connected,
    required this.providerKey,
    this.message,
  });
}

abstract class RtcMediaRuntimePort {
  Future<RtcMediaRuntimeStatus> join(RtcMediaRuntimeJoinInput input);
  Future<void> leave();
  RtcMediaRuntimeStatus getStatus();
}

class SdkRtcMediaRuntime implements RtcMediaRuntimePort {
  RtcClient<RtcVolcengineOfficialFlutterNativeClient>? _client;
  bool _connected = false;
  String _message = 'RTC media runtime is ready for credential-backed join.';
  String _providerKey = 'volcengine';

  @override
  Future<RtcMediaRuntimeStatus> join(RtcMediaRuntimeJoinInput input) async {
    try {
      if (_client != null) {
        try {
          await _client!.leave();
        } catch (_) {}
        _client = null;
      }

      final driverManager = RtcDriverManager();
      await installRtcProviderPackage(
        RtcProviderPackageInstallRequest(
          driverManager: driverManager,
          loadRequest: const RtcProviderPackageLoadRequest(providerKey: 'volcengine'),
        ),
        importPackage: (_) async => VOLCENGINE_RTC_PROVIDER_MODULE,
      );

      final dataSource = RtcDataSource(
        driverManager: driverManager,
        options: RtcDataSourceOptions(
          providerKey: 'volcengine',
          nativeConfig: <String, Object?>{
            'appId': input.appId,
            'userExtraInfo': <String, Object?>{'displayName': input.displayName},
          },
        ),
      );

      final client =
          await dataSource.createClient<RtcVolcengineOfficialFlutterNativeClient>();
      await client.join(
        RtcJoinOptions(
          sessionId: input.sessionId,
          roomId: input.roomId,
          participantId: input.participantId,
          token: input.token,
          metadata: <String, Object?>{'displayName': input.displayName},
        ),
      );

      _client = client;
      _connected = true;
      _providerKey = client.metadata.providerKey;
      _message = 'Joined media session through $_providerKey runtime.';
      return RtcMediaRuntimeStatus(
        connected: true,
        providerKey: _providerKey,
        message: _message,
      );
    } catch (error) {
      _client = null;
      _connected = false;
      _message = error is RtcSdkException
          ? error.message
          : 'RTC media runtime is unavailable in this build.';
      return RtcMediaRuntimeStatus(
        connected: false,
        providerKey: _providerKey,
        message: _message,
      );
    }
  }

  @override
  Future<void> leave() async {
    if (_client != null) {
      try {
        await _client!.leave();
      } catch (_) {}
      _client = null;
    }
    _connected = false;
    _message = 'Left media session.';
  }

  @override
  RtcMediaRuntimeStatus getStatus() {
    return RtcMediaRuntimeStatus(
      connected: _connected,
      providerKey: _providerKey,
      message: _message,
    );
  }
}

Future<RtcMediaRuntimePort> createRtcMediaRuntime() async {
  return SdkRtcMediaRuntime();
}
