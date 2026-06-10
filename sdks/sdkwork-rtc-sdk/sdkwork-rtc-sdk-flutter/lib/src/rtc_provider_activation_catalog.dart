final class RtcProviderActivationCatalogEntry {
  const RtcProviderActivationCatalogEntry({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
    required this.activationStatus,
    required this.runtimeBridge,
    required this.rootPublic,
    required this.packageBoundary,
    required this.builtin,
    required this.packageIdentity,
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
  final String activationStatus;
  final bool runtimeBridge;
  final bool rootPublic;
  final bool packageBoundary;
  final bool builtin;
  final String packageIdentity;
}

final class RtcProviderActivationCatalog {
  static const List<String> recognizedActivationStatuses = <String>[
    "package-boundary",
    "control-metadata-only",
  ];

  static const List<RtcProviderActivationCatalogEntry> entries =
      <RtcProviderActivationCatalogEntry>[
    RtcProviderActivationCatalogEntry(
      providerKey: "volcengine",
      pluginId: "rtc-volcengine",
      driverId: "sdkwork-rtc-driver-volcengine",
      activationStatus: "package-boundary",
      runtimeBridge: true,
      rootPublic: false,
      packageBoundary: true,
      builtin: true,
      packageIdentity: "rtc_sdk_provider_volcengine",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "aliyun",
      pluginId: "rtc-aliyun",
      driverId: "sdkwork-rtc-driver-aliyun",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: true,
      packageIdentity: "rtc_sdk_provider_aliyun",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "tencent",
      pluginId: "rtc-tencent",
      driverId: "sdkwork-rtc-driver-tencent",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: true,
      packageIdentity: "rtc_sdk_provider_tencent",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "agora",
      pluginId: "rtc-agora",
      driverId: "sdkwork-rtc-driver-agora",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: true,
      packageIdentity: "rtc_sdk_provider_agora",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "zego",
      pluginId: "rtc-zego",
      driverId: "sdkwork-rtc-driver-zego",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: false,
      packageIdentity: "rtc_sdk_provider_zego",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "livekit",
      pluginId: "rtc-livekit",
      driverId: "sdkwork-rtc-driver-livekit",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: true,
      packageIdentity: "rtc_sdk_provider_livekit",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "twilio",
      pluginId: "rtc-twilio",
      driverId: "sdkwork-rtc-driver-twilio",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: false,
      packageIdentity: "rtc_sdk_provider_twilio",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "jitsi",
      pluginId: "rtc-jitsi",
      driverId: "sdkwork-rtc-driver-jitsi",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: false,
      packageIdentity: "rtc_sdk_provider_jitsi",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "janus",
      pluginId: "rtc-janus",
      driverId: "sdkwork-rtc-driver-janus",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: false,
      packageIdentity: "rtc_sdk_provider_janus",
    ),
    RtcProviderActivationCatalogEntry(
      providerKey: "mediasoup",
      pluginId: "rtc-mediasoup",
      driverId: "sdkwork-rtc-driver-mediasoup",
      activationStatus: "control-metadata-only",
      runtimeBridge: false,
      rootPublic: false,
      packageBoundary: false,
      builtin: false,
      packageIdentity: "rtc_sdk_provider_mediasoup",
    ),
      ];

  const RtcProviderActivationCatalog._();
}

RtcProviderActivationCatalogEntry? getRtcProviderActivationByProviderKey(String providerKey) {
  for (final entry in RtcProviderActivationCatalog.entries) {
    if (entry.providerKey == providerKey) {
      return entry;
    }
  }

  return null;
}
