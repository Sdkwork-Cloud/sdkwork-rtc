# Rust LiveKit RTC Provider Package

Reserved Rust provider package boundary for LiveKit RTC.

- provider key: `livekit`
- plugin id: `rtc-livekit`
- driver id: `sdkwork-rtc-driver-livekit`
- package identity: `rtc-sdk-provider-livekit`
- directory path: `providers/rtc-sdk-provider-livekit`
- manifest path: `providers/rtc-sdk-provider-livekit/Cargo.toml`
- readme path: `providers/rtc-sdk-provider-livekit/README.md`
- source path: `providers/rtc-sdk-provider-livekit/src/lib.rs`
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
