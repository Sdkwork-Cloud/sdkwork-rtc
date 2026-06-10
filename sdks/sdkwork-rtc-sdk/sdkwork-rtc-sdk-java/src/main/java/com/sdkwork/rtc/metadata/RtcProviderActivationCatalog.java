package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderActivationCatalog {

  public static final List<String> RECOGNIZED_ACTIVATION_STATUSES = List.of(
      "package-boundary",
      "control-metadata-only"
  );

  public static final List<RtcProviderActivationCatalogEntry> ENTRIES = List.of(
      new RtcProviderActivationCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-volcengine"),
      new RtcProviderActivationCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-aliyun"),
      new RtcProviderActivationCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-tencent"),
      new RtcProviderActivationCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-agora"),
      new RtcProviderActivationCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-zego"),
      new RtcProviderActivationCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-livekit"),
      new RtcProviderActivationCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-twilio"),
      new RtcProviderActivationCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-jitsi"),
      new RtcProviderActivationCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-janus"),
      new RtcProviderActivationCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-mediasoup")
  );

public static Optional<RtcProviderActivationCatalogEntry> getRtcProviderActivationByProviderKey(String providerKey) {
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }


  private RtcProviderActivationCatalog() {
  }

  public record RtcProviderActivationCatalogEntry(
      String providerKey,
      String pluginId,
      String driverId,
      String activationStatus,
      boolean runtimeBridge,
      boolean rootPublic,
      boolean packageBoundary,
      boolean builtin,
      String packageIdentity
  ) {
  }
}
