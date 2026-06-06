import 'rtc_capability_catalog.dart';
import 'rtc_provider_activation_catalog.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_extension_catalog.dart';
import 'rtc_types.dart';

const Map<String, String> _rtcProviderDisplayNames = <String, String>{
  'volcengine': 'Volcengine RTC',
  'aliyun': 'Aliyun RTC',
  'tencent': 'Tencent RTC',
  'agora': 'Agora RTC',
  'zego': 'ZEGO RTC',
  'livekit': 'LiveKit RTC',
  'twilio': 'Twilio Video',
  'jitsi': 'Jitsi Meet',
  'janus': 'Janus RTC',
  'mediasoup': 'mediasoup RTC',
};

const Map<String, List<String>> _rtcProviderOptionalCapabilityMap =
    <String, List<String>>{
  'volcengine': <String>['screen-share', 'recording', 'cloud-mix'],
  'aliyun': <String>['screen-share', 'recording'],
  'tencent': <String>['screen-share', 'recording', 'cdn-relay'],
  'agora': <String>[
    'screen-share',
    'recording',
    'cloud-mix',
    'data-channel',
    'spatial-audio',
    'e2ee',
  ],
  'zego': <String>['screen-share', 'recording', 'cloud-mix', 'beauty'],
  'livekit': <String>[
    'screen-share',
    'recording',
    'data-channel',
    'transcription',
    'e2ee',
  ],
  'twilio': <String>['screen-share', 'recording', 'data-channel'],
  'jitsi': <String>['screen-share', 'recording', 'transcription'],
  'janus': <String>['data-channel'],
  'mediasoup': <String>['data-channel'],
};

List<String> _buildRequiredCapabilities() {
  return RtcCapabilityCatalog.entries
      .where((entry) => entry.category == 'required-baseline')
      .map((entry) => entry.capabilityKey)
      .toList(growable: false);
}

List<String> _buildExtensionKeys(String providerKey) {
  return getRtcProviderExtensionsForProvider(providerKey)
      .map((entry) => entry.extensionKey)
      .toList(growable: false);
}

RtcProviderMetadata _buildProviderMetadata(RtcProviderCatalogEntry entry) {
  return RtcProviderMetadata(
    providerKey: entry.providerKey,
    pluginId: entry.pluginId,
    driverId: entry.driverId,
    displayName: _rtcProviderDisplayNames[entry.providerKey] ?? entry.providerKey,
    defaultSelected: entry.defaultSelected,
    requiredCapabilities: _buildRequiredCapabilities(),
    optionalCapabilities: List<String>.of(
      _rtcProviderOptionalCapabilityMap[entry.providerKey] ?? const <String>[],
      growable: false,
    ),
    extensionKeys: _buildExtensionKeys(entry.providerKey),
  );
}

final List<RtcProviderMetadata> _officialRtcProviderMetadataCatalog =
    RtcProviderCatalog.entries
        .map(_buildProviderMetadata)
        .toList(growable: false);

final Map<String, RtcProviderMetadata> _officialRtcProviderMetadataByKey =
    <String, RtcProviderMetadata>{
  for (final metadata in _officialRtcProviderMetadataCatalog)
    metadata.providerKey: metadata,
};

final Set<String> _builtinRtcProviderKeys = RtcProviderActivationCatalog.entries
    .where((entry) => entry.builtin)
    .map((entry) => entry.providerKey)
    .toSet();

final List<RtcProviderMetadata> _builtinRtcProviderMetadataCatalog =
    _officialRtcProviderMetadataCatalog
        .where((metadata) => _builtinRtcProviderKeys.contains(metadata.providerKey))
        .toList(growable: false);

List<RtcProviderMetadata> getOfficialRtcProviderMetadataCatalog() {
  return List<RtcProviderMetadata>.unmodifiable(
    _officialRtcProviderMetadataCatalog,
  );
}

List<RtcProviderMetadata> getBuiltinRtcProviderMetadataCatalog() {
  return List<RtcProviderMetadata>.unmodifiable(
    _builtinRtcProviderMetadataCatalog,
  );
}

RtcProviderMetadata? getOfficialRtcProviderMetadataByKey(String providerKey) {
  return _officialRtcProviderMetadataByKey[providerKey];
}
