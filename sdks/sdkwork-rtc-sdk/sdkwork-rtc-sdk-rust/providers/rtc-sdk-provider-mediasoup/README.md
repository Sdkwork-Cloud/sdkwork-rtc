# Rust mediasoup RTC Provider Package

Reserved Rust provider package boundary for mediasoup RTC.

- provider key: `mediasoup`
- plugin id: `rtc-mediasoup`
- driver id: `sdkwork-rtc-driver-mediasoup`
- package identity: `rtc-sdk-provider-mediasoup`
- directory path: `providers/rtc-sdk-provider-mediasoup`
- manifest path: `providers/rtc-sdk-provider-mediasoup/Cargo.toml`
- readme path: `providers/rtc-sdk-provider-mediasoup/README.md`
- source path: `providers/rtc-sdk-provider-mediasoup/src/lib.rs`
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
