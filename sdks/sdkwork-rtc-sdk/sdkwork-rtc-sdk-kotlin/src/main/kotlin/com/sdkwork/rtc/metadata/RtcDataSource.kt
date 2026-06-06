package com.sdkwork.rtc.metadata

data class RtcDataSourceOptions(
    val providerUrl: String? = null,
    val providerKey: String? = null,
    val tenantOverrideProviderKey: String? = null,
    val deploymentProfileProviderKey: String? = null,
    val defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
)

class RtcDataSource(
    private val options: RtcDataSourceOptions = RtcDataSourceOptions(),
    private val driverManager: RtcDriverManager = RtcDriverManager(),
) {
    fun describeSelection(overrides: RtcDataSourceOptions? = null): RtcProviderSelection {
        val merged = merge(options, overrides)
        return driverManager.resolveSelection(
            request = RtcProviderSelectionRequest(
                providerUrl = merged.providerUrl,
                providerKey = merged.providerKey,
                tenantOverrideProviderKey = merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey = merged.deploymentProfileProviderKey,
            ),
            defaultProviderKey = merged.defaultProviderKey,
        )
    }

    fun describeProviderSupport(overrides: RtcDataSourceOptions? = null): RtcProviderSupport {
        return driverManager.describeProviderSupport(describeSelection(overrides).providerKey)
    }

    fun listProviderSupport(): List<RtcProviderSupport> {
        return driverManager.listProviderSupport()
    }

    private fun merge(
        base: RtcDataSourceOptions,
        overrides: RtcDataSourceOptions?,
    ): RtcDataSourceOptions {
        if (overrides == null) {
            return base
        }

        return RtcDataSourceOptions(
            providerUrl = overrides.providerUrl ?: base.providerUrl,
            providerKey = overrides.providerKey ?: base.providerKey,
            tenantOverrideProviderKey = overrides.tenantOverrideProviderKey ?: base.tenantOverrideProviderKey,
            deploymentProfileProviderKey = overrides.deploymentProfileProviderKey ?: base.deploymentProfileProviderKey,
            defaultProviderKey = overrides.defaultProviderKey.ifBlank { base.defaultProviderKey },
        )
    }
}
