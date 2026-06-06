# Python Agora RTC Provider Package

Reserved Python provider package boundary for Agora RTC.

- provider key: `agora`
- plugin id: `rtc-agora`
- driver id: `sdkwork-rtc-driver-agora`
- package identity: `sdkwork-rtc-sdk-provider-agora`
- directory path: `providers/sdkwork_rtc_sdk_provider_agora`
- manifest path: `providers/sdkwork_rtc_sdk_provider_agora/pyproject.toml`
- readme path: `providers/sdkwork_rtc_sdk_provider_agora/README.md`
- source path: `providers/sdkwork_rtc_sdk_provider_agora/sdkwork_rtc_sdk_provider_agora/__init__.py`
- source symbol: `RtcProviderAgoraPackageContract`
- builtin provider: `true`
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
