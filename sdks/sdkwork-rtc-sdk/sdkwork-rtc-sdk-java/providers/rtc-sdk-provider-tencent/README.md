# Java Tencent RTC Provider Package

Reserved Java provider package boundary for Tencent RTC.

- provider key: `tencent`
- plugin id: `rtc-tencent`
- driver id: `sdkwork-rtc-driver-tencent`
- package identity: `com.sdkwork:rtc-sdk-provider-tencent`
- directory path: `providers/rtc-sdk-provider-tencent`
- manifest path: `providers/rtc-sdk-provider-tencent/pom.xml`
- readme path: `providers/rtc-sdk-provider-tencent/README.md`
- source path: `providers/rtc-sdk-provider-tencent/src/main/java/com/sdkwork/rtc/provider/tencent/RtcProviderTencentPackageContract.java`
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
