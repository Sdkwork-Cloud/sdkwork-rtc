# Swift LiveKit RTC Provider Package

Reserved Swift provider package boundary for LiveKit RTC.

- provider key: `livekit`
- plugin id: `rtc-livekit`
- driver id: `sdkwork-rtc-driver-livekit`
- package identity: `RtcSdkProviderLivekit`
- directory path: `Providers/RtcSdkProviderLivekit`
- manifest path: `Providers/RtcSdkProviderLivekit/Package.swift`
- readme path: `Providers/RtcSdkProviderLivekit/README.md`
- source path: `Providers/RtcSdkProviderLivekit/Sources/RtcSdkProviderLivekit/RtcProviderLivekitPackageContract.swift`
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
