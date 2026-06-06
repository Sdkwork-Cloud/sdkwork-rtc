# Java Aliyun RTC Provider Package

Reserved Java provider package boundary for Aliyun RTC.

- provider key: `aliyun`
- plugin id: `rtc-aliyun`
- driver id: `sdkwork-rtc-driver-aliyun`
- package identity: `com.sdkwork:rtc-sdk-provider-aliyun`
- directory path: `providers/rtc-sdk-provider-aliyun`
- manifest path: `providers/rtc-sdk-provider-aliyun/pom.xml`
- readme path: `providers/rtc-sdk-provider-aliyun/README.md`
- source path: `providers/rtc-sdk-provider-aliyun/src/main/java/com/sdkwork/rtc/provider/aliyun/RtcProviderAliyunPackageContract.java`
- source symbol: `RtcProviderAliyunPackageContract`
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
