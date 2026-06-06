# C# Provider Package Scaffold

Reserved provider package scaffold for future C# RTC adapters.

- directory pattern: `providers/Sdkwork.Rtc.Sdk.Provider.{providerPascal}`
- package pattern: `Sdkwork.Rtc.Sdk.Provider.{providerPascal}`
- manifest file name: `Sdkwork.Rtc.Sdk.Provider.{providerPascal}.csproj`
- readme file name: `README.md`
- source file pattern: `src/RtcProvider{providerPascal}PackageContract.cs`
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
| `volcengine` | `Volcengine` | `Sdkwork.Rtc.Sdk.Provider.Volcengine` | `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine` | `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/Sdkwork.Rtc.Sdk.Provider.Volcengine.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/src/RtcProviderVolcenginePackageContract.cs` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `Sdkwork.Rtc.Sdk.Provider.Aliyun` | `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun` | `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/Sdkwork.Rtc.Sdk.Provider.Aliyun.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/src/RtcProviderAliyunPackageContract.cs` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `Sdkwork.Rtc.Sdk.Provider.Tencent` | `providers/Sdkwork.Rtc.Sdk.Provider.Tencent` | `providers/Sdkwork.Rtc.Sdk.Provider.Tencent/Sdkwork.Rtc.Sdk.Provider.Tencent.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Tencent/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Tencent/src/RtcProviderTencentPackageContract.cs` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `Sdkwork.Rtc.Sdk.Provider.Agora` | `providers/Sdkwork.Rtc.Sdk.Provider.Agora` | `providers/Sdkwork.Rtc.Sdk.Provider.Agora/Sdkwork.Rtc.Sdk.Provider.Agora.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Agora/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Agora/src/RtcProviderAgoraPackageContract.cs` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `Sdkwork.Rtc.Sdk.Provider.Zego` | `providers/Sdkwork.Rtc.Sdk.Provider.Zego` | `providers/Sdkwork.Rtc.Sdk.Provider.Zego/Sdkwork.Rtc.Sdk.Provider.Zego.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Zego/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Zego/src/RtcProviderZegoPackageContract.cs` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `Sdkwork.Rtc.Sdk.Provider.Livekit` | `providers/Sdkwork.Rtc.Sdk.Provider.Livekit` | `providers/Sdkwork.Rtc.Sdk.Provider.Livekit/Sdkwork.Rtc.Sdk.Provider.Livekit.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Livekit/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Livekit/src/RtcProviderLivekitPackageContract.cs` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `Sdkwork.Rtc.Sdk.Provider.Twilio` | `providers/Sdkwork.Rtc.Sdk.Provider.Twilio` | `providers/Sdkwork.Rtc.Sdk.Provider.Twilio/Sdkwork.Rtc.Sdk.Provider.Twilio.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Twilio/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Twilio/src/RtcProviderTwilioPackageContract.cs` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `Sdkwork.Rtc.Sdk.Provider.Jitsi` | `providers/Sdkwork.Rtc.Sdk.Provider.Jitsi` | `providers/Sdkwork.Rtc.Sdk.Provider.Jitsi/Sdkwork.Rtc.Sdk.Provider.Jitsi.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Jitsi/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Jitsi/src/RtcProviderJitsiPackageContract.cs` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `Sdkwork.Rtc.Sdk.Provider.Janus` | `providers/Sdkwork.Rtc.Sdk.Provider.Janus` | `providers/Sdkwork.Rtc.Sdk.Provider.Janus/Sdkwork.Rtc.Sdk.Provider.Janus.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Janus/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Janus/src/RtcProviderJanusPackageContract.cs` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `Sdkwork.Rtc.Sdk.Provider.Mediasoup` | `providers/Sdkwork.Rtc.Sdk.Provider.Mediasoup` | `providers/Sdkwork.Rtc.Sdk.Provider.Mediasoup/Sdkwork.Rtc.Sdk.Provider.Mediasoup.csproj` | `providers/Sdkwork.Rtc.Sdk.Provider.Mediasoup/README.md` | `providers/Sdkwork.Rtc.Sdk.Provider.Mediasoup/src/RtcProviderMediasoupPackageContract.cs` | `RtcProviderMediasoupPackageContract` |
