package com.sdkwork.rtc.provider.janus

/**
 * Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
 */
object RtcProviderJanusPackageContract {
    const val PROVIDER_KEY: String = "janus"
    const val PLUGIN_ID: String = "rtc-janus"
    const val DRIVER_ID: String = "sdkwork-rtc-driver-janus"
    const val PACKAGE_IDENTITY: String = "com.sdkwork:rtc-sdk-provider-janus"
    const val STATUS: String = "future-runtime-bridge-only"
    const val RUNTIME_BRIDGE_STATUS: String = "reserved"
    const val ROOT_PUBLIC: Boolean = false
}
