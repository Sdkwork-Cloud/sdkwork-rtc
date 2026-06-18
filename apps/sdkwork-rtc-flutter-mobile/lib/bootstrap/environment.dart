class RtcEnvironment {
  final String apiBaseUrl;
  final String backendApiBaseUrl;
  final String platformApiGatewayHttpUrl;
  final String appbaseLoginUrl;
  final String defaultMediaMode;
  final String providerSelection;
  final int maxParticipants;
  final bool audioOnlyFallback;

  const RtcEnvironment({
    required this.apiBaseUrl,
    required this.backendApiBaseUrl,
    required this.platformApiGatewayHttpUrl,
    required this.appbaseLoginUrl,
    this.defaultMediaMode = 'video',
    this.providerSelection = 'auto',
    this.maxParticipants = 9,
    this.audioOnlyFallback = true,
  });
}

String _normalizeBaseUrl(String value, String fallback) {
  final normalized = value.trim();
  return normalized.isEmpty ? fallback : normalized;
}

String _deriveAppApiBaseUrl(String applicationPublicHttpUrl) {
  final normalized = applicationPublicHttpUrl.replaceAll(RegExp(r'/+$'), '');
  return '$normalized/app/v3/api';
}

String _deriveBackendApiBaseUrl(String applicationPublicHttpUrl) {
  final normalized = applicationPublicHttpUrl.replaceAll(RegExp(r'/+$'), '');
  return '$normalized/backend/v3/api';
}

RtcEnvironment resolveEnvironment() {
  const applicationPublicHttpUrl = String.fromEnvironment(
    'SDKWORK_RTC_APPLICATION_PUBLIC_HTTP_URL',
    defaultValue: 'http://127.0.0.1:18088',
  );

  return RtcEnvironment(
    apiBaseUrl: _normalizeBaseUrl(
      const String.fromEnvironment('SDKWORK_RTC_APP_API_BASE_URL'),
      _deriveAppApiBaseUrl(applicationPublicHttpUrl),
    ),
    backendApiBaseUrl: _normalizeBaseUrl(
      const String.fromEnvironment('SDKWORK_RTC_BACKEND_API_BASE_URL'),
      _deriveBackendApiBaseUrl(applicationPublicHttpUrl),
    ),
    platformApiGatewayHttpUrl: _normalizeBaseUrl(
      const String.fromEnvironment('SDKWORK_RTC_PLATFORM_API_GATEWAY_HTTP_URL'),
      'http://127.0.0.1:3900',
    ),
    appbaseLoginUrl: _normalizeBaseUrl(
      const String.fromEnvironment('SDKWORK_RTC_APPBASE_LOGIN_URL'),
      _normalizeBaseUrl(
        const String.fromEnvironment('SDKWORK_RTC_PLATFORM_API_GATEWAY_HTTP_URL'),
        'http://127.0.0.1:3900',
      ),
    ),
  );
}
