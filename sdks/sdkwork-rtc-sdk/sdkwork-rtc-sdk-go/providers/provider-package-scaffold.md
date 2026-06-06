# Go Provider Package Scaffold

Reserved provider package scaffold for future Go RTC adapters.

- directory pattern: `providers/rtc-sdk-provider-{providerKey}`
- package pattern: `github.com/sdkwork/rtc-sdk-provider-{providerKey}`
- manifest file name: `go.mod`
- readme file name: `README.md`
- source file pattern: `provider_package_contract.go`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
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
| `volcengine` | `Volcengine` | `github.com/sdkwork/rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/go.mod` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/provider_package_contract.go` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `github.com/sdkwork/rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun/go.mod` | `providers/rtc-sdk-provider-aliyun/README.md` | `providers/rtc-sdk-provider-aliyun/provider_package_contract.go` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `github.com/sdkwork/rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent/go.mod` | `providers/rtc-sdk-provider-tencent/README.md` | `providers/rtc-sdk-provider-tencent/provider_package_contract.go` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `github.com/sdkwork/rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora/go.mod` | `providers/rtc-sdk-provider-agora/README.md` | `providers/rtc-sdk-provider-agora/provider_package_contract.go` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `github.com/sdkwork/rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego/go.mod` | `providers/rtc-sdk-provider-zego/README.md` | `providers/rtc-sdk-provider-zego/provider_package_contract.go` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `github.com/sdkwork/rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit/go.mod` | `providers/rtc-sdk-provider-livekit/README.md` | `providers/rtc-sdk-provider-livekit/provider_package_contract.go` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `github.com/sdkwork/rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio/go.mod` | `providers/rtc-sdk-provider-twilio/README.md` | `providers/rtc-sdk-provider-twilio/provider_package_contract.go` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `github.com/sdkwork/rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi/go.mod` | `providers/rtc-sdk-provider-jitsi/README.md` | `providers/rtc-sdk-provider-jitsi/provider_package_contract.go` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `github.com/sdkwork/rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus/go.mod` | `providers/rtc-sdk-provider-janus/README.md` | `providers/rtc-sdk-provider-janus/provider_package_contract.go` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `github.com/sdkwork/rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup/go.mod` | `providers/rtc-sdk-provider-mediasoup/README.md` | `providers/rtc-sdk-provider-mediasoup/provider_package_contract.go` | `RtcProviderMediasoupPackageContract` |
