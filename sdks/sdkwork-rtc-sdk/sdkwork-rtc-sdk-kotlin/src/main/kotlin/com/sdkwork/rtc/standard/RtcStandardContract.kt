package com.sdkwork.rtc.standard

object RtcStandardContract {
    const val SYMBOL: String = "RtcStandardContract"
}

interface RtcProviderDriver<TNativeClient> {
    val providerKey: String

    fun createClient(): RtcClient<TNativeClient>
}

interface RtcDriverManager<TNativeClient> {
    fun resolveDriver(providerKey: String): RtcProviderDriver<TNativeClient>
}

interface RtcDataSource<TNativeClient> {
    fun createClient(): RtcClient<TNativeClient>
}

interface RtcClient<TNativeClient> {
    fun join()

    fun leave()

    fun publish(trackId: String)

    fun unpublish(trackId: String)

    fun muteAudio(muted: Boolean)

    fun muteVideo(muted: Boolean)

    fun unwrap(): TNativeClient?
}

interface RtcRuntimeController<TNativeClient> {
    fun join()

    fun leave()

    fun publish(trackId: String)

    fun unpublish(trackId: String)

    fun muteAudio(muted: Boolean)

    fun muteVideo(muted: Boolean)
}
