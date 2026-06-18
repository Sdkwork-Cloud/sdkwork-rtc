import 'app_api_client.dart';

class RtcAppClientBundle {
  const RtcAppClientBundle({required this.appApi});

  final AppApiClient appApi;
}

RtcAppClientBundle createRtcAppClient({
  required String apiBaseUrl,
  String? accessToken,
  String? authToken,
  String? tenantId,
  String? organizationId,
  String? userId,
  String permissionScope = 'rtc.*',
}) {
  return RtcAppClientBundle(
    appApi: AppApiClient(
      baseUrl: resolveAppApiBaseUrl(apiBaseUrl),
      accessToken: accessToken,
      authToken: authToken,
      tenantId: tenantId,
      organizationId: organizationId,
      userId: userId,
      permissionScope: permissionScope,
    ),
  );
}
