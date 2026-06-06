package com.sdkwork.rtc.provider.jitsi

/**
 * Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
 */
object RtcProviderJitsiPackageContract {
    const val PROVIDER_KEY: String = "jitsi"
    const val PLUGIN_ID: String = "rtc-jitsi"
    const val DRIVER_ID: String = "sdkwork-rtc-driver-jitsi"
    const val PACKAGE_IDENTITY: String = "com.sdkwork:rtc-sdk-provider-jitsi"
    const val STATUS: String = "future-runtime-bridge-only"
    const val RUNTIME_BRIDGE_STATUS: String = "reserved"
    const val ROOT_PUBLIC: Boolean = false
}
