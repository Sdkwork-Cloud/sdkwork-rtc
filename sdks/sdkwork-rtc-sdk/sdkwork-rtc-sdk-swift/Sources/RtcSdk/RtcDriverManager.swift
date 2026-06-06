public struct RtcDriverManager {
    public init() {}

    public func resolveSelection(
        request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    ) -> RtcProviderSelection {
        return RtcProviderSelection.resolveRtcProviderSelection(
            request: request,
            defaultProviderKey: defaultProviderKey
        )
    }

    public func describeProviderSupport(providerKey: String) -> RtcProviderSupport {
        let official = RtcProviderCatalog.getRtcProviderByProviderKey(providerKey) != nil
        let activation = RtcProviderActivationCatalog.getRtcProviderActivationByProviderKey(providerKey)

        return RtcProviderSupport.createRtcProviderSupportState(
            .init(
                providerKey: providerKey,
                builtin: activation?.builtin ?? false,
                official: official,
                registered: activation?.runtimeBridge ?? false
            )
        )
    }

    public func listProviderSupport() -> [RtcProviderSupport] {
        RtcProviderCatalog.entries.map { describeProviderSupport(providerKey: $0.providerKey) }
    }
}
