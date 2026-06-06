# Swift Twilio Video Provider Package

Reserved Swift provider package boundary for Twilio Video.

- provider key: `twilio`
- plugin id: `rtc-twilio`
- driver id: `sdkwork-rtc-driver-twilio`
- package identity: `RtcSdkProviderTwilio`
- directory path: `Providers/RtcSdkProviderTwilio`
- manifest path: `Providers/RtcSdkProviderTwilio/Package.swift`
- readme path: `Providers/RtcSdkProviderTwilio/README.md`
- source path: `Providers/RtcSdkProviderTwilio/Sources/RtcSdkProviderTwilio/RtcProviderTwilioPackageContract.swift`
- source symbol: `RtcProviderTwilioPackageContract`
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
