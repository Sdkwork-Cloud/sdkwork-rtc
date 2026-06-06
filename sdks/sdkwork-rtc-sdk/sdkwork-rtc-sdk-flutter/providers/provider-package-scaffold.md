# Flutter Provider Package Scaffold

Reserved provider package scaffold for future Flutter RTC adapters.

- directory pattern: `providers/rtc_sdk_provider_{providerKey}`
- package pattern: `rtc_sdk_provider_{providerKey}`
- manifest file name: `pubspec.yaml`
- readme file name: `README.md`
- source file pattern: `lib/src/rtc_provider_{providerKey}_package_contract.dart`
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
| `volcengine` | `Volcengine` | `rtc_sdk_provider_volcengine` | `providers/rtc_sdk_provider_volcengine` | `providers/rtc_sdk_provider_volcengine/pubspec.yaml` | `providers/rtc_sdk_provider_volcengine/README.md` | `providers/rtc_sdk_provider_volcengine/lib/src/rtc_provider_volcengine_package_contract.dart` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `rtc_sdk_provider_aliyun` | `providers/rtc_sdk_provider_aliyun` | `providers/rtc_sdk_provider_aliyun/pubspec.yaml` | `providers/rtc_sdk_provider_aliyun/README.md` | `providers/rtc_sdk_provider_aliyun/lib/src/rtc_provider_aliyun_package_contract.dart` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `rtc_sdk_provider_tencent` | `providers/rtc_sdk_provider_tencent` | `providers/rtc_sdk_provider_tencent/pubspec.yaml` | `providers/rtc_sdk_provider_tencent/README.md` | `providers/rtc_sdk_provider_tencent/lib/src/rtc_provider_tencent_package_contract.dart` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `rtc_sdk_provider_agora` | `providers/rtc_sdk_provider_agora` | `providers/rtc_sdk_provider_agora/pubspec.yaml` | `providers/rtc_sdk_provider_agora/README.md` | `providers/rtc_sdk_provider_agora/lib/src/rtc_provider_agora_package_contract.dart` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `rtc_sdk_provider_zego` | `providers/rtc_sdk_provider_zego` | `providers/rtc_sdk_provider_zego/pubspec.yaml` | `providers/rtc_sdk_provider_zego/README.md` | `providers/rtc_sdk_provider_zego/lib/src/rtc_provider_zego_package_contract.dart` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `rtc_sdk_provider_livekit` | `providers/rtc_sdk_provider_livekit` | `providers/rtc_sdk_provider_livekit/pubspec.yaml` | `providers/rtc_sdk_provider_livekit/README.md` | `providers/rtc_sdk_provider_livekit/lib/src/rtc_provider_livekit_package_contract.dart` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `rtc_sdk_provider_twilio` | `providers/rtc_sdk_provider_twilio` | `providers/rtc_sdk_provider_twilio/pubspec.yaml` | `providers/rtc_sdk_provider_twilio/README.md` | `providers/rtc_sdk_provider_twilio/lib/src/rtc_provider_twilio_package_contract.dart` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `rtc_sdk_provider_jitsi` | `providers/rtc_sdk_provider_jitsi` | `providers/rtc_sdk_provider_jitsi/pubspec.yaml` | `providers/rtc_sdk_provider_jitsi/README.md` | `providers/rtc_sdk_provider_jitsi/lib/src/rtc_provider_jitsi_package_contract.dart` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `rtc_sdk_provider_janus` | `providers/rtc_sdk_provider_janus` | `providers/rtc_sdk_provider_janus/pubspec.yaml` | `providers/rtc_sdk_provider_janus/README.md` | `providers/rtc_sdk_provider_janus/lib/src/rtc_provider_janus_package_contract.dart` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `rtc_sdk_provider_mediasoup` | `providers/rtc_sdk_provider_mediasoup` | `providers/rtc_sdk_provider_mediasoup/pubspec.yaml` | `providers/rtc_sdk_provider_mediasoup/README.md` | `providers/rtc_sdk_provider_mediasoup/lib/src/rtc_provider_mediasoup_package_contract.dart` | `RtcProviderMediasoupPackageContract` |
