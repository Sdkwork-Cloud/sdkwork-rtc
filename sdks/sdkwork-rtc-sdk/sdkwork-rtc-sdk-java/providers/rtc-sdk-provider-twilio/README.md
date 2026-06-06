# Java Twilio Video Provider Package

Reserved Java provider package boundary for Twilio Video.

- provider key: `twilio`
- plugin id: `rtc-twilio`
- driver id: `sdkwork-rtc-driver-twilio`
- package identity: `com.sdkwork:rtc-sdk-provider-twilio`
- directory path: `providers/rtc-sdk-provider-twilio`
- manifest path: `providers/rtc-sdk-provider-twilio/pom.xml`
- readme path: `providers/rtc-sdk-provider-twilio/README.md`
- source path: `providers/rtc-sdk-provider-twilio/src/main/java/com/sdkwork/rtc/provider/twilio/RtcProviderTwilioPackageContract.java`
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
