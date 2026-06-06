# Python mediasoup RTC Provider Package

Reserved Python provider package boundary for mediasoup RTC.

- provider key: `mediasoup`
- plugin id: `rtc-mediasoup`
- driver id: `sdkwork-rtc-driver-mediasoup`
- package identity: `sdkwork-rtc-sdk-provider-mediasoup`
- directory path: `providers/sdkwork_rtc_sdk_provider_mediasoup`
- manifest path: `providers/sdkwork_rtc_sdk_provider_mediasoup/pyproject.toml`
- readme path: `providers/sdkwork_rtc_sdk_provider_mediasoup/README.md`
- source path: `providers/sdkwork_rtc_sdk_provider_mediasoup/sdkwork_rtc_sdk_provider_mediasoup/__init__.py`
- source symbol: `RtcProviderMediasoupPackageContract`
- builtin provider: `false`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`

Rules:

- one provider per package boundary
- preserve providerKey, pluginId, and driverId alignment with the official provider catalog
- wrap the official vendor SDK instead of re-implementing media runtime
- keep the source scaffold metadata-only until a verified runtime bridge lands
- do not expose this package through the root public API in the current landing
- no runtime bridge ships in the current reserved package boundary
