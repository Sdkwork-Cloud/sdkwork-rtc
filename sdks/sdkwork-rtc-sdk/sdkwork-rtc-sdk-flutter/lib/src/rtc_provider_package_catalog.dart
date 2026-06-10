final class RtcProviderPackageCatalogEntry {
  const RtcProviderPackageCatalogEntry({
    required this.providerKey,
    required this.pluginId,
    required this.driverId,
    required this.packageIdentity,
    required this.manifestPath,
    required this.readmePath,
    required this.sourcePath,
    required this.sourceSymbol,
    required this.builtin,
    required this.rootPublic,
    required this.status,
    required this.runtimeBridgeStatus,
  });

  final String providerKey;
  final String pluginId;
  final String driverId;
  final String packageIdentity;
  final String manifestPath;
  final String readmePath;
  final String sourcePath;
  final String sourceSymbol;
  final bool builtin;
  final bool rootPublic;
  final String status;
  final String runtimeBridgeStatus;
}

final class RtcProviderPackageCatalog {
  static const List<RtcProviderPackageCatalogEntry> entries =
      <RtcProviderPackageCatalogEntry>[
    RtcProviderPackageCatalogEntry(
      providerKey: "volcengine",
      pluginId: "rtc-volcengine",
      driverId: "sdkwork-rtc-driver-volcengine",
      packageIdentity: "rtc_sdk_provider_volcengine",
      manifestPath: "providers/rtc_sdk_provider_volcengine/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_volcengine/README.md",
      sourcePath: "providers/rtc_sdk_provider_volcengine/lib/src/rtc_provider_volcengine_package_contract.dart",
      sourceSymbol: "RtcProviderVolcenginePackageContract",
      builtin: true,
      rootPublic: false,
      status: "package_reference_boundary",
      runtimeBridgeStatus: "reference-baseline",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "aliyun",
      pluginId: "rtc-aliyun",
      driverId: "sdkwork-rtc-driver-aliyun",
      packageIdentity: "rtc_sdk_provider_aliyun",
      manifestPath: "providers/rtc_sdk_provider_aliyun/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_aliyun/README.md",
      sourcePath: "providers/rtc_sdk_provider_aliyun/lib/src/rtc_provider_aliyun_package_contract.dart",
      sourceSymbol: "RtcProviderAliyunPackageContract",
      builtin: true,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "tencent",
      pluginId: "rtc-tencent",
      driverId: "sdkwork-rtc-driver-tencent",
      packageIdentity: "rtc_sdk_provider_tencent",
      manifestPath: "providers/rtc_sdk_provider_tencent/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_tencent/README.md",
      sourcePath: "providers/rtc_sdk_provider_tencent/lib/src/rtc_provider_tencent_package_contract.dart",
      sourceSymbol: "RtcProviderTencentPackageContract",
      builtin: true,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "agora",
      pluginId: "rtc-agora",
      driverId: "sdkwork-rtc-driver-agora",
      packageIdentity: "rtc_sdk_provider_agora",
      manifestPath: "providers/rtc_sdk_provider_agora/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_agora/README.md",
      sourcePath: "providers/rtc_sdk_provider_agora/lib/src/rtc_provider_agora_package_contract.dart",
      sourceSymbol: "RtcProviderAgoraPackageContract",
      builtin: true,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "zego",
      pluginId: "rtc-zego",
      driverId: "sdkwork-rtc-driver-zego",
      packageIdentity: "rtc_sdk_provider_zego",
      manifestPath: "providers/rtc_sdk_provider_zego/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_zego/README.md",
      sourcePath: "providers/rtc_sdk_provider_zego/lib/src/rtc_provider_zego_package_contract.dart",
      sourceSymbol: "RtcProviderZegoPackageContract",
      builtin: false,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "livekit",
      pluginId: "rtc-livekit",
      driverId: "sdkwork-rtc-driver-livekit",
      packageIdentity: "rtc_sdk_provider_livekit",
      manifestPath: "providers/rtc_sdk_provider_livekit/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_livekit/README.md",
      sourcePath: "providers/rtc_sdk_provider_livekit/lib/src/rtc_provider_livekit_package_contract.dart",
      sourceSymbol: "RtcProviderLivekitPackageContract",
      builtin: true,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "twilio",
      pluginId: "rtc-twilio",
      driverId: "sdkwork-rtc-driver-twilio",
      packageIdentity: "rtc_sdk_provider_twilio",
      manifestPath: "providers/rtc_sdk_provider_twilio/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_twilio/README.md",
      sourcePath: "providers/rtc_sdk_provider_twilio/lib/src/rtc_provider_twilio_package_contract.dart",
      sourceSymbol: "RtcProviderTwilioPackageContract",
      builtin: false,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "jitsi",
      pluginId: "rtc-jitsi",
      driverId: "sdkwork-rtc-driver-jitsi",
      packageIdentity: "rtc_sdk_provider_jitsi",
      manifestPath: "providers/rtc_sdk_provider_jitsi/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_jitsi/README.md",
      sourcePath: "providers/rtc_sdk_provider_jitsi/lib/src/rtc_provider_jitsi_package_contract.dart",
      sourceSymbol: "RtcProviderJitsiPackageContract",
      builtin: false,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "janus",
      pluginId: "rtc-janus",
      driverId: "sdkwork-rtc-driver-janus",
      packageIdentity: "rtc_sdk_provider_janus",
      manifestPath: "providers/rtc_sdk_provider_janus/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_janus/README.md",
      sourcePath: "providers/rtc_sdk_provider_janus/lib/src/rtc_provider_janus_package_contract.dart",
      sourceSymbol: "RtcProviderJanusPackageContract",
      builtin: false,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    ),
    RtcProviderPackageCatalogEntry(
      providerKey: "mediasoup",
      pluginId: "rtc-mediasoup",
      driverId: "sdkwork-rtc-driver-mediasoup",
      packageIdentity: "rtc_sdk_provider_mediasoup",
      manifestPath: "providers/rtc_sdk_provider_mediasoup/pubspec.yaml",
      readmePath: "providers/rtc_sdk_provider_mediasoup/README.md",
      sourcePath: "providers/rtc_sdk_provider_mediasoup/lib/src/rtc_provider_mediasoup_package_contract.dart",
      sourceSymbol: "RtcProviderMediasoupPackageContract",
      builtin: false,
      rootPublic: false,
      status: "future-runtime-bridge-only",
      runtimeBridgeStatus: "reserved",
    )
      ];

  const RtcProviderPackageCatalog._();
}

RtcProviderPackageCatalogEntry? getRtcProviderPackageByProviderKey(String providerKey) {
  for (final entry in RtcProviderPackageCatalog.entries) {
    if (entry.providerKey == providerKey) {
      return entry;
    }
  }

  return null;
}

RtcProviderPackageCatalogEntry? getRtcProviderPackageByPackageIdentity(String packageIdentity) {
  for (final entry in RtcProviderPackageCatalog.entries) {
    if (entry.packageIdentity == packageIdentity) {
      return entry;
    }
  }

  return null;
}
