# Swift Agora RTC Provider Package

Reserved Swift provider package boundary for Agora RTC.

- provider key: `agora`
- plugin id: `rtc-agora`
- driver id: `sdkwork-rtc-driver-agora`
- package identity: `RtcSdkProviderAgora`
- directory path: `Providers/RtcSdkProviderAgora`
- manifest path: `Providers/RtcSdkProviderAgora/Package.swift`
- readme path: `Providers/RtcSdkProviderAgora/README.md`
- source path: `Providers/RtcSdkProviderAgora/Sources/RtcSdkProviderAgora/RtcProviderAgoraPackageContract.swift`
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
