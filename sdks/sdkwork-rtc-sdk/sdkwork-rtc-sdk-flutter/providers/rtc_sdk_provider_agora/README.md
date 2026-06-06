# Flutter Agora RTC Provider Package

Reserved Flutter provider package boundary for Agora RTC.

- provider key: `agora`
- plugin id: `rtc-agora`
- driver id: `sdkwork-rtc-driver-agora`
- package identity: `rtc_sdk_provider_agora`
- directory path: `providers/rtc_sdk_provider_agora`
- manifest path: `providers/rtc_sdk_provider_agora/pubspec.yaml`
- readme path: `providers/rtc_sdk_provider_agora/README.md`
- source path: `providers/rtc_sdk_provider_agora/lib/src/rtc_provider_agora_package_contract.dart`
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
