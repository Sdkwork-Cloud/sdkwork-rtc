# C# Aliyun RTC Provider Package

Reserved C# provider package boundary for Aliyun RTC.

- provider key: `aliyun`
- plugin id: `rtc-aliyun`
- driver id: `sdkwork-rtc-driver-aliyun`
- package identity: `Sdkwork.Rtc.Sdk.Provider.Aliyun`
- directory path: `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun`
- manifest path: `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/Sdkwork.Rtc.Sdk.Provider.Aliyun.csproj`
- readme path: `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/README.md`
- source path: `providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/src/RtcProviderAliyunPackageContract.cs`
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
