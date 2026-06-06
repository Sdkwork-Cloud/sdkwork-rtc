# Rust Provider Package Scaffold

Reserved provider package scaffold for future Rust RTC adapters.

- directory pattern: `providers/rtc-sdk-provider-{providerKey}`
- package pattern: `rtc-sdk-provider-{providerKey}`
- manifest file name: `Cargo.toml`
- readme file name: `README.md`
- source file pattern: `src/lib.rs`
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
| `volcengine` | `Volcengine` | `rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine` | `providers/rtc-sdk-provider-volcengine/Cargo.toml` | `providers/rtc-sdk-provider-volcengine/README.md` | `providers/rtc-sdk-provider-volcengine/src/lib.rs` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun` | `providers/rtc-sdk-provider-aliyun/Cargo.toml` | `providers/rtc-sdk-provider-aliyun/README.md` | `providers/rtc-sdk-provider-aliyun/src/lib.rs` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent` | `providers/rtc-sdk-provider-tencent/Cargo.toml` | `providers/rtc-sdk-provider-tencent/README.md` | `providers/rtc-sdk-provider-tencent/src/lib.rs` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora` | `providers/rtc-sdk-provider-agora/Cargo.toml` | `providers/rtc-sdk-provider-agora/README.md` | `providers/rtc-sdk-provider-agora/src/lib.rs` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego` | `providers/rtc-sdk-provider-zego/Cargo.toml` | `providers/rtc-sdk-provider-zego/README.md` | `providers/rtc-sdk-provider-zego/src/lib.rs` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit` | `providers/rtc-sdk-provider-livekit/Cargo.toml` | `providers/rtc-sdk-provider-livekit/README.md` | `providers/rtc-sdk-provider-livekit/src/lib.rs` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio` | `providers/rtc-sdk-provider-twilio/Cargo.toml` | `providers/rtc-sdk-provider-twilio/README.md` | `providers/rtc-sdk-provider-twilio/src/lib.rs` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi` | `providers/rtc-sdk-provider-jitsi/Cargo.toml` | `providers/rtc-sdk-provider-jitsi/README.md` | `providers/rtc-sdk-provider-jitsi/src/lib.rs` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus` | `providers/rtc-sdk-provider-janus/Cargo.toml` | `providers/rtc-sdk-provider-janus/README.md` | `providers/rtc-sdk-provider-janus/src/lib.rs` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup` | `providers/rtc-sdk-provider-mediasoup/Cargo.toml` | `providers/rtc-sdk-provider-mediasoup/README.md` | `providers/rtc-sdk-provider-mediasoup/src/lib.rs` | `RtcProviderMediasoupPackageContract` |
