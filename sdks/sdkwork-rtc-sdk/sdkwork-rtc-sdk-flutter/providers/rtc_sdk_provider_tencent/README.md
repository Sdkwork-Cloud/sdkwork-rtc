# Flutter Tencent RTC Provider Package

Reserved Flutter provider package boundary for Tencent RTC.

- provider key: `tencent`
- plugin id: `rtc-tencent`
- driver id: `sdkwork-rtc-driver-tencent`
- package identity: `rtc_sdk_provider_tencent`
- directory path: `providers/rtc_sdk_provider_tencent`
- manifest path: `providers/rtc_sdk_provider_tencent/pubspec.yaml`
- readme path: `providers/rtc_sdk_provider_tencent/README.md`
- source path: `providers/rtc_sdk_provider_tencent/lib/src/rtc_provider_tencent_package_contract.dart`
- source symbol: `RtcProviderTencentPackageContract`
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
