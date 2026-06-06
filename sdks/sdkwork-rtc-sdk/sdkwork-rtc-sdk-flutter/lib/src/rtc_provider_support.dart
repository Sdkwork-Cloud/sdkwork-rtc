enum RtcProviderSupportStatus {
  builtin_registered,
  official_registered,
  official_unregistered,
  unknown,
}

final class RtcProviderSupport {
  const RtcProviderSupport({
    required this.providerKey,
    required this.status,
    required this.builtin,
    required this.official,
    required this.registered,
  });

  final String providerKey;
  final RtcProviderSupportStatus status;
  final bool builtin;
  final bool official;
  final bool registered;
}

final class RtcProviderSupportStateRequest {
  const RtcProviderSupportStateRequest({
    required this.providerKey,
    required this.builtin,
    required this.official,
    required this.registered,
  });

  final String providerKey;
  final bool builtin;
  final bool official;
  final bool registered;
}

const List<String> rtcProviderSupportStatuses = <String>[
  'builtin_registered',
  'official_registered',
  'official_unregistered',
  'unknown',
];

RtcProviderSupportStatus resolveRtcProviderSupportStatus(
  RtcProviderSupportStateRequest request,
) {
  if (request.official && request.registered) {
    return request.builtin
        ? RtcProviderSupportStatus.builtin_registered
        : RtcProviderSupportStatus.official_registered;
  }

  if (request.official) {
    return RtcProviderSupportStatus.official_unregistered;
  }

  return RtcProviderSupportStatus.unknown;
}

RtcProviderSupport createRtcProviderSupportState(
  RtcProviderSupportStateRequest request,
) {
  return RtcProviderSupport(
    providerKey: request.providerKey,
    status: resolveRtcProviderSupportStatus(request),
    builtin: request.builtin,
    official: request.official,
    registered: request.registered,
  );
}
