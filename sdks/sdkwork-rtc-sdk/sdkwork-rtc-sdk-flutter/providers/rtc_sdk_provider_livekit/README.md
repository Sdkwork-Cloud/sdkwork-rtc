# Flutter LiveKit RTC Provider Package

Reserved Flutter provider package boundary for LiveKit RTC.

- provider key: `livekit`
- plugin id: `rtc-livekit`
- driver id: `sdkwork-rtc-driver-livekit`
- package identity: `rtc_sdk_provider_livekit`
- directory path: `providers/rtc_sdk_provider_livekit`
- manifest path: `providers/rtc_sdk_provider_livekit/pubspec.yaml`
- readme path: `providers/rtc_sdk_provider_livekit/README.md`
- source path: `providers/rtc_sdk_provider_livekit/lib/src/rtc_provider_livekit_package_contract.dart`
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
