# Swift Tencent RTC Provider Package

Reserved Swift provider package boundary for Tencent RTC.

- provider key: `tencent`
- plugin id: `rtc-tencent`
- driver id: `sdkwork-rtc-driver-tencent`
- package identity: `RtcSdkProviderTencent`
- directory path: `Providers/RtcSdkProviderTencent`
- manifest path: `Providers/RtcSdkProviderTencent/Package.swift`
- readme path: `Providers/RtcSdkProviderTencent/README.md`
- source path: `Providers/RtcSdkProviderTencent/Sources/RtcSdkProviderTencent/RtcProviderTencentPackageContract.swift`
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
