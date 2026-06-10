package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcCapabilityCatalog {

  public static final List<Entry> ENTRIES = List.of(
      new Entry("session", "required-baseline", "cross-surface"),
      new Entry("credential", "required-baseline", "control-plane"),
      new Entry("provider.webhook", "required-baseline", "control-plane"),
      new Entry("provider.event-normalization", "required-baseline", "control-plane"),
      new Entry("health", "required-baseline", "control-plane"),
      new Entry("media.audio", "required-baseline", "runtime-bridge"),
      new Entry("media.video", "required-baseline", "runtime-bridge"),
      new Entry("live.broadcast", "required-baseline", "cross-surface"),
      new Entry("live.audience", "required-baseline", "cross-surface"),
      new Entry("screen-share", "optional-advanced", "runtime-bridge"),
      new Entry("recording", "optional-advanced", "control-plane"),
      new Entry("artifact", "optional-advanced", "control-plane"),
      new Entry("cloud-mix", "optional-advanced", "control-plane"),
      new Entry("cdn-relay", "optional-advanced", "control-plane"),
      new Entry("data-channel", "optional-advanced", "runtime-bridge"),
      new Entry("transcription", "optional-advanced", "control-plane"),
      new Entry("beauty", "optional-advanced", "runtime-bridge"),
      new Entry("spatial-audio", "optional-advanced", "runtime-bridge"),
      new Entry("e2ee", "optional-advanced", "runtime-bridge"),
      new Entry("provider.active-query", "optional-advanced", "control-plane")
  );

public static List<Entry> getRtcCapabilityCatalog() {
    return ENTRIES;
  }

  public static Optional<Entry> getRtcCapabilityDescriptor(String capabilityKey) {
    for (var entry : ENTRIES) {
      if (entry.capabilityKey().equals(capabilityKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }


  private RtcCapabilityCatalog() {
  }

  public record Entry(String capabilityKey, String category, String surface) {
  }
}
