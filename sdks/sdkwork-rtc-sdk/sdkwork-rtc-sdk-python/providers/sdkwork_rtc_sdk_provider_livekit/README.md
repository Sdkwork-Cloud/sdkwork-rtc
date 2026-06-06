# Python LiveKit RTC Provider Package

Reserved Python provider package boundary for LiveKit RTC.

- provider key: `livekit`
- plugin id: `rtc-livekit`
- driver id: `sdkwork-rtc-driver-livekit`
- package identity: `sdkwork-rtc-sdk-provider-livekit`
- directory path: `providers/sdkwork_rtc_sdk_provider_livekit`
- manifest path: `providers/sdkwork_rtc_sdk_provider_livekit/pyproject.toml`
- readme path: `providers/sdkwork_rtc_sdk_provider_livekit/README.md`
- source path: `providers/sdkwork_rtc_sdk_provider_livekit/sdkwork_rtc_sdk_provider_livekit/__init__.py`
- source symbol: `RtcProviderLivekitPackageContract`
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
