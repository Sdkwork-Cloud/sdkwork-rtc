# Java Jitsi Meet Provider Package

Reserved Java provider package boundary for Jitsi Meet.

- provider key: `jitsi`
- plugin id: `rtc-jitsi`
- driver id: `sdkwork-rtc-driver-jitsi`
- package identity: `com.sdkwork:rtc-sdk-provider-jitsi`
- directory path: `providers/rtc-sdk-provider-jitsi`
- manifest path: `providers/rtc-sdk-provider-jitsi/pom.xml`
- readme path: `providers/rtc-sdk-provider-jitsi/README.md`
- source path: `providers/rtc-sdk-provider-jitsi/src/main/java/com/sdkwork/rtc/provider/jitsi/RtcProviderJitsiPackageContract.java`
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
