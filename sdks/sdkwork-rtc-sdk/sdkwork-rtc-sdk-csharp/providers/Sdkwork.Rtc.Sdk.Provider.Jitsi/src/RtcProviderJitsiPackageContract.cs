namespace Sdkwork.Rtc.Sdk.Provider.Jitsi;

/// <summary>
/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
/// </summary>
public static class RtcProviderJitsiPackageContract
{
    public const string ProviderKey = "jitsi";
    public const string PluginId = "rtc-jitsi";
    public const string DriverId = "sdkwork-rtc-driver-jitsi";
    public const string PackageIdentity = "Sdkwork.Rtc.Sdk.Provider.Jitsi";
    public const string Status = "future-runtime-bridge-only";
    public const string RuntimeBridgeStatus = "reserved";
    public const bool RootPublic = false;
}
