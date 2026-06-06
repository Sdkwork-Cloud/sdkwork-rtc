import 'rtc_provider_catalog.dart';

enum RtcProviderSelectionSource {
  provider_url,
  provider_key,
  tenant_override,
  deployment_profile,
  default_provider,
}

final class ParsedRtcProviderUrl {
  const ParsedRtcProviderUrl({
    required this.providerKey,
    required this.rawUrl,
  });

  final String providerKey;
  final String rawUrl;
}

final class RtcProviderSelection {
  const RtcProviderSelection({
    required this.providerKey,
    required this.source,
  });

  final String providerKey;
  final RtcProviderSelectionSource source;
}

final class RtcProviderSelectionRequest {
  const RtcProviderSelectionRequest({
    this.providerUrl,
    this.providerKey,
    this.tenantOverrideProviderKey,
    this.deploymentProfileProviderKey,
  });

  final String? providerUrl;
  final String? providerKey;
  final String? tenantOverrideProviderKey;
  final String? deploymentProfileProviderKey;
}

const List<String> rtcProviderSelectionSources = <String>[
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
];

const List<String> rtcProviderSelectionPrecedence = <String>[
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
];

bool _hasRtcProviderSelectionText(String? value) =>
    value != null && value.trim().isNotEmpty;

ParsedRtcProviderUrl parseRtcProviderUrl(String providerUrl) {
  final trimmed = providerUrl.trim();
  if (!trimmed.startsWith('rtc:') || !trimmed.contains('://')) {
    throw ArgumentError.value(providerUrl, 'providerUrl', 'Invalid RTC provider URL');
  }

  return ParsedRtcProviderUrl(
    providerKey: trimmed.substring(4).split('://').first.toLowerCase(),
    rawUrl: providerUrl,
  );
}

RtcProviderSelection resolveRtcProviderSelection(
  RtcProviderSelectionRequest request, {
  String defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
}) {
  if (_hasRtcProviderSelectionText(request.providerUrl)) {
    return RtcProviderSelection(
      providerKey: parseRtcProviderUrl(request.providerUrl!).providerKey,
      source: RtcProviderSelectionSource.provider_url,
    );
  }

  if (_hasRtcProviderSelectionText(request.providerKey)) {
    return RtcProviderSelection(
      providerKey: request.providerKey!.trim(),
      source: RtcProviderSelectionSource.provider_key,
    );
  }

  if (_hasRtcProviderSelectionText(request.tenantOverrideProviderKey)) {
    return RtcProviderSelection(
      providerKey: request.tenantOverrideProviderKey!.trim(),
      source: RtcProviderSelectionSource.tenant_override,
    );
  }

  if (_hasRtcProviderSelectionText(request.deploymentProfileProviderKey)) {
    return RtcProviderSelection(
      providerKey: request.deploymentProfileProviderKey!.trim(),
      source: RtcProviderSelectionSource.deployment_profile,
    );
  }

  return RtcProviderSelection(
    providerKey: defaultProviderKey,
    source: RtcProviderSelectionSource.default_provider,
  );
}
