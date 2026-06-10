package com.sdkwork.rtc.metadata

data class RtcCapabilityCatalogEntry(
    val capabilityKey: String,
    val category: String,
    val surface: String,
)

object RtcCapabilityCatalog {
    val entries: List<RtcCapabilityCatalogEntry> = listOf(
        RtcCapabilityCatalogEntry("session", "required-baseline", "cross-surface"),
        RtcCapabilityCatalogEntry("credential", "required-baseline", "control-plane"),
        RtcCapabilityCatalogEntry("provider.webhook", "required-baseline", "control-plane"),
        RtcCapabilityCatalogEntry("provider.event-normalization", "required-baseline", "control-plane"),
        RtcCapabilityCatalogEntry("health", "required-baseline", "control-plane"),
        RtcCapabilityCatalogEntry("media.audio", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("media.video", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("live.broadcast", "required-baseline", "cross-surface"),
        RtcCapabilityCatalogEntry("live.audience", "required-baseline", "cross-surface"),
        RtcCapabilityCatalogEntry("screen-share", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("recording", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("artifact", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("cloud-mix", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("cdn-relay", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("data-channel", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("transcription", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("beauty", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("spatial-audio", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("e2ee", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("provider.active-query", "optional-advanced", "control-plane"),
    )

fun getRtcCapabilityCatalog(): List<RtcCapabilityCatalogEntry> = entries

    fun getRtcCapabilityDescriptor(capabilityKey: String): RtcCapabilityCatalogEntry? =
        entries.firstOrNull { it.capabilityKey == capabilityKey }

}
