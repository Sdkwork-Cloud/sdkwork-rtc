package com.sdkwork.rtc.metadata

data class RtcProviderExtensionCatalogEntry(
    val extensionKey: String,
    val providerKey: String,
    val displayName: String,
    val surface: String,
    val access: String,
    val status: String,
)

object RtcProviderExtensionCatalog {
    val recognizedSurfaces: List<String> = listOf(
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    )

    val recognizedAccessModes: List<String> = listOf(
        "unwrap-only",
        "extension-object",
    )

    val recognizedStatuses: List<String> = listOf(
        "reference-baseline",
        "reserved",
    )

    val entries: List<RtcProviderExtensionCatalogEntry> = listOf(
        RtcProviderExtensionCatalogEntry("volcengine.native-client", "volcengine", "Volcengine Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        RtcProviderExtensionCatalogEntry("aliyun.native-client", "aliyun", "Aliyun Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        RtcProviderExtensionCatalogEntry("tencent.native-client", "tencent", "Tencent Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        RtcProviderExtensionCatalogEntry("agora.native-client", "agora", "Agora Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("zego.native-client", "zego", "ZEGO Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("livekit.native-client", "livekit", "LiveKit Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("twilio.native-client", "twilio", "Twilio Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("jitsi.native-client", "jitsi", "Jitsi Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("janus.native-client", "janus", "Janus Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("mediasoup.native-client", "mediasoup", "mediasoup Native Client", "runtime-bridge", "unwrap-only", "reserved"),
    )

fun getRtcProviderExtensionCatalog(): List<RtcProviderExtensionCatalogEntry> = entries

    fun getRtcProviderExtensionDescriptor(extensionKey: String): RtcProviderExtensionCatalogEntry? =
        entries.firstOrNull { it.extensionKey == extensionKey }

    fun getRtcProviderExtensionsForProvider(providerKey: String): List<RtcProviderExtensionCatalogEntry> =
        entries.filter { it.providerKey == providerKey }

    fun getRtcProviderExtensions(extensionKeys: List<String>): List<RtcProviderExtensionCatalogEntry> =
        extensionKeys.mapNotNull(::getRtcProviderExtensionDescriptor)

    fun hasRtcProviderExtension(extensionKeys: List<String>, extensionKey: String): Boolean =
        extensionKeys.contains(extensionKey) && getRtcProviderExtensionDescriptor(extensionKey) != null

}
