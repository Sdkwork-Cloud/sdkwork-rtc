package rtcstandard

type RtcDataSourceOptions struct {
    ProviderUrl                  string
    ProviderKey                  string
    TenantOverrideProviderKey    string
    DeploymentProfileProviderKey string
    DefaultProviderKey           string
}

type RtcDataSource struct {
    options       RtcDataSourceOptions
    driverManager RtcDriverManager
}

func NewRtcDataSourceOptions() RtcDataSourceOptions {
    return RtcDataSourceOptions{
        DefaultProviderKey: DEFAULT_RTC_PROVIDER_KEY,
    }
}

func NewRtcDataSource(options RtcDataSourceOptions, driverManager RtcDriverManager) RtcDataSource {
    if !hasText(options.DefaultProviderKey) {
        options.DefaultProviderKey = DEFAULT_RTC_PROVIDER_KEY
    }

    return RtcDataSource{
        options:       options,
        driverManager: driverManager,
    }
}

func mergeRtcDataSourceOptions(base RtcDataSourceOptions, overrides *RtcDataSourceOptions) RtcDataSourceOptions {
    if overrides == nil {
        return base
    }

    merged := base
    if overrides.ProviderUrl != "" {
        merged.ProviderUrl = overrides.ProviderUrl
    }
    if overrides.ProviderKey != "" {
        merged.ProviderKey = overrides.ProviderKey
    }
    if overrides.TenantOverrideProviderKey != "" {
        merged.TenantOverrideProviderKey = overrides.TenantOverrideProviderKey
    }
    if overrides.DeploymentProfileProviderKey != "" {
        merged.DeploymentProfileProviderKey = overrides.DeploymentProfileProviderKey
    }
    if overrides.DefaultProviderKey != "" {
        merged.DefaultProviderKey = overrides.DefaultProviderKey
    }

    return merged
}

func (dataSource RtcDataSource) describeSelection(overrides *RtcDataSourceOptions) RtcProviderSelection {
    merged := mergeRtcDataSourceOptions(dataSource.options, overrides)
    return dataSource.driverManager.resolveSelection(
        RtcProviderSelectionRequest{
            ProviderUrl:                  merged.ProviderUrl,
            ProviderKey:                  merged.ProviderKey,
            TenantOverrideProviderKey:    merged.TenantOverrideProviderKey,
            DeploymentProfileProviderKey: merged.DeploymentProfileProviderKey,
        },
        merged.DefaultProviderKey,
    )
}

func (dataSource RtcDataSource) DescribeSelection(overrides *RtcDataSourceOptions) RtcProviderSelection {
    return dataSource.describeSelection(overrides)
}

func (dataSource RtcDataSource) describeProviderSupport(overrides *RtcDataSourceOptions) RtcProviderSupport {
    selection := dataSource.describeSelection(overrides)
    return dataSource.driverManager.describeProviderSupport(selection.ProviderKey)
}

func (dataSource RtcDataSource) DescribeProviderSupport(overrides *RtcDataSourceOptions) RtcProviderSupport {
    return dataSource.describeProviderSupport(overrides)
}

func (dataSource RtcDataSource) listProviderSupport() []RtcProviderSupport {
    return dataSource.driverManager.listProviderSupport()
}

func (dataSource RtcDataSource) ListProviderSupport() []RtcProviderSupport {
    return dataSource.listProviderSupport()
}
