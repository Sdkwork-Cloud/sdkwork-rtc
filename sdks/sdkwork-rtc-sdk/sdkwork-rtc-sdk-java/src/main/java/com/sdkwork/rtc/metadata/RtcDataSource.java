package com.sdkwork.rtc.metadata;

import java.util.List;

final class RtcDataSourceOptions {

  public final String providerUrl;
  public final String providerKey;
  public final String tenantOverrideProviderKey;
  public final String deploymentProfileProviderKey;
  public final String defaultProviderKey;

  public RtcDataSourceOptions() {
    this(null, null, null, null, RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY);
  }

  public RtcDataSourceOptions(
      String providerUrl,
      String providerKey,
      String tenantOverrideProviderKey,
      String deploymentProfileProviderKey,
      String defaultProviderKey
  ) {
    this.providerUrl = providerUrl;
    this.providerKey = providerKey;
    this.tenantOverrideProviderKey = tenantOverrideProviderKey;
    this.deploymentProfileProviderKey = deploymentProfileProviderKey;
    this.defaultProviderKey = defaultProviderKey;
  }
}

public final class RtcDataSource {

  private final RtcDataSourceOptions options;
  private final RtcDriverManager driverManager;

  public RtcDataSource() {
    this(new RtcDataSourceOptions(), new RtcDriverManager());
  }

  public RtcDataSource(
      RtcDataSourceOptions options,
      RtcDriverManager driverManager
  ) {
    this.options = options == null ? new RtcDataSourceOptions() : options;
    this.driverManager = driverManager == null ? new RtcDriverManager() : driverManager;
  }

  public RtcProviderSelection describeSelection() {
    return describeSelection(null);
  }

  public RtcProviderSelection describeSelection(RtcDataSourceOptions overrides) {
    var merged = merge(options, overrides);
    return driverManager.resolveSelection(
        new RtcProviderSelection.RtcProviderSelectionRequest(
            merged.providerUrl,
            merged.providerKey,
            merged.tenantOverrideProviderKey,
            merged.deploymentProfileProviderKey
        ),
        merged.defaultProviderKey
    );
  }

  public RtcProviderSupport describeProviderSupport() {
    return describeProviderSupport(null);
  }

  public RtcProviderSupport describeProviderSupport(RtcDataSourceOptions overrides) {
    return driverManager.describeProviderSupport(describeSelection(overrides).providerKey());
  }

  public List<RtcProviderSupport> listProviderSupport() {
    return driverManager.listProviderSupport();
  }

  private static RtcDataSourceOptions merge(
      RtcDataSourceOptions base,
      RtcDataSourceOptions overrides
  ) {
    if (overrides == null) {
      return base;
    }

    return new RtcDataSourceOptions(
        overrides.providerUrl != null ? overrides.providerUrl : base.providerUrl,
        overrides.providerKey != null ? overrides.providerKey : base.providerKey,
        overrides.tenantOverrideProviderKey != null
            ? overrides.tenantOverrideProviderKey
            : base.tenantOverrideProviderKey,
        overrides.deploymentProfileProviderKey != null
            ? overrides.deploymentProfileProviderKey
            : base.deploymentProfileProviderKey,
        overrides.defaultProviderKey == null || overrides.defaultProviderKey.isBlank()
            ? base.defaultProviderKey
            : overrides.defaultProviderKey
    );
  }
}
