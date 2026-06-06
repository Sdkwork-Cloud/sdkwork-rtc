package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderCatalog {

  public static final String DEFAULT_RTC_PROVIDER_KEY = "volcengine";

  public static final List<Entry> ENTRIES = List.of(
      new Entry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", true),
      new Entry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", false),
      new Entry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", false),
      new Entry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", false),
      new Entry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", false),
      new Entry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", false),
      new Entry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", false),
      new Entry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", false),
      new Entry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", false),
      new Entry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", false)
  );

public static Optional<Entry> getRtcProviderByProviderKey(String providerKey) {
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }


  private RtcProviderCatalog() {
  }

  public record Entry(String providerKey, String pluginId, String driverId, boolean defaultSelected) {
  }
}
