# Swift Provider Package Scaffold

Reserved provider package scaffold for future Swift RTC adapters.

- directory pattern: `Providers/RtcSdkProvider{providerPascal}`
- package pattern: `RtcSdkProvider{providerPascal}`
- manifest file name: `Package.swift`
- readme file name: `README.md`
- source file pattern: `Sources/RtcSdkProvider{providerPascal}/RtcProvider{providerPascal}PackageContract.swift`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerPascal}`
- source template tokens: `{providerPascal}`
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
| `volcengine` | `Volcengine` | `RtcSdkProviderVolcengine` | `Providers/RtcSdkProviderVolcengine` | `Providers/RtcSdkProviderVolcengine/Package.swift` | `Providers/RtcSdkProviderVolcengine/README.md` | `Providers/RtcSdkProviderVolcengine/Sources/RtcSdkProviderVolcengine/RtcProviderVolcenginePackageContract.swift` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `RtcSdkProviderAliyun` | `Providers/RtcSdkProviderAliyun` | `Providers/RtcSdkProviderAliyun/Package.swift` | `Providers/RtcSdkProviderAliyun/README.md` | `Providers/RtcSdkProviderAliyun/Sources/RtcSdkProviderAliyun/RtcProviderAliyunPackageContract.swift` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `RtcSdkProviderTencent` | `Providers/RtcSdkProviderTencent` | `Providers/RtcSdkProviderTencent/Package.swift` | `Providers/RtcSdkProviderTencent/README.md` | `Providers/RtcSdkProviderTencent/Sources/RtcSdkProviderTencent/RtcProviderTencentPackageContract.swift` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `RtcSdkProviderAgora` | `Providers/RtcSdkProviderAgora` | `Providers/RtcSdkProviderAgora/Package.swift` | `Providers/RtcSdkProviderAgora/README.md` | `Providers/RtcSdkProviderAgora/Sources/RtcSdkProviderAgora/RtcProviderAgoraPackageContract.swift` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `RtcSdkProviderZego` | `Providers/RtcSdkProviderZego` | `Providers/RtcSdkProviderZego/Package.swift` | `Providers/RtcSdkProviderZego/README.md` | `Providers/RtcSdkProviderZego/Sources/RtcSdkProviderZego/RtcProviderZegoPackageContract.swift` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `RtcSdkProviderLivekit` | `Providers/RtcSdkProviderLivekit` | `Providers/RtcSdkProviderLivekit/Package.swift` | `Providers/RtcSdkProviderLivekit/README.md` | `Providers/RtcSdkProviderLivekit/Sources/RtcSdkProviderLivekit/RtcProviderLivekitPackageContract.swift` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `RtcSdkProviderTwilio` | `Providers/RtcSdkProviderTwilio` | `Providers/RtcSdkProviderTwilio/Package.swift` | `Providers/RtcSdkProviderTwilio/README.md` | `Providers/RtcSdkProviderTwilio/Sources/RtcSdkProviderTwilio/RtcProviderTwilioPackageContract.swift` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `RtcSdkProviderJitsi` | `Providers/RtcSdkProviderJitsi` | `Providers/RtcSdkProviderJitsi/Package.swift` | `Providers/RtcSdkProviderJitsi/README.md` | `Providers/RtcSdkProviderJitsi/Sources/RtcSdkProviderJitsi/RtcProviderJitsiPackageContract.swift` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `RtcSdkProviderJanus` | `Providers/RtcSdkProviderJanus` | `Providers/RtcSdkProviderJanus/Package.swift` | `Providers/RtcSdkProviderJanus/README.md` | `Providers/RtcSdkProviderJanus/Sources/RtcSdkProviderJanus/RtcProviderJanusPackageContract.swift` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `RtcSdkProviderMediasoup` | `Providers/RtcSdkProviderMediasoup` | `Providers/RtcSdkProviderMediasoup/Package.swift` | `Providers/RtcSdkProviderMediasoup/README.md` | `Providers/RtcSdkProviderMediasoup/Sources/RtcSdkProviderMediasoup/RtcProviderMediasoupPackageContract.swift` | `RtcProviderMediasoupPackageContract` |
