# Java Provider Package Scaffold

Reserved provider package scaffold for future Java RTC adapters.

- directory pattern: `providers/rtc-sdk-provider-{providerKey}`
- package pattern: `com.sdkwork:rtc-sdk-provider-{providerKey}`
- manifest file name: `pom.xml`
- readme file name: `README.md`
- source file pattern: `src/main/java/com/sdkwork/rtc/provider/{providerKey}/RtcProvider{providerPascal}PackageContract.java`
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
| `volcengine` | `Volcengine` | `com.sdkwork:rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/pom.xml` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/src/main/java/com/sdkwork/rtc/provider/volcengine/RtcProviderVolcenginePackageContract.java` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `com.sdkwork:rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun/pom.xml` | `providers/rtc-sdk-provider-aliyun/README.md` | `providers/rtc-sdk-provider-aliyun/src/main/java/com/sdkwork/rtc/provider/aliyun/RtcProviderAliyunPackageContract.java` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `com.sdkwork:rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent/pom.xml` | `providers/rtc-sdk-provider-tencent/README.md` | `providers/rtc-sdk-provider-tencent/src/main/java/com/sdkwork/rtc/provider/tencent/RtcProviderTencentPackageContract.java` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `com.sdkwork:rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora/pom.xml` | `providers/rtc-sdk-provider-agora/README.md` | `providers/rtc-sdk-provider-agora/src/main/java/com/sdkwork/rtc/provider/agora/RtcProviderAgoraPackageContract.java` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `com.sdkwork:rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego/pom.xml` | `providers/rtc-sdk-provider-zego/README.md` | `providers/rtc-sdk-provider-zego/src/main/java/com/sdkwork/rtc/provider/zego/RtcProviderZegoPackageContract.java` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `com.sdkwork:rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit/pom.xml` | `providers/rtc-sdk-provider-livekit/README.md` | `providers/rtc-sdk-provider-livekit/src/main/java/com/sdkwork/rtc/provider/livekit/RtcProviderLivekitPackageContract.java` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `com.sdkwork:rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio/pom.xml` | `providers/rtc-sdk-provider-twilio/README.md` | `providers/rtc-sdk-provider-twilio/src/main/java/com/sdkwork/rtc/provider/twilio/RtcProviderTwilioPackageContract.java` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `com.sdkwork:rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi/pom.xml` | `providers/rtc-sdk-provider-jitsi/README.md` | `providers/rtc-sdk-provider-jitsi/src/main/java/com/sdkwork/rtc/provider/jitsi/RtcProviderJitsiPackageContract.java` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `com.sdkwork:rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus/pom.xml` | `providers/rtc-sdk-provider-janus/README.md` | `providers/rtc-sdk-provider-janus/src/main/java/com/sdkwork/rtc/provider/janus/RtcProviderJanusPackageContract.java` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `com.sdkwork:rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup/pom.xml` | `providers/rtc-sdk-provider-mediasoup/README.md` | `providers/rtc-sdk-provider-mediasoup/src/main/java/com/sdkwork/rtc/provider/mediasoup/RtcProviderMediasoupPackageContract.java` | `RtcProviderMediasoupPackageContract` |
