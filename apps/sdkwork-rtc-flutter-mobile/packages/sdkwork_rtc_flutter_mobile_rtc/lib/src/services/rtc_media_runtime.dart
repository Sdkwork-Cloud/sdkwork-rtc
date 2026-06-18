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

class StubRtcMediaRuntime implements RtcMediaRuntimePort {
  bool _connected = false;
  String _message = 'RTC media runtime is ready for credential-backed join.';

  @override
  Future<RtcMediaRuntimeStatus> join(RtcMediaRuntimeJoinInput input) async {
    _connected = true;
    _message =
        'Credential issued for ${input.participantId} in room ${input.roomId}. '
        'Native RTC provider join is not wired in this Flutter build.';
    return RtcMediaRuntimeStatus(
      connected: true,
      providerKey: 'volcengine',
      message: _message,
    );
  }

  @override
  Future<void> leave() async {
    _connected = false;
    _message = 'Left media session.';
  }

  @override
  RtcMediaRuntimeStatus getStatus() {
    return RtcMediaRuntimeStatus(
      connected: _connected,
      providerKey: 'volcengine',
      message: _message,
    );
  }
}

Future<RtcMediaRuntimePort> createRtcMediaRuntime() async {
  return StubRtcMediaRuntime();
}
