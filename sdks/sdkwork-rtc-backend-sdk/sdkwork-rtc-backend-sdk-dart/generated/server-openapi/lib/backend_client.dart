import 'src/http/client.dart';
import 'src/http/sdk_config.dart';
import 'src/api/rtc_media_artifacts.dart';
import 'src/api/rtc_media_sessions.dart';
import 'src/api/rtc_provider_accounts.dart';
import 'src/api/rtc_provider_applications.dart';
import 'src/api/rtc_provider_credentials.dart';
import 'src/api/rtc_provider_plugins.dart';
import 'src/api/rtc_provider_profiles.dart';
import 'src/api/rtc_provider_query_jobs.dart';
import 'src/api/rtc_provider_routes.dart';
import 'src/api/rtc_provider_schemas.dart';
import 'src/api/rtc_provider_webhooks.dart';
import 'src/api/rtc_quality_samples.dart';
import 'src/api/rtc_rooms.dart';

class SdkworkBackendClient {
  final HttpClient _httpClient;

  late final RtcMediaArtifactsApi rtcMediaArtifacts;
  late final RtcMediaSessionsApi rtcMediaSessions;
  late final RtcProviderAccountsApi rtcProviderAccounts;
  late final RtcProviderApplicationsApi rtcProviderApplications;
  late final RtcProviderCredentialsApi rtcProviderCredentials;
  late final RtcProviderPluginsApi rtcProviderPlugins;
  late final RtcProviderProfilesApi rtcProviderProfiles;
  late final RtcProviderQueryJobsApi rtcProviderQueryJobs;
  late final RtcProviderRoutesApi rtcProviderRoutes;
  late final RtcProviderSchemasApi rtcProviderSchemas;
  late final RtcProviderWebhooksApi rtcProviderWebhooks;
  late final RtcQualitySamplesApi rtcQualitySamples;
  late final RtcRoomsApi rtcRooms;

  SdkworkBackendClient({
    required SdkConfig config,
  }) : _httpClient = HttpClient(config: config) {
    rtcMediaArtifacts = RtcMediaArtifactsApi(_httpClient);
    rtcMediaSessions = RtcMediaSessionsApi(_httpClient);
    rtcProviderAccounts = RtcProviderAccountsApi(_httpClient);
    rtcProviderApplications = RtcProviderApplicationsApi(_httpClient);
    rtcProviderCredentials = RtcProviderCredentialsApi(_httpClient);
    rtcProviderPlugins = RtcProviderPluginsApi(_httpClient);
    rtcProviderProfiles = RtcProviderProfilesApi(_httpClient);
    rtcProviderQueryJobs = RtcProviderQueryJobsApi(_httpClient);
    rtcProviderRoutes = RtcProviderRoutesApi(_httpClient);
    rtcProviderSchemas = RtcProviderSchemasApi(_httpClient);
    rtcProviderWebhooks = RtcProviderWebhooksApi(_httpClient);
    rtcQualitySamples = RtcQualitySamplesApi(_httpClient);
    rtcRooms = RtcRoomsApi(_httpClient);
  }

  factory SdkworkBackendClient.withBaseUrl({
    required String baseUrl,
    String? authToken,
    String? accessToken,
    Map<String, String>? headers,
    int timeout = 30000,
  }) {
    return SdkworkBackendClient(
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
