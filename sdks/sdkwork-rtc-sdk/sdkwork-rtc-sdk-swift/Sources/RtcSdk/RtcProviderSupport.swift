public enum RtcProviderSupportStatus: String {
    case builtin_registered = "builtin_registered"
    case official_registered = "official_registered"
    case official_unregistered = "official_unregistered"
    case unknown = "unknown"
}

public struct RtcProviderSupportStateRequest {
    public let providerKey: String
    public let builtin: Bool
    public let official: Bool
    public let registered: Bool

    public init(
        providerKey: String,
        builtin: Bool,
        official: Bool,
        registered: Bool
    ) {
        self.providerKey = providerKey
        self.builtin = builtin
        self.official = official
        self.registered = registered
    }
}

public struct RtcProviderSupport {
    public let providerKey: String
    public let status: RtcProviderSupportStatus
    public let builtin: Bool
    public let official: Bool
    public let registered: Bool

    public static let rtcProviderSupportStatuses: [String] = [
        "builtin_registered",
        "official_registered",
        "official_unregistered",
        "unknown",
    ]

    public static func resolveRtcProviderSupportStatus(
        _ request: RtcProviderSupportStateRequest
    ) -> RtcProviderSupportStatus {
        if request.official && request.registered {
            return request.builtin ? .builtin_registered : .official_registered
        }

        if request.official {
            return .official_unregistered
        }

        return .unknown
    }

    public static func createRtcProviderSupportState(
        _ request: RtcProviderSupportStateRequest
    ) -> RtcProviderSupport {
        return RtcProviderSupport(
            providerKey: request.providerKey,
            status: resolveRtcProviderSupportStatus(request),
            builtin: request.builtin,
            official: request.official,
            registered: request.registered
        )
    }
}
