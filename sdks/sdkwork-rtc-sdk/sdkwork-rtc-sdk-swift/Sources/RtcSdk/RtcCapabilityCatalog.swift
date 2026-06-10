public struct RtcCapabilityCatalogEntry {
    public let capabilityKey: String
    public let category: String
    public let surface: String
}

public enum RtcCapabilityCatalog {
    public static let entries: [RtcCapabilityCatalogEntry] = [
        .init(capabilityKey: "session", category: "required-baseline", surface: "cross-surface"),
        .init(capabilityKey: "credential", category: "required-baseline", surface: "control-plane"),
        .init(capabilityKey: "provider.webhook", category: "required-baseline", surface: "control-plane"),
        .init(capabilityKey: "provider.event-normalization", category: "required-baseline", surface: "control-plane"),
        .init(capabilityKey: "health", category: "required-baseline", surface: "control-plane"),
        .init(capabilityKey: "media.audio", category: "required-baseline", surface: "runtime-bridge"),
        .init(capabilityKey: "media.video", category: "required-baseline", surface: "runtime-bridge"),
        .init(capabilityKey: "live.broadcast", category: "required-baseline", surface: "cross-surface"),
        .init(capabilityKey: "live.audience", category: "required-baseline", surface: "cross-surface"),
        .init(capabilityKey: "screen-share", category: "optional-advanced", surface: "runtime-bridge"),
        .init(capabilityKey: "recording", category: "optional-advanced", surface: "control-plane"),
        .init(capabilityKey: "artifact", category: "optional-advanced", surface: "control-plane"),
        .init(capabilityKey: "cloud-mix", category: "optional-advanced", surface: "control-plane"),
        .init(capabilityKey: "cdn-relay", category: "optional-advanced", surface: "control-plane"),
        .init(capabilityKey: "data-channel", category: "optional-advanced", surface: "runtime-bridge"),
        .init(capabilityKey: "transcription", category: "optional-advanced", surface: "control-plane"),
        .init(capabilityKey: "beauty", category: "optional-advanced", surface: "runtime-bridge"),
        .init(capabilityKey: "spatial-audio", category: "optional-advanced", surface: "runtime-bridge"),
        .init(capabilityKey: "e2ee", category: "optional-advanced", surface: "runtime-bridge"),
        .init(capabilityKey: "provider.active-query", category: "optional-advanced", surface: "control-plane"),
    ]

public static func getRtcCapabilityCatalog() -> [RtcCapabilityCatalogEntry] {
        entries
    }

    public static func getRtcCapabilityDescriptor(_ capabilityKey: String) -> RtcCapabilityCatalogEntry? {
        entries.first { $0.capabilityKey == capabilityKey }
    }

}
