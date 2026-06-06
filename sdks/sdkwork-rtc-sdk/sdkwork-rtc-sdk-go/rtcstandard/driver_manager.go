package rtcstandard

type RtcDriverManager struct{}

func (manager RtcDriverManager) resolveSelection(request RtcProviderSelectionRequest, defaultProviderKey string) RtcProviderSelection {
    return ResolveRtcProviderSelection(request, defaultProviderKey)
}

func (manager RtcDriverManager) ResolveSelection(request RtcProviderSelectionRequest, defaultProviderKey string) RtcProviderSelection {
    return manager.resolveSelection(request, defaultProviderKey)
}

func (manager RtcDriverManager) describeProviderSupport(providerKey string) RtcProviderSupport {
    official := GetRtcProviderByProviderKey(providerKey) != nil
    activation := GetRtcProviderActivationByProviderKey(providerKey)

    return CreateRtcProviderSupportState(RtcProviderSupportStateRequest{
        ProviderKey: providerKey,
        Builtin:     activation != nil && activation.Builtin,
        Official:    official,
        Registered:  activation != nil && activation.RuntimeBridge,
    })
}

func (manager RtcDriverManager) DescribeProviderSupport(providerKey string) RtcProviderSupport {
    return manager.describeProviderSupport(providerKey)
}

func (manager RtcDriverManager) listProviderSupport() []RtcProviderSupport {
    supports := make([]RtcProviderSupport, 0, len(OFFICIAL_RTC_PROVIDERS))
    for _, entry := range OFFICIAL_RTC_PROVIDERS {
        supports = append(supports, manager.describeProviderSupport(entry.ProviderKey))
    }
    return supports
}

func (manager RtcDriverManager) ListProviderSupport() []RtcProviderSupport {
    return manager.listProviderSupport()
}
