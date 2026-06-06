public struct RtcProviderPackageCatalogEntry {
    public let providerKey: String
    public let pluginId: String
    public let driverId: String
    public let packageIdentity: String
    public let manifestPath: String
    public let readmePath: String
    public let sourcePath: String
    public let sourceSymbol: String
    public let builtin: Bool
    public let rootPublic: Bool
    public let status: String
    public let runtimeBridgeStatus: String
}

public enum RtcProviderPackageCatalog {
    public static let entries: [RtcProviderPackageCatalogEntry] = [
        .init(providerKey: "volcengine", pluginId: "rtc-volcengine", driverId: "sdkwork-rtc-driver-volcengine", packageIdentity: "RtcSdkProviderVolcengine", manifestPath: "Providers/RtcSdkProviderVolcengine/Package.swift", readmePath: "Providers/RtcSdkProviderVolcengine/README.md", sourcePath: "Providers/RtcSdkProviderVolcengine/Sources/RtcSdkProviderVolcengine/RtcProviderVolcenginePackageContract.swift", sourceSymbol: "RtcProviderVolcenginePackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "aliyun", pluginId: "rtc-aliyun", driverId: "sdkwork-rtc-driver-aliyun", packageIdentity: "RtcSdkProviderAliyun", manifestPath: "Providers/RtcSdkProviderAliyun/Package.swift", readmePath: "Providers/RtcSdkProviderAliyun/README.md", sourcePath: "Providers/RtcSdkProviderAliyun/Sources/RtcSdkProviderAliyun/RtcProviderAliyunPackageContract.swift", sourceSymbol: "RtcProviderAliyunPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "tencent", pluginId: "rtc-tencent", driverId: "sdkwork-rtc-driver-tencent", packageIdentity: "RtcSdkProviderTencent", manifestPath: "Providers/RtcSdkProviderTencent/Package.swift", readmePath: "Providers/RtcSdkProviderTencent/README.md", sourcePath: "Providers/RtcSdkProviderTencent/Sources/RtcSdkProviderTencent/RtcProviderTencentPackageContract.swift", sourceSymbol: "RtcProviderTencentPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "agora", pluginId: "rtc-agora", driverId: "sdkwork-rtc-driver-agora", packageIdentity: "RtcSdkProviderAgora", manifestPath: "Providers/RtcSdkProviderAgora/Package.swift", readmePath: "Providers/RtcSdkProviderAgora/README.md", sourcePath: "Providers/RtcSdkProviderAgora/Sources/RtcSdkProviderAgora/RtcProviderAgoraPackageContract.swift", sourceSymbol: "RtcProviderAgoraPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "zego", pluginId: "rtc-zego", driverId: "sdkwork-rtc-driver-zego", packageIdentity: "RtcSdkProviderZego", manifestPath: "Providers/RtcSdkProviderZego/Package.swift", readmePath: "Providers/RtcSdkProviderZego/README.md", sourcePath: "Providers/RtcSdkProviderZego/Sources/RtcSdkProviderZego/RtcProviderZegoPackageContract.swift", sourceSymbol: "RtcProviderZegoPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "livekit", pluginId: "rtc-livekit", driverId: "sdkwork-rtc-driver-livekit", packageIdentity: "RtcSdkProviderLivekit", manifestPath: "Providers/RtcSdkProviderLivekit/Package.swift", readmePath: "Providers/RtcSdkProviderLivekit/README.md", sourcePath: "Providers/RtcSdkProviderLivekit/Sources/RtcSdkProviderLivekit/RtcProviderLivekitPackageContract.swift", sourceSymbol: "RtcProviderLivekitPackageContract", builtin: true, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "twilio", pluginId: "rtc-twilio", driverId: "sdkwork-rtc-driver-twilio", packageIdentity: "RtcSdkProviderTwilio", manifestPath: "Providers/RtcSdkProviderTwilio/Package.swift", readmePath: "Providers/RtcSdkProviderTwilio/README.md", sourcePath: "Providers/RtcSdkProviderTwilio/Sources/RtcSdkProviderTwilio/RtcProviderTwilioPackageContract.swift", sourceSymbol: "RtcProviderTwilioPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "jitsi", pluginId: "rtc-jitsi", driverId: "sdkwork-rtc-driver-jitsi", packageIdentity: "RtcSdkProviderJitsi", manifestPath: "Providers/RtcSdkProviderJitsi/Package.swift", readmePath: "Providers/RtcSdkProviderJitsi/README.md", sourcePath: "Providers/RtcSdkProviderJitsi/Sources/RtcSdkProviderJitsi/RtcProviderJitsiPackageContract.swift", sourceSymbol: "RtcProviderJitsiPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "janus", pluginId: "rtc-janus", driverId: "sdkwork-rtc-driver-janus", packageIdentity: "RtcSdkProviderJanus", manifestPath: "Providers/RtcSdkProviderJanus/Package.swift", readmePath: "Providers/RtcSdkProviderJanus/README.md", sourcePath: "Providers/RtcSdkProviderJanus/Sources/RtcSdkProviderJanus/RtcProviderJanusPackageContract.swift", sourceSymbol: "RtcProviderJanusPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
        .init(providerKey: "mediasoup", pluginId: "rtc-mediasoup", driverId: "sdkwork-rtc-driver-mediasoup", packageIdentity: "RtcSdkProviderMediasoup", manifestPath: "Providers/RtcSdkProviderMediasoup/Package.swift", readmePath: "Providers/RtcSdkProviderMediasoup/README.md", sourcePath: "Providers/RtcSdkProviderMediasoup/Sources/RtcSdkProviderMediasoup/RtcProviderMediasoupPackageContract.swift", sourceSymbol: "RtcProviderMediasoupPackageContract", builtin: false, rootPublic: false, status: "future-runtime-bridge-only", runtimeBridgeStatus: "reserved"),
    ]

public static func getRtcProviderPackageByProviderKey(_ providerKey: String) -> RtcProviderPackageCatalogEntry? {
        entries.first { $0.providerKey == providerKey }
    }

    public static func getRtcProviderPackageByPackageIdentity(_ packageIdentity: String) -> RtcProviderPackageCatalogEntry? {
        entries.first { $0.packageIdentity == packageIdentity }
    }

}
