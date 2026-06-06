package com.sdkwork.rtc.metadata

enum class RtcProviderSelectionSource {
    provider_url,
    provider_key,
    tenant_override,
    deployment_profile,
    default_provider,
}

data class ParsedRtcProviderUrl(
    val providerKey: String,
    val rawUrl: String,
)

data class RtcProviderSelection(
    val providerKey: String,
    val source: RtcProviderSelectionSource,
)

data class RtcProviderSelectionRequest(
    val providerUrl: String? = null,
    val providerKey: String? = null,
    val tenantOverrideProviderKey: String? = null,
    val deploymentProfileProviderKey: String? = null,
)

val RTC_PROVIDER_SELECTION_SOURCES: List<String> = listOf(
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
)

val RTC_PROVIDER_SELECTION_PRECEDENCE: List<String> = listOf(
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
)

private fun hasRtcProviderSelectionText(value: String?): Boolean = value != null && value.isNotBlank()

fun parseRtcProviderUrl(providerUrl: String): ParsedRtcProviderUrl {
    val trimmed = providerUrl.trim()
    require(trimmed.startsWith("rtc:") && trimmed.contains("://")) {
        "Invalid RTC provider URL: $providerUrl"
    }

    return ParsedRtcProviderUrl(
        providerKey = trimmed.substring(4, trimmed.indexOf("://")).lowercase(),
        rawUrl = providerUrl,
    )
}

fun resolveRtcProviderSelection(
    request: RtcProviderSelectionRequest = RtcProviderSelectionRequest(),
    defaultProviderKey: String = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
): RtcProviderSelection {
    if (hasRtcProviderSelectionText(request.providerUrl)) {
        return RtcProviderSelection(
            providerKey = parseRtcProviderUrl(request.providerUrl!!).providerKey,
            source = RtcProviderSelectionSource.provider_url,
        )
    }

    if (hasRtcProviderSelectionText(request.providerKey)) {
        return RtcProviderSelection(
            providerKey = request.providerKey!!.trim(),
            source = RtcProviderSelectionSource.provider_key,
        )
    }

    if (hasRtcProviderSelectionText(request.tenantOverrideProviderKey)) {
        return RtcProviderSelection(
            providerKey = request.tenantOverrideProviderKey!!.trim(),
            source = RtcProviderSelectionSource.tenant_override,
        )
    }

    if (hasRtcProviderSelectionText(request.deploymentProfileProviderKey)) {
        return RtcProviderSelection(
            providerKey = request.deploymentProfileProviderKey!!.trim(),
            source = RtcProviderSelectionSource.deployment_profile,
        )
    }

    return RtcProviderSelection(
        providerKey = defaultProviderKey,
        source = RtcProviderSelectionSource.default_provider,
    )
}
