/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
final class RtcProviderJanusPackageContract {
  static const String providerKey = "janus";
  static const String pluginId = "rtc-janus";
  static const String driverId = "sdkwork-rtc-driver-janus";
  static const String packageIdentity = "rtc_sdk_provider_janus";
  static const String status = "future-runtime-bridge-only";
  static const String runtimeBridgeStatus = "reserved";
  static const bool rootPublic = false;

  const RtcProviderJanusPackageContract._();
}
