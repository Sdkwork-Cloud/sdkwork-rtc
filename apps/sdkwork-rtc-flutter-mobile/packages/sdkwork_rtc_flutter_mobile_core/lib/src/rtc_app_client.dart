import 'package:sdkwork_rtc_app_sdk/sdkwork_rtc_app_sdk.dart' show SdkworkAppClient;

export 'package:sdkwork_rtc_app_sdk/sdkwork_rtc_app_sdk.dart' show SdkworkAppClient;

const appApiPrefix = '/app/v3/api';

class RtcAppClientBundle {
  const RtcAppClientBundle({required this.appSdk});

  final SdkworkAppClient appSdk;
}

RtcAppClientBundle createRtcAppClient({
  required String apiBaseUrl,
  String? accessToken,
  String? authToken,
  String? tenantId,
  String? organizationId,
  String? userId,
  String permissionScope = 'rtc.*',
  SdkworkAppClient? existingClient,
}) {
  final SdkworkAppClient client;
  if (existingClient != null) {
    client = existingClient;
    if (authToken != null && authToken.isNotEmpty) {
      client.setAuthToken(authToken);
    }
    if (accessToken != null && accessToken.isNotEmpty) {
      client.setAccessToken(accessToken);
    }
    if (tenantId != null && tenantId.isNotEmpty) {
      client.setHeader('x-sdkwork-tenant-id', tenantId);
    }
    if (organizationId != null && organizationId.isNotEmpty) {
      client.setHeader('x-sdkwork-organization-id', organizationId);
    }
    if (userId != null && userId.isNotEmpty) {
      client.setHeader('x-sdkwork-user-id', userId);
      client.setHeader('x-sdkwork-actor-id', userId);
    }
    if (permissionScope.isNotEmpty) {
      client.setHeader('x-sdkwork-permission-scope', permissionScope);
    }
  } else {
    client = SdkworkAppClient.withBaseUrl(
      baseUrl: resolveAppApiBaseUrl(apiBaseUrl),
      authToken: authToken,
      accessToken: accessToken,
      headers: {
        if (tenantId != null && tenantId.isNotEmpty) 'x-sdkwork-tenant-id': tenantId,
        if (organizationId != null && organizationId.isNotEmpty)
          'x-sdkwork-organization-id': organizationId,
        if (userId != null && userId.isNotEmpty) ...{
          'x-sdkwork-user-id': userId,
          'x-sdkwork-actor-id': userId,
        },
        if (permissionScope.isNotEmpty) 'x-sdkwork-permission-scope': permissionScope,
      },
    );
  }

  return RtcAppClientBundle(appSdk: client);
}

String resolveAppApiBaseUrl(String configuredApiBaseUrl) {
  final trimmed = configuredApiBaseUrl.trim();
  if (trimmed.endsWith(appApiPrefix)) {
    return trimmed.substring(0, trimmed.length - appApiPrefix.length);
  }
  return trimmed;
}
