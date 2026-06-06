namespace Sdkwork.Rtc.Sdk.Provider.Janus;

/// <summary>
/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
/// </summary>
public static class RtcProviderJanusPackageContract
{
    public const string ProviderKey = "janus";
    public const string PluginId = "rtc-janus";
    public const string DriverId = "sdkwork-rtc-driver-janus";
    public const string PackageIdentity = "Sdkwork.Rtc.Sdk.Provider.Janus";
    public const string Status = "future-runtime-bridge-only";
    public const string RuntimeBridgeStatus = "reserved";
    public const bool RootPublic = false;
}
