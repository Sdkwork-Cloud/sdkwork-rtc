package com.sdkwork.rtc.metadata

enum class RtcProviderSupportStatus {
    builtin_registered,
    official_registered,
    official_unregistered,
    unknown,
}

data class RtcProviderSupport(
    val providerKey: String,
    val status: RtcProviderSupportStatus,
    val builtin: Boolean,
    val official: Boolean,
    val registered: Boolean,
)

data class RtcProviderSupportStateRequest(
    val providerKey: String,
    val builtin: Boolean,
    val official: Boolean,
    val registered: Boolean,
)

val RTC_PROVIDER_SUPPORT_STATUSES: List<String> = listOf(
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
)

fun resolveRtcProviderSupportStatus(
    request: RtcProviderSupportStateRequest,
): RtcProviderSupportStatus {
    if (request.official && request.registered) {
        return if (request.builtin) {
            RtcProviderSupportStatus.builtin_registered
        } else {
            RtcProviderSupportStatus.official_registered
        }
    }

    if (request.official) {
        return RtcProviderSupportStatus.official_unregistered
    }

    return RtcProviderSupportStatus.unknown
}

fun createRtcProviderSupportState(
    request: RtcProviderSupportStateRequest,
): RtcProviderSupport {
    return RtcProviderSupport(
        providerKey = request.providerKey,
        status = resolveRtcProviderSupportStatus(request),
        builtin = request.builtin,
        official = request.official,
        registered = request.registered,
    )
}
