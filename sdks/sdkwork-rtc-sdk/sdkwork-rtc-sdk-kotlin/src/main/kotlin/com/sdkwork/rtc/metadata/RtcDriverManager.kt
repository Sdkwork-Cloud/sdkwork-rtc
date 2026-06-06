package com.sdkwork.rtc.metadata

class RtcDriverManager {
    fun resolveSelection(
        request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
        defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    ): RtcProviderSelection {
        return resolveRtcProviderSelection(request, defaultProviderKey)
    }

    fun describeProviderSupport(providerKey: String): RtcProviderSupport {
        val official = getRtcProviderByProviderKey(providerKey) != null
        val activation = getRtcProviderActivationByProviderKey(providerKey)

        return createRtcProviderSupportState(
            RtcProviderSupportStateRequest(
                providerKey = providerKey,
                builtin = activation?.builtin ?: false,
                official = official,
                registered = activation?.runtimeBridge ?: false,
            )
        )
    }

    fun listProviderSupport(): List<RtcProviderSupport> {
        return RtcProviderCatalog.entries.map { describeProviderSupport(it.providerKey) }
    }
}
