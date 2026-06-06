# Rust Tencent RTC Provider Package

Reserved Rust provider package boundary for Tencent RTC.

- provider key: `tencent`
- plugin id: `rtc-tencent`
- driver id: `sdkwork-rtc-driver-tencent`
- package identity: `rtc-sdk-provider-tencent`
- directory path: `providers/rtc-sdk-provider-tencent`
- manifest path: `providers/rtc-sdk-provider-tencent/Cargo.toml`
- readme path: `providers/rtc-sdk-provider-tencent/README.md`
- source path: `providers/rtc-sdk-provider-tencent/src/lib.rs`
- source symbol: `RtcProviderTencentPackageContract`
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
