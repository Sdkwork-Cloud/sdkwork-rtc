package com.sdkwork.rtc.metadata

data class RtcProviderPackageCatalogEntry(
    val providerKey: String,
    val pluginId: String,
    val driverId: String,
    val packageIdentity: String,
    val manifestPath: String,
    val readmePath: String,
    val sourcePath: String,
    val sourceSymbol: String,
    val builtin: Boolean,
    val rootPublic: Boolean,
    val status: String,
    val runtimeBridgeStatus: String,
)

object RtcProviderPackageCatalog {
    val entries: List<RtcProviderPackageCatalogEntry> = listOf(
        RtcProviderPackageCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "com.sdkwork:rtc-sdk-provider-volcengine", "providers/rtc-sdk-provider-volcengine/build.gradle.kts", "providers/rtc-sdk-provider-volcengine/README.md", "providers/rtc-sdk-provider-volcengine/src/main/kotlin/com/sdkwork/rtc/provider/volcengine/RtcProviderVolcenginePackageContract.kt", "RtcProviderVolcenginePackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "com.sdkwork:rtc-sdk-provider-aliyun", "providers/rtc-sdk-provider-aliyun/build.gradle.kts", "providers/rtc-sdk-provider-aliyun/README.md", "providers/rtc-sdk-provider-aliyun/src/main/kotlin/com/sdkwork/rtc/provider/aliyun/RtcProviderAliyunPackageContract.kt", "RtcProviderAliyunPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "com.sdkwork:rtc-sdk-provider-tencent", "providers/rtc-sdk-provider-tencent/build.gradle.kts", "providers/rtc-sdk-provider-tencent/README.md", "providers/rtc-sdk-provider-tencent/src/main/kotlin/com/sdkwork/rtc/provider/tencent/RtcProviderTencentPackageContract.kt", "RtcProviderTencentPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "com.sdkwork:rtc-sdk-provider-agora", "providers/rtc-sdk-provider-agora/build.gradle.kts", "providers/rtc-sdk-provider-agora/README.md", "providers/rtc-sdk-provider-agora/src/main/kotlin/com/sdkwork/rtc/provider/agora/RtcProviderAgoraPackageContract.kt", "RtcProviderAgoraPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "com.sdkwork:rtc-sdk-provider-zego", "providers/rtc-sdk-provider-zego/build.gradle.kts", "providers/rtc-sdk-provider-zego/README.md", "providers/rtc-sdk-provider-zego/src/main/kotlin/com/sdkwork/rtc/provider/zego/RtcProviderZegoPackageContract.kt", "RtcProviderZegoPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "com.sdkwork:rtc-sdk-provider-livekit", "providers/rtc-sdk-provider-livekit/build.gradle.kts", "providers/rtc-sdk-provider-livekit/README.md", "providers/rtc-sdk-provider-livekit/src/main/kotlin/com/sdkwork/rtc/provider/livekit/RtcProviderLivekitPackageContract.kt", "RtcProviderLivekitPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "com.sdkwork:rtc-sdk-provider-twilio", "providers/rtc-sdk-provider-twilio/build.gradle.kts", "providers/rtc-sdk-provider-twilio/README.md", "providers/rtc-sdk-provider-twilio/src/main/kotlin/com/sdkwork/rtc/provider/twilio/RtcProviderTwilioPackageContract.kt", "RtcProviderTwilioPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "com.sdkwork:rtc-sdk-provider-jitsi", "providers/rtc-sdk-provider-jitsi/build.gradle.kts", "providers/rtc-sdk-provider-jitsi/README.md", "providers/rtc-sdk-provider-jitsi/src/main/kotlin/com/sdkwork/rtc/provider/jitsi/RtcProviderJitsiPackageContract.kt", "RtcProviderJitsiPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "com.sdkwork:rtc-sdk-provider-janus", "providers/rtc-sdk-provider-janus/build.gradle.kts", "providers/rtc-sdk-provider-janus/README.md", "providers/rtc-sdk-provider-janus/src/main/kotlin/com/sdkwork/rtc/provider/janus/RtcProviderJanusPackageContract.kt", "RtcProviderJanusPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "com.sdkwork:rtc-sdk-provider-mediasoup", "providers/rtc-sdk-provider-mediasoup/build.gradle.kts", "providers/rtc-sdk-provider-mediasoup/README.md", "providers/rtc-sdk-provider-mediasoup/src/main/kotlin/com/sdkwork/rtc/provider/mediasoup/RtcProviderMediasoupPackageContract.kt", "RtcProviderMediasoupPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
    )

fun getRtcProviderPackageByProviderKey(providerKey: String): RtcProviderPackageCatalogEntry? =
        entries.firstOrNull { it.providerKey == providerKey }

    fun getRtcProviderPackageByPackageIdentity(packageIdentity: String): RtcProviderPackageCatalogEntry? =
        entries.firstOrNull { it.packageIdentity == packageIdentity }

}
