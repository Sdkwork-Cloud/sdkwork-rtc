import 'package:sdkwork_rtc_backend_sdk_generated_dart/backend_client.dart';

export 'package:sdkwork_rtc_backend_sdk_generated_dart/backend_client.dart';

const backendApiPrefix = '/backend/v3/api';

RtcBackendClientBundle createRtcBackendClient({
  required String backendApiBaseUrl,
  String? accessToken,
  String? authToken,
  String? tenantId,
  String? organizationId,
  String? userId,
  String permissionScope = 'rtc.*',
}) {
  final client = SdkworkBackendClient.withBaseUrl(
    baseUrl: resolveBackendApiBaseUrl(backendApiBaseUrl),
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

  return RtcBackendClientBundle(backendSdk: client);
}

class RtcBackendClientBundle {
  const RtcBackendClientBundle({required this.backendSdk});

  final SdkworkBackendClient backendSdk;
}

String resolveBackendApiBaseUrl(String configuredBackendApiBaseUrl) {
  final trimmed = configuredBackendApiBaseUrl.trim();
  if (trimmed.endsWith(backendApiPrefix)) {
    return trimmed.substring(0, trimmed.length - backendApiPrefix.length);
  }
  return trimmed;
}

dynamic extractBackendData(dynamic result) {
  if (result == null) return null;
  if (result is Map<String, dynamic>) {
    return result['data'];
  }
  final data = (result as dynamic).data;
  return data;
}
