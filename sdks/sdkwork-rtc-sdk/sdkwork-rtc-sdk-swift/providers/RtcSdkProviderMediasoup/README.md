# Swift mediasoup RTC Provider Package

Reserved Swift provider package boundary for mediasoup RTC.

- provider key: `mediasoup`
- plugin id: `rtc-mediasoup`
- driver id: `sdkwork-rtc-driver-mediasoup`
- package identity: `RtcSdkProviderMediasoup`
- directory path: `Providers/RtcSdkProviderMediasoup`
- manifest path: `Providers/RtcSdkProviderMediasoup/Package.swift`
- readme path: `Providers/RtcSdkProviderMediasoup/README.md`
- source path: `Providers/RtcSdkProviderMediasoup/Sources/RtcSdkProviderMediasoup/RtcProviderMediasoupPackageContract.swift`
- source symbol: `RtcProviderMediasoupPackageContract`
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
