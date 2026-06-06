public struct RtcProviderCatalogEntry {
    public let providerKey: String
    public let pluginId: String
    public let driverId: String
    public let defaultSelected: Bool
}

public enum RtcProviderCatalog {
    public static let DEFAULT_RTC_PROVIDER_KEY: String = "volcengine"

    public static let entries: [RtcProviderCatalogEntry] = [
        .init(providerKey: "volcengine", pluginId: "rtc-volcengine", driverId: "sdkwork-rtc-driver-volcengine", defaultSelected: true),
        .init(providerKey: "aliyun", pluginId: "rtc-aliyun", driverId: "sdkwork-rtc-driver-aliyun", defaultSelected: false),
        .init(providerKey: "tencent", pluginId: "rtc-tencent", driverId: "sdkwork-rtc-driver-tencent", defaultSelected: false),
        .init(providerKey: "agora", pluginId: "rtc-agora", driverId: "sdkwork-rtc-driver-agora", defaultSelected: false),
        .init(providerKey: "zego", pluginId: "rtc-zego", driverId: "sdkwork-rtc-driver-zego", defaultSelected: false),
        .init(providerKey: "livekit", pluginId: "rtc-livekit", driverId: "sdkwork-rtc-driver-livekit", defaultSelected: false),
        .init(providerKey: "twilio", pluginId: "rtc-twilio", driverId: "sdkwork-rtc-driver-twilio", defaultSelected: false),
        .init(providerKey: "jitsi", pluginId: "rtc-jitsi", driverId: "sdkwork-rtc-driver-jitsi", defaultSelected: false),
        .init(providerKey: "janus", pluginId: "rtc-janus", driverId: "sdkwork-rtc-driver-janus", defaultSelected: false),
        .init(providerKey: "mediasoup", pluginId: "rtc-mediasoup", driverId: "sdkwork-rtc-driver-mediasoup", defaultSelected: false),
    ]

public static func getRtcProviderByProviderKey(_ providerKey: String) -> RtcProviderCatalogEntry? {
        entries.first { $0.providerKey == providerKey }
    }

}
