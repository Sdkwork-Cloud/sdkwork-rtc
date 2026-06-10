package com.sdkwork.rtc.metadata

data class RtcProviderActivationCatalogEntry(
    val providerKey: String,
    val pluginId: String,
    val driverId: String,
    val activationStatus: String,
    val runtimeBridge: Boolean,
    val rootPublic: Boolean,
    val packageBoundary: Boolean,
    val builtin: Boolean,
    val packageIdentity: String,
)

object RtcProviderActivationCatalog {
    val recognizedActivationStatuses: List<String> = listOf(
        "package-boundary",
        "control-metadata-only",
    )

    val entries: List<RtcProviderActivationCatalogEntry> = listOf(
        RtcProviderActivationCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-volcengine"),
        RtcProviderActivationCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-aliyun"),
        RtcProviderActivationCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-tencent"),
        RtcProviderActivationCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-agora"),
        RtcProviderActivationCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-zego"),
        RtcProviderActivationCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "control-metadata-only", false, false, false, true, "com.sdkwork:rtc-sdk-provider-livekit"),
        RtcProviderActivationCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-twilio"),
        RtcProviderActivationCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-jitsi"),
        RtcProviderActivationCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-janus"),
        RtcProviderActivationCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "control-metadata-only", false, false, false, false, "com.sdkwork:rtc-sdk-provider-mediasoup"),
    )

fun getRtcProviderActivationByProviderKey(providerKey: String): RtcProviderActivationCatalogEntry? =
        entries.firstOrNull { it.providerKey == providerKey }

}
