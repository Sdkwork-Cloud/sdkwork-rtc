# Swift Jitsi Meet Provider Package

Reserved Swift provider package boundary for Jitsi Meet.

- provider key: `jitsi`
- plugin id: `rtc-jitsi`
- driver id: `sdkwork-rtc-driver-jitsi`
- package identity: `RtcSdkProviderJitsi`
- directory path: `Providers/RtcSdkProviderJitsi`
- manifest path: `Providers/RtcSdkProviderJitsi/Package.swift`
- readme path: `Providers/RtcSdkProviderJitsi/README.md`
- source path: `Providers/RtcSdkProviderJitsi/Sources/RtcSdkProviderJitsi/RtcProviderJitsiPackageContract.swift`
- source symbol: `RtcProviderJitsiPackageContract`
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
