# Swift Aliyun RTC Provider Package

Reserved Swift provider package boundary for Aliyun RTC.

- provider key: `aliyun`
- plugin id: `rtc-aliyun`
- driver id: `sdkwork-rtc-driver-aliyun`
- package identity: `RtcSdkProviderAliyun`
- directory path: `Providers/RtcSdkProviderAliyun`
- manifest path: `Providers/RtcSdkProviderAliyun/Package.swift`
- readme path: `Providers/RtcSdkProviderAliyun/README.md`
- source path: `Providers/RtcSdkProviderAliyun/Sources/RtcSdkProviderAliyun/RtcProviderAliyunPackageContract.swift`
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
