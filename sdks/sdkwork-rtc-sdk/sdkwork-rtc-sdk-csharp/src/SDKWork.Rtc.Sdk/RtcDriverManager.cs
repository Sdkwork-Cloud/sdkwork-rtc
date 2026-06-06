namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed class RtcDriverManager
{
    public RtcProviderSelection ResolveSelection(
        RtcProviderSelectionRequest? request = null,
        string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
    )
    {
        return RtcProviderSelection.ResolveRtcProviderSelection(request, defaultProviderKey);
    }

    public RtcProviderSupport DescribeProviderSupport(string providerKey)
    {
        var official = RtcProviderCatalog.GetRtcProviderByProviderKey(providerKey) is not null;
        var activation = RtcProviderActivationCatalog.GetRtcProviderActivationByProviderKey(providerKey);

        return RtcProviderSupport.CreateRtcProviderSupportState(
            new RtcProviderSupportStateRequest(
                providerKey,
                activation?.builtin ?? false,
                official,
                activation?.runtimeBridge ?? false
            )
        );
    }

    public IReadOnlyList<RtcProviderSupport> ListProviderSupport()
    {
        return RtcProviderCatalog.Entries
            .Select(entry => DescribeProviderSupport(entry.providerKey))
            .ToArray();
    }
}
