namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed record RtcProviderActivationCatalogEntry(
    string providerKey,
    string pluginId,
    string driverId,
    string activationStatus,
    bool runtimeBridge,
    bool rootPublic,
    bool packageBoundary,
    bool builtin,
    string packageIdentity
);

public static class RtcProviderActivationCatalog
{
    public static readonly IReadOnlyList<string> RecognizedActivationStatuses =
    [
        "package-boundary",
        "control-metadata-only",
    ];

    public static readonly IReadOnlyList<RtcProviderActivationCatalogEntry> Entries =
    [
        new("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "control-metadata-only", false, false, false, true, "Sdkwork.Rtc.Sdk.Provider.Volcengine"),
        new("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "control-metadata-only", false, false, false, true, "Sdkwork.Rtc.Sdk.Provider.Aliyun"),
        new("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "control-metadata-only", false, false, false, true, "Sdkwork.Rtc.Sdk.Provider.Tencent"),
        new("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "control-metadata-only", false, false, false, true, "Sdkwork.Rtc.Sdk.Provider.Agora"),
        new("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "control-metadata-only", false, false, false, false, "Sdkwork.Rtc.Sdk.Provider.Zego"),
        new("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "control-metadata-only", false, false, false, true, "Sdkwork.Rtc.Sdk.Provider.Livekit"),
        new("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "control-metadata-only", false, false, false, false, "Sdkwork.Rtc.Sdk.Provider.Twilio"),
        new("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "control-metadata-only", false, false, false, false, "Sdkwork.Rtc.Sdk.Provider.Jitsi"),
        new("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "control-metadata-only", false, false, false, false, "Sdkwork.Rtc.Sdk.Provider.Janus"),
        new("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "control-metadata-only", false, false, false, false, "Sdkwork.Rtc.Sdk.Provider.Mediasoup"),
    ];

public static RtcProviderActivationCatalogEntry? GetRtcProviderActivationByProviderKey(string providerKey) =>
        Entries.FirstOrDefault(entry => entry.providerKey == providerKey);

}
