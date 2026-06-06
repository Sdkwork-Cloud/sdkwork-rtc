package com.sdkwork.rtc.provider.mediasoup

/**
 * Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
 */
object RtcProviderMediasoupPackageContract {
    const val PROVIDER_KEY: String = "mediasoup"
    const val PLUGIN_ID: String = "rtc-mediasoup"
    const val DRIVER_ID: String = "sdkwork-rtc-driver-mediasoup"
    const val PACKAGE_IDENTITY: String = "com.sdkwork:rtc-sdk-provider-mediasoup"
    const val STATUS: String = "future-runtime-bridge-only"
    const val RUNTIME_BRIDGE_STATUS: String = "reserved"
    const val ROOT_PUBLIC: Boolean = false
}
