# Rust Agora RTC Provider Package

Reserved Rust provider package boundary for Agora RTC.

- provider key: `agora`
- plugin id: `rtc-agora`
- driver id: `sdkwork-rtc-driver-agora`
- package identity: `rtc-sdk-provider-agora`
- directory path: `providers/rtc-sdk-provider-agora`
- manifest path: `providers/rtc-sdk-provider-agora/Cargo.toml`
- readme path: `providers/rtc-sdk-provider-agora/README.md`
- source path: `providers/rtc-sdk-provider-agora/src/lib.rs`
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
