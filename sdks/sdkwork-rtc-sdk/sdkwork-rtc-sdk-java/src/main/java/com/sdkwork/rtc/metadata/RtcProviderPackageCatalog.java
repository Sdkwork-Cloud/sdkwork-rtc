package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderPackageCatalog {

  public static final List<RtcProviderPackageCatalogEntry> ENTRIES = List.of(
      new RtcProviderPackageCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "com.sdkwork:rtc-sdk-provider-volcengine", "providers/rtc-sdk-provider-volcengine/pom.xml", "providers/rtc-sdk-provider-volcengine/README.md", "providers/rtc-sdk-provider-volcengine/src/main/java/com/sdkwork/rtc/provider/volcengine/RtcProviderVolcenginePackageContract.java", "RtcProviderVolcenginePackageContract", true, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "com.sdkwork:rtc-sdk-provider-aliyun", "providers/rtc-sdk-provider-aliyun/pom.xml", "providers/rtc-sdk-provider-aliyun/README.md", "providers/rtc-sdk-provider-aliyun/src/main/java/com/sdkwork/rtc/provider/aliyun/RtcProviderAliyunPackageContract.java", "RtcProviderAliyunPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "com.sdkwork:rtc-sdk-provider-tencent", "providers/rtc-sdk-provider-tencent/pom.xml", "providers/rtc-sdk-provider-tencent/README.md", "providers/rtc-sdk-provider-tencent/src/main/java/com/sdkwork/rtc/provider/tencent/RtcProviderTencentPackageContract.java", "RtcProviderTencentPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "com.sdkwork:rtc-sdk-provider-agora", "providers/rtc-sdk-provider-agora/pom.xml", "providers/rtc-sdk-provider-agora/README.md", "providers/rtc-sdk-provider-agora/src/main/java/com/sdkwork/rtc/provider/agora/RtcProviderAgoraPackageContract.java", "RtcProviderAgoraPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "com.sdkwork:rtc-sdk-provider-zego", "providers/rtc-sdk-provider-zego/pom.xml", "providers/rtc-sdk-provider-zego/README.md", "providers/rtc-sdk-provider-zego/src/main/java/com/sdkwork/rtc/provider/zego/RtcProviderZegoPackageContract.java", "RtcProviderZegoPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "com.sdkwork:rtc-sdk-provider-livekit", "providers/rtc-sdk-provider-livekit/pom.xml", "providers/rtc-sdk-provider-livekit/README.md", "providers/rtc-sdk-provider-livekit/src/main/java/com/sdkwork/rtc/provider/livekit/RtcProviderLivekitPackageContract.java", "RtcProviderLivekitPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "com.sdkwork:rtc-sdk-provider-twilio", "providers/rtc-sdk-provider-twilio/pom.xml", "providers/rtc-sdk-provider-twilio/README.md", "providers/rtc-sdk-provider-twilio/src/main/java/com/sdkwork/rtc/provider/twilio/RtcProviderTwilioPackageContract.java", "RtcProviderTwilioPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "com.sdkwork:rtc-sdk-provider-jitsi", "providers/rtc-sdk-provider-jitsi/pom.xml", "providers/rtc-sdk-provider-jitsi/README.md", "providers/rtc-sdk-provider-jitsi/src/main/java/com/sdkwork/rtc/provider/jitsi/RtcProviderJitsiPackageContract.java", "RtcProviderJitsiPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "com.sdkwork:rtc-sdk-provider-janus", "providers/rtc-sdk-provider-janus/pom.xml", "providers/rtc-sdk-provider-janus/README.md", "providers/rtc-sdk-provider-janus/src/main/java/com/sdkwork/rtc/provider/janus/RtcProviderJanusPackageContract.java", "RtcProviderJanusPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
      new RtcProviderPackageCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "com.sdkwork:rtc-sdk-provider-mediasoup", "providers/rtc-sdk-provider-mediasoup/pom.xml", "providers/rtc-sdk-provider-mediasoup/README.md", "providers/rtc-sdk-provider-mediasoup/src/main/java/com/sdkwork/rtc/provider/mediasoup/RtcProviderMediasoupPackageContract.java", "RtcProviderMediasoupPackageContract", false, false, "future-runtime-bridge-only", "reserved")
  );

public static Optional<RtcProviderPackageCatalogEntry> getRtcProviderPackageByProviderKey(String providerKey) {
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }

  public static Optional<RtcProviderPackageCatalogEntry> getRtcProviderPackageByPackageIdentity(String packageIdentity) {
    for (var entry : ENTRIES) {
      if (entry.packageIdentity().equals(packageIdentity)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }


  private RtcProviderPackageCatalog() {
  }

  public record RtcProviderPackageCatalogEntry(
      String providerKey,
      String pluginId,
      String driverId,
      String packageIdentity,
      String manifestPath,
      String readmePath,
      String sourcePath,
      String sourceSymbol,
      boolean builtin,
      boolean rootPublic,
      String status,
      String runtimeBridgeStatus
  ) {
  }
}
