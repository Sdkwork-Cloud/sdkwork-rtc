package com.sdkwork.rtc.metadata;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public final class RtcProviderExtensionCatalog {

  public static final List<String> RECOGNIZED_SURFACES = List.of(
      "control-plane",
      "runtime-bridge",
      "cross-surface"
  );

  public static final List<String> RECOGNIZED_ACCESSES = List.of(
      "unwrap-only",
      "extension-object"
  );

  public static final List<String> RECOGNIZED_STATUSES = List.of(
      "reference-baseline",
      "reserved"
  );

  public static final List<Entry> ENTRIES = List.of(
      new Entry("volcengine.native-client", "volcengine", "Volcengine Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
      new Entry("aliyun.native-client", "aliyun", "Aliyun Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
      new Entry("tencent.native-client", "tencent", "Tencent Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
      new Entry("agora.native-client", "agora", "Agora Native Client", "runtime-bridge", "unwrap-only", "reserved"),
      new Entry("zego.native-client", "zego", "ZEGO Native Client", "runtime-bridge", "unwrap-only", "reserved"),
      new Entry("livekit.native-client", "livekit", "LiveKit Native Client", "runtime-bridge", "unwrap-only", "reserved"),
      new Entry("twilio.native-client", "twilio", "Twilio Native Client", "runtime-bridge", "unwrap-only", "reserved"),
      new Entry("jitsi.native-client", "jitsi", "Jitsi Native Client", "runtime-bridge", "unwrap-only", "reserved"),
      new Entry("janus.native-client", "janus", "Janus Native Client", "runtime-bridge", "unwrap-only", "reserved"),
      new Entry("mediasoup.native-client", "mediasoup", "mediasoup Native Client", "runtime-bridge", "unwrap-only", "reserved")
  );

public static List<Entry> getRtcProviderExtensionCatalog() {
    return ENTRIES;
  }

  public static Optional<Entry> getRtcProviderExtensionDescriptor(String extensionKey) {
    for (var entry : ENTRIES) {
      if (entry.extensionKey().equals(extensionKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }

  public static List<Entry> getRtcProviderExtensionsForProvider(String providerKey) {
    var resolved = new ArrayList<Entry>();
    for (var entry : ENTRIES) {
      if (entry.providerKey().equals(providerKey)) {
        resolved.add(entry);
      }
    }

    return List.copyOf(resolved);
  }

  public static List<Entry> getRtcProviderExtensions(List<String> extensionKeys) {
    var resolved = new ArrayList<Entry>();
    for (var extensionKey : extensionKeys) {
      getRtcProviderExtensionDescriptor(extensionKey).ifPresent(resolved::add);
    }

    return List.copyOf(resolved);
  }

  public static boolean hasRtcProviderExtension(List<String> extensionKeys, String extensionKey) {
    return extensionKeys.contains(extensionKey)
        && getRtcProviderExtensionDescriptor(extensionKey).isPresent();
  }


  private RtcProviderExtensionCatalog() {
  }

  public record Entry(
      String extensionKey,
      String providerKey,
      String displayName,
      String surface,
      String access,
      String status
  ) {
  }
}
