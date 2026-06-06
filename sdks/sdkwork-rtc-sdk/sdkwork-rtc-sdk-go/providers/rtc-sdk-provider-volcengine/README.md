# Go Volcengine RTC Provider Package

Reserved Go provider package boundary for Volcengine RTC.

- provider key: `volcengine`
- plugin id: `rtc-volcengine`
- driver id: `sdkwork-rtc-driver-volcengine`
- package identity: `github.com/sdkwork/rtc-sdk-provider-volcengine`
- directory path: `providers/rtc-sdk-provider-volcengine`
- manifest path: `providers/rtc-sdk-provider-volcengine/go.mod`
- readme path: `providers/rtc-sdk-provider-volcengine/README.md`
- source path: `providers/rtc-sdk-provider-volcengine/provider_package_contract.go`
- source symbol: `RtcProviderVolcenginePackageContract`
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
