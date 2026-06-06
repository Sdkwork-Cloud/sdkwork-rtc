final class RtcProviderCatalogEntry {
  const RtcProviderCatalogEntry({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
    required this.defaultSelected,
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
  final bool defaultSelected;
}

final class RtcProviderCatalog {
  static const String DEFAULT_RTC_PROVIDER_KEY = "volcengine";

  static const List<RtcProviderCatalogEntry> entries = <RtcProviderCatalogEntry>[
    RtcProviderCatalogEntry(
      providerKey: "volcengine",
      pluginId: "rtc-volcengine",
      driverId: "sdkwork-rtc-driver-volcengine",
      defaultSelected: true,
    ),
    RtcProviderCatalogEntry(
      providerKey: "aliyun",
      pluginId: "rtc-aliyun",
      driverId: "sdkwork-rtc-driver-aliyun",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "tencent",
      pluginId: "rtc-tencent",
      driverId: "sdkwork-rtc-driver-tencent",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "agora",
      pluginId: "rtc-agora",
      driverId: "sdkwork-rtc-driver-agora",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "zego",
      pluginId: "rtc-zego",
      driverId: "sdkwork-rtc-driver-zego",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "livekit",
      pluginId: "rtc-livekit",
      driverId: "sdkwork-rtc-driver-livekit",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "twilio",
      pluginId: "rtc-twilio",
      driverId: "sdkwork-rtc-driver-twilio",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "jitsi",
      pluginId: "rtc-jitsi",
      driverId: "sdkwork-rtc-driver-jitsi",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "janus",
      pluginId: "rtc-janus",
      driverId: "sdkwork-rtc-driver-janus",
      defaultSelected: false,
    ),
    RtcProviderCatalogEntry(
      providerKey: "mediasoup",
      pluginId: "rtc-mediasoup",
      driverId: "sdkwork-rtc-driver-mediasoup",
      defaultSelected: false,
    )
  ];

  const RtcProviderCatalog._();
}

RtcProviderCatalogEntry? getRtcProviderByProviderKey(String providerKey) {
  for (final entry in RtcProviderCatalog.entries) {
    if (entry.providerKey == providerKey) {
      return entry;
    }
  }

  return null;
}
