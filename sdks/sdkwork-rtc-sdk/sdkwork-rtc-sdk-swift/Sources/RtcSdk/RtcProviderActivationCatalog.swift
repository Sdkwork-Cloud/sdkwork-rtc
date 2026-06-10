public struct RtcProviderActivationCatalogEntry {
    public let providerKey: String
    public let pluginId: String
    public let driverId: String
    public let activationStatus: String
    public let runtimeBridge: Bool
    public let rootPublic: Bool
    public let packageBoundary: Bool
    public let builtin: Bool
    public let packageIdentity: String
}

public enum RtcProviderActivationCatalog {
    public static let recognizedActivationStatuses: [String] = [
        "package-boundary",
        "control-metadata-only",
    ]

    public static let entries: [RtcProviderActivationCatalogEntry] = [
        .init(providerKey: "volcengine", pluginId: "rtc-volcengine", driverId: "sdkwork-rtc-driver-volcengine", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "RtcSdkProviderVolcengine"),
        .init(providerKey: "aliyun", pluginId: "rtc-aliyun", driverId: "sdkwork-rtc-driver-aliyun", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "RtcSdkProviderAliyun"),
        .init(providerKey: "tencent", pluginId: "rtc-tencent", driverId: "sdkwork-rtc-driver-tencent", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "RtcSdkProviderTencent"),
        .init(providerKey: "agora", pluginId: "rtc-agora", driverId: "sdkwork-rtc-driver-agora", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "RtcSdkProviderAgora"),
        .init(providerKey: "zego", pluginId: "rtc-zego", driverId: "sdkwork-rtc-driver-zego", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "RtcSdkProviderZego"),
        .init(providerKey: "livekit", pluginId: "rtc-livekit", driverId: "sdkwork-rtc-driver-livekit", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: true, packageIdentity: "RtcSdkProviderLivekit"),
        .init(providerKey: "twilio", pluginId: "rtc-twilio", driverId: "sdkwork-rtc-driver-twilio", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "RtcSdkProviderTwilio"),
        .init(providerKey: "jitsi", pluginId: "rtc-jitsi", driverId: "sdkwork-rtc-driver-jitsi", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "RtcSdkProviderJitsi"),
        .init(providerKey: "janus", pluginId: "rtc-janus", driverId: "sdkwork-rtc-driver-janus", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "RtcSdkProviderJanus"),
        .init(providerKey: "mediasoup", pluginId: "rtc-mediasoup", driverId: "sdkwork-rtc-driver-mediasoup", activationStatus: "control-metadata-only", runtimeBridge: false, rootPublic: false, packageBoundary: false, builtin: false, packageIdentity: "RtcSdkProviderMediasoup"),
    ]

public static func getRtcProviderActivationByProviderKey(_ providerKey: String) -> RtcProviderActivationCatalogEntry? {
        entries.first { $0.providerKey == providerKey }
    }

}
