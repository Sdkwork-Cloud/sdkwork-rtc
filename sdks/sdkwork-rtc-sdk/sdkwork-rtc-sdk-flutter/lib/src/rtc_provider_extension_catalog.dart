final class RtcProviderExtensionCatalogEntry {
  const RtcProviderExtensionCatalogEntry({
    required this.extensionKey,
    required this.providerKey,
    required this.displayName,
    required this.surface,
    required this.access,
    required this.status,
  });

  final String extensionKey;
  final String providerKey;
  final String displayName;
  final String surface;
  final String access;
  final String status;
}

final class RtcProviderExtensionCatalog {
  static const List<String> recognizedSurfaces = <String>[
    'control-plane',
    'runtime-bridge',
    'cross-surface',
  ];

  static const List<String> recognizedAccessModes = <String>[
    'unwrap-only',
    'extension-object',
  ];

  static const List<String> recognizedStatuses = <String>[
    'reference-baseline',
    'reserved',
  ];

  static const List<RtcProviderExtensionCatalogEntry> entries =
      <RtcProviderExtensionCatalogEntry>[
        RtcProviderExtensionCatalogEntry(
          extensionKey: "volcengine.native-client",
          providerKey: "volcengine",
          displayName: "Volcengine Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reference-baseline",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "aliyun.native-client",
          providerKey: "aliyun",
          displayName: "Aliyun Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reference-baseline",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "tencent.native-client",
          providerKey: "tencent",
          displayName: "Tencent Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reference-baseline",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "agora.native-client",
          providerKey: "agora",
          displayName: "Agora Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reserved",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "zego.native-client",
          providerKey: "zego",
          displayName: "ZEGO Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reserved",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "livekit.native-client",
          providerKey: "livekit",
          displayName: "LiveKit Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reserved",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "twilio.native-client",
          providerKey: "twilio",
          displayName: "Twilio Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reserved",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "jitsi.native-client",
          providerKey: "jitsi",
          displayName: "Jitsi Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reserved",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "janus.native-client",
          providerKey: "janus",
          displayName: "Janus Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reserved",
        ),
        RtcProviderExtensionCatalogEntry(
          extensionKey: "mediasoup.native-client",
          providerKey: "mediasoup",
          displayName: "mediasoup Native Client",
          surface: "runtime-bridge",
          access: "unwrap-only",
          status: "reserved",
        )
      ];

  const RtcProviderExtensionCatalog._();
}

List<RtcProviderExtensionCatalogEntry> getRtcProviderExtensionCatalog() {
  return RtcProviderExtensionCatalog.entries;
}

RtcProviderExtensionCatalogEntry? getRtcProviderExtensionDescriptor(String extensionKey) {
  for (final entry in RtcProviderExtensionCatalog.entries) {
    if (entry.extensionKey == extensionKey) {
      return entry;
    }
  }

  return null;
}

List<RtcProviderExtensionCatalogEntry> getRtcProviderExtensionsForProvider(String providerKey) {
  return RtcProviderExtensionCatalog.entries
      .where((entry) => entry.providerKey == providerKey)
      .toList(growable: false);
}

List<RtcProviderExtensionCatalogEntry> getRtcProviderExtensions(List<String> extensionKeys) {
  final entries = <RtcProviderExtensionCatalogEntry>[];

  for (final extensionKey in extensionKeys) {
    final entry = getRtcProviderExtensionDescriptor(extensionKey);
    if (entry != null) {
      entries.add(entry);
    }
  }

  return entries.toList(growable: false);
}

bool hasRtcProviderExtension(List<String> extensionKeys, String extensionKey) {
  return extensionKeys.contains(extensionKey) &&
      getRtcProviderExtensionDescriptor(extensionKey) != null;
}
