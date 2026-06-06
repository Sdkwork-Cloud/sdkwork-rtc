# C# Twilio Video Provider Package

Reserved C# provider package boundary for Twilio Video.

- provider key: `twilio`
- plugin id: `rtc-twilio`
- driver id: `sdkwork-rtc-driver-twilio`
- package identity: `Sdkwork.Rtc.Sdk.Provider.Twilio`
- directory path: `providers/Sdkwork.Rtc.Sdk.Provider.Twilio`
- manifest path: `providers/Sdkwork.Rtc.Sdk.Provider.Twilio/Sdkwork.Rtc.Sdk.Provider.Twilio.csproj`
- readme path: `providers/Sdkwork.Rtc.Sdk.Provider.Twilio/README.md`
- source path: `providers/Sdkwork.Rtc.Sdk.Provider.Twilio/src/RtcProviderTwilioPackageContract.cs`
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
