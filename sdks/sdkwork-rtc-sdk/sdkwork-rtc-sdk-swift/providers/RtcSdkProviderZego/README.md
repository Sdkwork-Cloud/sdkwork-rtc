# Swift ZEGO RTC Provider Package

Reserved Swift provider package boundary for ZEGO RTC.

- provider key: `zego`
- plugin id: `rtc-zego`
- driver id: `sdkwork-rtc-driver-zego`
- package identity: `RtcSdkProviderZego`
- directory path: `Providers/RtcSdkProviderZego`
- manifest path: `Providers/RtcSdkProviderZego/Package.swift`
- readme path: `Providers/RtcSdkProviderZego/README.md`
- source path: `Providers/RtcSdkProviderZego/Sources/RtcSdkProviderZego/RtcProviderZegoPackageContract.swift`
- source symbol: `RtcProviderZegoPackageContract`
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
