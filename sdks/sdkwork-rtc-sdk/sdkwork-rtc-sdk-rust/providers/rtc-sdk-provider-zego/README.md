# Rust ZEGO RTC Provider Package

Reserved Rust provider package boundary for ZEGO RTC.

- provider key: `zego`
- plugin id: `rtc-zego`
- driver id: `sdkwork-rtc-driver-zego`
- package identity: `rtc-sdk-provider-zego`
- directory path: `providers/rtc-sdk-provider-zego`
- manifest path: `providers/rtc-sdk-provider-zego/Cargo.toml`
- readme path: `providers/rtc-sdk-provider-zego/README.md`
- source path: `providers/rtc-sdk-provider-zego/src/lib.rs`
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
