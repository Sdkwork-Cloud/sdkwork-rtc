namespace Sdkwork.Rtc.Sdk.Provider.Mediasoup;

/// <summary>
/// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
/// </summary>
public static class RtcProviderMediasoupPackageContract
{
    public const string ProviderKey = "mediasoup";
    public const string PluginId = "rtc-mediasoup";
    public const string DriverId = "sdkwork-rtc-driver-mediasoup";
    public const string PackageIdentity = "Sdkwork.Rtc.Sdk.Provider.Mediasoup";
    public const string Status = "future-runtime-bridge-only";
    public const string RuntimeBridgeStatus = "reserved";
    public const bool RootPublic = false;
}
