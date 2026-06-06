public struct RtcProviderExtensionCatalogEntry {
    public let extensionKey: String
    public let providerKey: String
    public let displayName: String
    public let surface: String
    public let access: String
    public let status: String
}

public enum RtcProviderExtensionCatalog {
    public static let recognizedSurfaces: [String] = [
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    ]

    public static let recognizedAccessModes: [String] = [
        "unwrap-only",
        "extension-object",
    ]

    public static let recognizedStatuses: [String] = [
        "reference-baseline",
        "reserved",
    ]

    public static let entries: [RtcProviderExtensionCatalogEntry] = [
        .init(extensionKey: "volcengine.native-client", providerKey: "volcengine", displayName: "Volcengine Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reference-baseline"),
        .init(extensionKey: "aliyun.native-client", providerKey: "aliyun", displayName: "Aliyun Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reference-baseline"),
        .init(extensionKey: "tencent.native-client", providerKey: "tencent", displayName: "Tencent Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reference-baseline"),
        .init(extensionKey: "agora.native-client", providerKey: "agora", displayName: "Agora Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved"),
        .init(extensionKey: "zego.native-client", providerKey: "zego", displayName: "ZEGO Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved"),
        .init(extensionKey: "livekit.native-client", providerKey: "livekit", displayName: "LiveKit Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved"),
        .init(extensionKey: "twilio.native-client", providerKey: "twilio", displayName: "Twilio Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved"),
        .init(extensionKey: "jitsi.native-client", providerKey: "jitsi", displayName: "Jitsi Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved"),
        .init(extensionKey: "janus.native-client", providerKey: "janus", displayName: "Janus Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved"),
        .init(extensionKey: "mediasoup.native-client", providerKey: "mediasoup", displayName: "mediasoup Native Client", surface: "runtime-bridge", access: "unwrap-only", status: "reserved"),
    ]

public static func getRtcProviderExtensionCatalog() -> [RtcProviderExtensionCatalogEntry] {
        entries
    }

    public static func getRtcProviderExtensionDescriptor(_ extensionKey: String) -> RtcProviderExtensionCatalogEntry? {
        entries.first { $0.extensionKey == extensionKey }
    }

    public static func getRtcProviderExtensionsForProvider(_ providerKey: String) -> [RtcProviderExtensionCatalogEntry] {
        entries.filter { $0.providerKey == providerKey }
    }

    public static func getRtcProviderExtensions(_ extensionKeys: [String]) -> [RtcProviderExtensionCatalogEntry] {
        var resolved: [RtcProviderExtensionCatalogEntry] = []
        for extensionKey in extensionKeys {
            if let entry = getRtcProviderExtensionDescriptor(extensionKey) {
                resolved.append(entry)
            }
        }

        return resolved
    }

    public static func hasRtcProviderExtension(_ extensionKeys: [String], _ extensionKey: String) -> Bool {
        extensionKeys.contains(extensionKey) && getRtcProviderExtensionDescriptor(extensionKey) != nil
    }

}
