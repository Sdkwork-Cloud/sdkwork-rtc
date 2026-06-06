# C# Agora RTC Provider Package

Reserved C# provider package boundary for Agora RTC.

- provider key: `agora`
- plugin id: `rtc-agora`
- driver id: `sdkwork-rtc-driver-agora`
- package identity: `Sdkwork.Rtc.Sdk.Provider.Agora`
- directory path: `providers/Sdkwork.Rtc.Sdk.Provider.Agora`
- manifest path: `providers/Sdkwork.Rtc.Sdk.Provider.Agora/Sdkwork.Rtc.Sdk.Provider.Agora.csproj`
- readme path: `providers/Sdkwork.Rtc.Sdk.Provider.Agora/README.md`
- source path: `providers/Sdkwork.Rtc.Sdk.Provider.Agora/src/RtcProviderAgoraPackageContract.cs`
- source symbol: `RtcProviderAgoraPackageContract`
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
