# C# Janus RTC Provider Package

Reserved C# provider package boundary for Janus RTC.

- provider key: `janus`
- plugin id: `rtc-janus`
- driver id: `sdkwork-rtc-driver-janus`
- package identity: `Sdkwork.Rtc.Sdk.Provider.Janus`
- directory path: `providers/Sdkwork.Rtc.Sdk.Provider.Janus`
- manifest path: `providers/Sdkwork.Rtc.Sdk.Provider.Janus/Sdkwork.Rtc.Sdk.Provider.Janus.csproj`
- readme path: `providers/Sdkwork.Rtc.Sdk.Provider.Janus/README.md`
- source path: `providers/Sdkwork.Rtc.Sdk.Provider.Janus/src/RtcProviderJanusPackageContract.cs`
- source symbol: `RtcProviderJanusPackageContract`
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
