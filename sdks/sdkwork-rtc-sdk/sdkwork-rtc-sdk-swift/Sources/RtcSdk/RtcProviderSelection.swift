public enum RtcProviderSelectionSource: String {
    case provider_url = "provider_url"
    case provider_key = "provider_key"
    case tenant_override = "tenant_override"
    case deployment_profile = "deployment_profile"
    case default_provider = "default_provider"
}

public struct ParsedRtcProviderUrl {
    public let providerKey: String
    public let rawUrl: String

    public init(providerKey: String, rawUrl: String) {
        self.providerKey = providerKey
        self.rawUrl = rawUrl
    }
}

public struct RtcProviderSelectionRequest {
    public let providerUrl: String?
    public let providerKey: String?
    public let tenantOverrideProviderKey: String?
    public let deploymentProfileProviderKey: String?

    public init(
        providerUrl: String? = nil,
        providerKey: String? = nil,
        tenantOverrideProviderKey: String? = nil,
        deploymentProfileProviderKey: String? = nil
    ) {
        self.providerUrl = providerUrl
        self.providerKey = providerKey
        self.tenantOverrideProviderKey = tenantOverrideProviderKey
        self.deploymentProfileProviderKey = deploymentProfileProviderKey
    }
}

public struct RtcProviderSelection {
    public let providerKey: String
    public let source: RtcProviderSelectionSource

    public static let rtcProviderSelectionSources: [String] = [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ]

    public static let rtcProviderSelectionPrecedence: [String] = [
        "provider_url",
        "provider_key",
        "tenant_override",
        "deployment_profile",
        "default_provider",
    ]

    public static func parseRtcProviderUrl(_ providerUrl: String) -> ParsedRtcProviderUrl {
        let trimmed = providerUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.hasPrefix("rtc:"), let delimiter = trimmed.range(of: "://") else {
            fatalError("Invalid RTC provider URL: \(providerUrl)")
        }

        return ParsedRtcProviderUrl(
            providerKey: String(trimmed[trimmed.index(trimmed.startIndex, offsetBy: 4)..<delimiter.lowerBound]).lowercased(),
            rawUrl: providerUrl
        )
    }

    public static func resolveRtcProviderSelection(
        request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) -> RtcProviderSelection {
        if let providerUrl = request.providerUrl, hasText(providerUrl) {
            return RtcProviderSelection(
                providerKey: parseRtcProviderUrl(providerUrl).providerKey,
                source: .provider_url
            )
        }

        if let providerKey = request.providerKey, hasText(providerKey) {
            return RtcProviderSelection(
                providerKey: providerKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .provider_key
            )
        }

        if let tenantOverrideProviderKey = request.tenantOverrideProviderKey, hasText(tenantOverrideProviderKey) {
            return RtcProviderSelection(
                providerKey: tenantOverrideProviderKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .tenant_override
            )
        }

        if let deploymentProfileProviderKey = request.deploymentProfileProviderKey, hasText(deploymentProfileProviderKey) {
            return RtcProviderSelection(
                providerKey: deploymentProfileProviderKey.trimmingCharacters(in: .whitespacesAndNewlines),
                source: .deployment_profile
            )
        }

        return RtcProviderSelection(
            providerKey: defaultProviderKey,
            source: .default_provider
        )
    }

    private static func hasText(_ value: String) -> Bool {
        !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
