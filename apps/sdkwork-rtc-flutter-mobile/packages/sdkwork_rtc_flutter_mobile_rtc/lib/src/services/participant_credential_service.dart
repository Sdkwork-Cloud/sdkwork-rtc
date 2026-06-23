import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

import 'rtc_command_idempotency.dart';

class ParticipantCredentialService {
  final SdkworkAppClient _client;

  ParticipantCredentialService(this._client);

  Future<String> issue(
    String mediaSessionId,
    String participantId, {
    String reason = 'join',
    String? idempotencyKey,
  }) async {
    final response = await _client.rtcParticipantCredentials
        .rtcMediaSessionsParticipantCredentialsIssue(
      mediaSessionId,
      participantId,
      {'reason': reason},
      idempotencyKey ??
          createRtcCommandIdempotencyKey('participant-credential-issue'),
    );
    final credential = response?.data?.credential;
    if (credential == null || credential.isEmpty) {
      throw StateError('RTC participant credential was not issued');
    }
    return credential;
  }
}
