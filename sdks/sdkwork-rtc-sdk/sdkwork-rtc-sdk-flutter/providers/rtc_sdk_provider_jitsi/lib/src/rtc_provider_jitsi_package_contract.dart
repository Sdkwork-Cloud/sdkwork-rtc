/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
final class RtcProviderJitsiPackageContract {
  static const String providerKey = "jitsi";
  static const String pluginId = "rtc-jitsi";
  static const String driverId = "sdkwork-rtc-driver-jitsi";
  static const String packageIdentity = "rtc_sdk_provider_jitsi";
  static const String status = "future-runtime-bridge-only";
  static const String runtimeBridgeStatus = "reserved";
  static const bool rootPublic = false;

  const RtcProviderJitsiPackageContract._();
}
