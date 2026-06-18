import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

class ParticipantCredentialService {
  final AppApiClient _client;

  ParticipantCredentialService(this._client);

  Future<String> issue(
    String mediaSessionId,
    String participantId, {
    String reason = 'join',
  }) async {
    final data = await _client.postJson(
      '/rtc/media_sessions/${Uri.encodeComponent(mediaSessionId)}/participants/${Uri.encodeComponent(participantId)}/credential',
      {'reason': reason},
    );
    final credential = data['credential'];
    if (credential is! String || credential.isEmpty) {
      throw StateError('RTC participant credential was not issued');
    }
    return credential;
  }
}
