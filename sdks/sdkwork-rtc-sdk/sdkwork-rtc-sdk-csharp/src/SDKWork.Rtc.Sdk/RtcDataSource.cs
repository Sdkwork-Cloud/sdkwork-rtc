namespace Sdkwork.Rtc.Sdk;

public sealed record RtcDataSourceOptions(
    string? providerUrl = null,
    string? providerKey = null,
    string? tenantOverrideProviderKey = null,
    string? deploymentProfileProviderKey = null,
    string defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY
);

public sealed class RtcDataSource
{
    private readonly RtcDataSourceOptions _options;
    private readonly RtcDriverManager _driverManager;

    public RtcDataSource(
        RtcDataSourceOptions? options = null,
        RtcDriverManager? driverManager = null
    )
    {
        _options = options ?? new RtcDataSourceOptions();
        _driverManager = driverManager ?? new RtcDriverManager();
    }

    public RtcProviderSelection DescribeSelection(RtcDataSourceOptions? overrides = null)
    {
        var merged = merge(_options, overrides);
        return _driverManager.ResolveSelection(
            new RtcProviderSelectionRequest(
                merged.providerUrl,
                merged.providerKey,
                merged.tenantOverrideProviderKey,
                merged.deploymentProfileProviderKey
            ),
            merged.defaultProviderKey
        );
    }

    public RtcProviderSupport DescribeProviderSupport(RtcDataSourceOptions? overrides = null)
    {
        return _driverManager.DescribeProviderSupport(DescribeSelection(overrides).providerKey);
    }

    public IReadOnlyList<RtcProviderSupport> ListProviderSupport()
    {
        return _driverManager.ListProviderSupport();
    }

    private static RtcDataSourceOptions merge(
        RtcDataSourceOptions baseOptions,
        RtcDataSourceOptions? overrides
    )
    {
        if (overrides is null)
        {
            return baseOptions;
        }

        return new RtcDataSourceOptions(
            overrides.providerUrl ?? baseOptions.providerUrl,
            overrides.providerKey ?? baseOptions.providerKey,
            overrides.tenantOverrideProviderKey ?? baseOptions.tenantOverrideProviderKey,
            overrides.deploymentProfileProviderKey ?? baseOptions.deploymentProfileProviderKey,
            string.IsNullOrWhiteSpace(overrides.defaultProviderKey)
                ? baseOptions.defaultProviderKey
                : overrides.defaultProviderKey
        );
    }
}
