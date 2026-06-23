import 'src/http/client.dart';
import 'src/http/sdk_config.dart';
import 'src/api/rtc_media_sessions.dart';
import 'src/api/rtc_participant_credentials.dart';
import 'src/api/rtc_recording_artifacts.dart';
import 'src/api/rtc_provider_profiles.dart';
import 'src/api/rtc_rooms.dart';

class SdkworkAppClient {
  final HttpClient _httpClient;

  late final RtcMediaSessionsApi rtcMediaSessions;
  late final RtcParticipantCredentialsApi rtcParticipantCredentials;
  late final RtcRecordingArtifactsApi rtcRecordingArtifacts;
  late final RtcProviderProfilesApi rtcProviderProfiles;
  late final RtcRoomsApi rtcRooms;

  SdkworkAppClient({
    required SdkConfig config,
  }) : _httpClient = HttpClient(config: config) {
    rtcMediaSessions = RtcMediaSessionsApi(_httpClient);
    rtcParticipantCredentials = RtcParticipantCredentialsApi(_httpClient);
    rtcRecordingArtifacts = RtcRecordingArtifactsApi(_httpClient);
    rtcProviderProfiles = RtcProviderProfilesApi(_httpClient);
    rtcRooms = RtcRoomsApi(_httpClient);
  }

  factory SdkworkAppClient.withBaseUrl({
    required String baseUrl,
    String? authToken,
    String? accessToken,
    Map<String, String>? headers,
    int timeout = 30000,
  }) {
    return SdkworkAppClient(
      config: SdkConfig(
        baseUrl: baseUrl,
        timeout: timeout,
        headers: headers ?? const {},
        authToken: authToken,
        accessToken: accessToken,
      ),
    );
  }

  void setAuthToken(String token) {
    _httpClient.setAuthToken(token);
  }

  void setAccessToken(String token) {
    _httpClient.setAccessToken(token);
  }

  void setHeader(String key, String value) {
    _httpClient.setHeader(key, value);
  }

  void close() {
    _httpClient.close();
  }
}
