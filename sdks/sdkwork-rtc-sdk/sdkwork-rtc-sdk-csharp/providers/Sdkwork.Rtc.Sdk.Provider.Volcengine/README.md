# C# Volcengine RTC Provider Package

Reserved C# provider package boundary for Volcengine RTC.

- provider key: `volcengine`
- plugin id: `rtc-volcengine`
- driver id: `sdkwork-rtc-driver-volcengine`
- package identity: `Sdkwork.Rtc.Sdk.Provider.Volcengine`
- directory path: `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine`
- manifest path: `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/Sdkwork.Rtc.Sdk.Provider.Volcengine.csproj`
- readme path: `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/README.md`
- source path: `providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/src/RtcProviderVolcenginePackageContract.cs`
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
