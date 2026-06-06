# Flutter Aliyun RTC Provider Package

Reserved Flutter provider package boundary for Aliyun RTC.

- provider key: `aliyun`
- plugin id: `rtc-aliyun`
- driver id: `sdkwork-rtc-driver-aliyun`
- package identity: `rtc_sdk_provider_aliyun`
- directory path: `providers/rtc_sdk_provider_aliyun`
- manifest path: `providers/rtc_sdk_provider_aliyun/pubspec.yaml`
- readme path: `providers/rtc_sdk_provider_aliyun/README.md`
- source path: `providers/rtc_sdk_provider_aliyun/lib/src/rtc_provider_aliyun_package_contract.dart`
- source symbol: `RtcProviderAliyunPackageContract`
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
