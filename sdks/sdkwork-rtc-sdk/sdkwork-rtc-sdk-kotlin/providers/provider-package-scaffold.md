# Kotlin Provider Package Scaffold

Reserved provider package scaffold for future Kotlin RTC adapters.

- directory pattern: `providers/rtc-sdk-provider-{providerKey}`
- package pattern: `com.sdkwork:rtc-sdk-provider-{providerKey}`
- manifest file name: `build.gradle.kts`
- readme file name: `README.md`
- source file pattern: `src/main/kotlin/com/sdkwork/rtc/provider/{providerKey}/RtcProvider{providerPascal}PackageContract.kt`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
- source template tokens: `{providerKey}`, `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`

Rules:

- one provider per package boundary
- bind each package to one official providerKey from the assembly-driven provider catalog
- preserve providerKey, pluginId, and driverId alignment with the official provider catalog
- wrap the official vendor SDK instead of re-implementing media runtime
- materialize one metadata-only source stub per provider package boundary before runtime bridge work lands
- keep the package outside the workspace root public API until a verified runtime bridge lands
- keep the status fixed at `future-runtime-bridge-only` until a language-specific runtime bridge is verified
- keep runtime bridge status fixed at `reserved` until the provider package becomes executable
- keep root public exposure fixed at `false` until the provider becomes a verified builtin baseline

| Provider key | Provider pascal | Package identity | Directory path | Manifest path | README path | Source path | Source symbol |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `volcengine` | `Volcengine` | `com.sdkwork:rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/build.gradle.kts` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/src/main/kotlin/com/sdkwork/rtc/provider/volcengine/RtcProviderVolcenginePackageContract.kt` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `com.sdkwork:rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun/build.gradle.kts` | `providers/rtc-sdk-provider-aliyun/README.md` | `providers/rtc-sdk-provider-aliyun/src/main/kotlin/com/sdkwork/rtc/provider/aliyun/RtcProviderAliyunPackageContract.kt` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `com.sdkwork:rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent/build.gradle.kts` | `providers/rtc-sdk-provider-tencent/README.md` | `providers/rtc-sdk-provider-tencent/src/main/kotlin/com/sdkwork/rtc/provider/tencent/RtcProviderTencentPackageContract.kt` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `com.sdkwork:rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora/build.gradle.kts` | `providers/rtc-sdk-provider-agora/README.md` | `providers/rtc-sdk-provider-agora/src/main/kotlin/com/sdkwork/rtc/provider/agora/RtcProviderAgoraPackageContract.kt` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `com.sdkwork:rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego/build.gradle.kts` | `providers/rtc-sdk-provider-zego/README.md` | `providers/rtc-sdk-provider-zego/src/main/kotlin/com/sdkwork/rtc/provider/zego/RtcProviderZegoPackageContract.kt` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `com.sdkwork:rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit/build.gradle.kts` | `providers/rtc-sdk-provider-livekit/README.md` | `providers/rtc-sdk-provider-livekit/src/main/kotlin/com/sdkwork/rtc/provider/livekit/RtcProviderLivekitPackageContract.kt` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `com.sdkwork:rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio/build.gradle.kts` | `providers/rtc-sdk-provider-twilio/README.md` | `providers/rtc-sdk-provider-twilio/src/main/kotlin/com/sdkwork/rtc/provider/twilio/RtcProviderTwilioPackageContract.kt` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `com.sdkwork:rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi/build.gradle.kts` | `providers/rtc-sdk-provider-jitsi/README.md` | `providers/rtc-sdk-provider-jitsi/src/main/kotlin/com/sdkwork/rtc/provider/jitsi/RtcProviderJitsiPackageContract.kt` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `com.sdkwork:rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus/build.gradle.kts` | `providers/rtc-sdk-provider-janus/README.md` | `providers/rtc-sdk-provider-janus/src/main/kotlin/com/sdkwork/rtc/provider/janus/RtcProviderJanusPackageContract.kt` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `com.sdkwork:rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup/build.gradle.kts` | `providers/rtc-sdk-provider-mediasoup/README.md` | `providers/rtc-sdk-provider-mediasoup/src/main/kotlin/com/sdkwork/rtc/provider/mediasoup/RtcProviderMediasoupPackageContract.kt` | `RtcProviderMediasoupPackageContract` |
