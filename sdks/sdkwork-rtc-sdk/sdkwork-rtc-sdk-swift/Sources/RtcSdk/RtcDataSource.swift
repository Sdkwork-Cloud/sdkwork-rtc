public struct RtcDataSourceOptions {
    public let providerUrl: String?
    public let providerKey: String?
    public let tenantOverrideProviderKey: String?
    public let deploymentProfileProviderKey: String?
    public let defaultProviderKey: String

    public init(
        providerUrl: String? = nil,
        providerKey: String? = nil,
        tenantOverrideProviderKey: String? = nil,
        deploymentProfileProviderKey: String? = nil,
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) {
        self.providerUrl = providerUrl
        self.providerKey = providerKey
        self.tenantOverrideProviderKey = tenantOverrideProviderKey
        self.deploymentProfileProviderKey = deploymentProfileProviderKey
        self.defaultProviderKey = defaultProviderKey
    }
}

public struct RtcDataSource {
    public let options: RtcDataSourceOptions
    public let driverManager: RtcDriverManager

    public init(
        options: RtcDataSourceOptions = RtcDataSourceOptions(),
        driverManager: RtcDriverManager = RtcDriverManager()
    ) {
        self.options = options
        self.driverManager = driverManager
    }

    public func describeSelection(_ overrides: RtcDataSourceOptions? = nil) -> RtcProviderSelection {
        let merged = merge(options, overrides)
        return driverManager.resolveSelection(
            request: RtcProviderSelectionRequest(
                providerUrl: merged.providerUrl,
                providerKey: merged.providerKey,
                tenantOverrideProviderKey: merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey: merged.deploymentProfileProviderKey
            ),
            defaultProviderKey: merged.defaultProviderKey
        )
    }

    public func describeProviderSupport(_ overrides: RtcDataSourceOptions? = nil) -> RtcProviderSupport {
        let selection = describeSelection(overrides)
        return driverManager.describeProviderSupport(providerKey: selection.providerKey)
    }

    public func listProviderSupport() -> [RtcProviderSupport] {
        driverManager.listProviderSupport()
    }

    private func merge(_ base: RtcDataSourceOptions, _ overrides: RtcDataSourceOptions?) -> RtcDataSourceOptions {
        guard let overrides else {
            return base
        }

        return RtcDataSourceOptions(
            providerUrl: overrides.providerUrl ?? base.providerUrl,
            providerKey: overrides.providerKey ?? base.providerKey,
            tenantOverrideProviderKey: overrides.tenantOverrideProviderKey ?? base.tenantOverrideProviderKey,
            deploymentProfileProviderKey: overrides.deploymentProfileProviderKey ?? base.deploymentProfileProviderKey,
            defaultProviderKey: overrides.defaultProviderKey.isEmpty ? base.defaultProviderKey : overrides.defaultProviderKey
        )
    }
}
