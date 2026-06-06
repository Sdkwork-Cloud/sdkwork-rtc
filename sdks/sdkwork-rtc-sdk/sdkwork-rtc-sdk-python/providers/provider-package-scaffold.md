# Python Provider Package Scaffold

Reserved provider package scaffold for future Python RTC adapters.

- directory pattern: `providers/sdkwork_rtc_sdk_provider_{providerKey}`
- package pattern: `sdkwork-rtc-sdk-provider-{providerKey}`
- manifest file name: `pyproject.toml`
- readme file name: `README.md`
- source file pattern: `sdkwork_rtc_sdk_provider_{providerKey}/__init__.py`
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
| `volcengine` | `Volcengine` | `sdkwork-rtc-sdk-provider-volcengine` | `providers/sdkwork_rtc_sdk_provider_volcengine` | `providers/sdkwork_rtc_sdk_provider_volcengine/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_volcengine/README.md` | `providers/sdkwork_rtc_sdk_provider_volcengine/sdkwork_rtc_sdk_provider_volcengine/__init__.py` | `RtcProviderVolcenginePackageContract` |
| `aliyun` | `Aliyun` | `sdkwork-rtc-sdk-provider-aliyun` | `providers/sdkwork_rtc_sdk_provider_aliyun` | `providers/sdkwork_rtc_sdk_provider_aliyun/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_aliyun/README.md` | `providers/sdkwork_rtc_sdk_provider_aliyun/sdkwork_rtc_sdk_provider_aliyun/__init__.py` | `RtcProviderAliyunPackageContract` |
| `tencent` | `Tencent` | `sdkwork-rtc-sdk-provider-tencent` | `providers/sdkwork_rtc_sdk_provider_tencent` | `providers/sdkwork_rtc_sdk_provider_tencent/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_tencent/README.md` | `providers/sdkwork_rtc_sdk_provider_tencent/sdkwork_rtc_sdk_provider_tencent/__init__.py` | `RtcProviderTencentPackageContract` |
| `agora` | `Agora` | `sdkwork-rtc-sdk-provider-agora` | `providers/sdkwork_rtc_sdk_provider_agora` | `providers/sdkwork_rtc_sdk_provider_agora/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_agora/README.md` | `providers/sdkwork_rtc_sdk_provider_agora/sdkwork_rtc_sdk_provider_agora/__init__.py` | `RtcProviderAgoraPackageContract` |
| `zego` | `Zego` | `sdkwork-rtc-sdk-provider-zego` | `providers/sdkwork_rtc_sdk_provider_zego` | `providers/sdkwork_rtc_sdk_provider_zego/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_zego/README.md` | `providers/sdkwork_rtc_sdk_provider_zego/sdkwork_rtc_sdk_provider_zego/__init__.py` | `RtcProviderZegoPackageContract` |
| `livekit` | `Livekit` | `sdkwork-rtc-sdk-provider-livekit` | `providers/sdkwork_rtc_sdk_provider_livekit` | `providers/sdkwork_rtc_sdk_provider_livekit/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_livekit/README.md` | `providers/sdkwork_rtc_sdk_provider_livekit/sdkwork_rtc_sdk_provider_livekit/__init__.py` | `RtcProviderLivekitPackageContract` |
| `twilio` | `Twilio` | `sdkwork-rtc-sdk-provider-twilio` | `providers/sdkwork_rtc_sdk_provider_twilio` | `providers/sdkwork_rtc_sdk_provider_twilio/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_twilio/README.md` | `providers/sdkwork_rtc_sdk_provider_twilio/sdkwork_rtc_sdk_provider_twilio/__init__.py` | `RtcProviderTwilioPackageContract` |
| `jitsi` | `Jitsi` | `sdkwork-rtc-sdk-provider-jitsi` | `providers/sdkwork_rtc_sdk_provider_jitsi` | `providers/sdkwork_rtc_sdk_provider_jitsi/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_jitsi/README.md` | `providers/sdkwork_rtc_sdk_provider_jitsi/sdkwork_rtc_sdk_provider_jitsi/__init__.py` | `RtcProviderJitsiPackageContract` |
| `janus` | `Janus` | `sdkwork-rtc-sdk-provider-janus` | `providers/sdkwork_rtc_sdk_provider_janus` | `providers/sdkwork_rtc_sdk_provider_janus/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_janus/README.md` | `providers/sdkwork_rtc_sdk_provider_janus/sdkwork_rtc_sdk_provider_janus/__init__.py` | `RtcProviderJanusPackageContract` |
| `mediasoup` | `Mediasoup` | `sdkwork-rtc-sdk-provider-mediasoup` | `providers/sdkwork_rtc_sdk_provider_mediasoup` | `providers/sdkwork_rtc_sdk_provider_mediasoup/pyproject.toml` | `providers/sdkwork_rtc_sdk_provider_mediasoup/README.md` | `providers/sdkwork_rtc_sdk_provider_mediasoup/sdkwork_rtc_sdk_provider_mediasoup/__init__.py` | `RtcProviderMediasoupPackageContract` |
