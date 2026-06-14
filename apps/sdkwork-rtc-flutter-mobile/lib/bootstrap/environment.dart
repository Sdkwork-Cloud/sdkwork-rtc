class RtcEnvironment {
  final String apiBaseUrl;
  final String backendApiBaseUrl;
  final String defaultMediaMode;
  final String providerSelection;
  final int maxParticipants;
  final bool audioOnlyFallback;

  const RtcEnvironment({
    required this.apiBaseUrl,
    required this.backendApiBaseUrl,
    this.defaultMediaMode = 'video',
    this.providerSelection = 'auto',
    this.maxParticipants = 9,
    this.audioOnlyFallback = true,
  });
}

RtcEnvironment resolveEnvironment() {
  return const RtcEnvironment(
    apiBaseUrl: 'http://127.0.0.1:18080/app/v3/api',
    backendApiBaseUrl: 'http://127.0.0.1:18080/backend/v3/api',
  );
}
