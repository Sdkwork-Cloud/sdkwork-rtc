package com.sdkwork.rtc.metadata

data class RtcProviderCatalogEntry(
    val providerKey: String,
    val pluginId: String,
    val driverId: String,
    val defaultSelected: Boolean,
)

object RtcProviderCatalog {
    const val DEFAULT_RTC_PROVIDER_KEY: String = "volcengine"

    val entries: List<RtcProviderCatalogEntry> = listOf(
        RtcProviderCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", true),
        RtcProviderCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", false),
        RtcProviderCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", false),
        RtcProviderCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", false),
        RtcProviderCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", false),
        RtcProviderCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", false),
        RtcProviderCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", false),
        RtcProviderCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", false),
        RtcProviderCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", false),
        RtcProviderCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", false),
    )

fun getRtcProviderByProviderKey(providerKey: String): RtcProviderCatalogEntry? =
        entries.firstOrNull { it.providerKey == providerKey }

}
