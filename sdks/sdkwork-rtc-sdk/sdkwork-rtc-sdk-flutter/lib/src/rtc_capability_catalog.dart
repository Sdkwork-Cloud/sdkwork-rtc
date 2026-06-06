final class RtcCapabilityCatalogEntry {
  const RtcCapabilityCatalogEntry({
    required this.capabilityKey,
    required this.category,
    required this.surface,
  });

  final String capabilityKey;
  final String category;
  final String surface;
}

final class RtcCapabilityCatalog {
  static const List<RtcCapabilityCatalogEntry> entries = <RtcCapabilityCatalogEntry>[
    RtcCapabilityCatalogEntry(
      capabilityKey: "session",
      category: "required-baseline",
      surface: "cross-surface",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "credential",
      category: "required-baseline",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "callback",
      category: "required-baseline",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "health",
      category: "required-baseline",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "call.audio",
      category: "required-baseline",
      surface: "runtime-bridge",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "call.video",
      category: "required-baseline",
      surface: "runtime-bridge",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "live.broadcast",
      category: "required-baseline",
      surface: "cross-surface",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "live.audience",
      category: "required-baseline",
      surface: "cross-surface",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "screen-share",
      category: "optional-advanced",
      surface: "runtime-bridge",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "recording",
      category: "optional-advanced",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "artifact",
      category: "optional-advanced",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "cloud-mix",
      category: "optional-advanced",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "cdn-relay",
      category: "optional-advanced",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "data-channel",
      category: "optional-advanced",
      surface: "runtime-bridge",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "transcription",
      category: "optional-advanced",
      surface: "control-plane",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "beauty",
      category: "optional-advanced",
      surface: "runtime-bridge",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "spatial-audio",
      category: "optional-advanced",
      surface: "runtime-bridge",
    ),
    RtcCapabilityCatalogEntry(
      capabilityKey: "e2ee",
      category: "optional-advanced",
      surface: "runtime-bridge",
    )
  ];

  const RtcCapabilityCatalog._();
}

List<RtcCapabilityCatalogEntry> getRtcCapabilityCatalog() {
  return RtcCapabilityCatalog.entries;
}

RtcCapabilityCatalogEntry? getRtcCapabilityDescriptor(String capabilityKey) {
  for (final entry in RtcCapabilityCatalog.entries) {
    if (entry.capabilityKey == capabilityKey) {
      return entry;
    }
  }

  return null;
}
