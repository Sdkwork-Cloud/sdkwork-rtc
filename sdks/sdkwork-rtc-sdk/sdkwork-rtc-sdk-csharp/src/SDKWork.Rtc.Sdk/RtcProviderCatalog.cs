namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed record RtcProviderCatalogEntry(
    string providerKey,
    string pluginId,
    string driverId,
    bool defaultSelected
);

public static class RtcProviderCatalog
{
    public const string DEFAULT_RTC_PROVIDER_KEY = "volcengine";

    public static readonly IReadOnlyList<RtcProviderCatalogEntry> Entries =
    [
        new("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", true),
        new("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", false),
        new("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", false),
        new("agora", "rtc-agora", "sdkwork-rtc-driver-agora", false),
        new("zego", "rtc-zego", "sdkwork-rtc-driver-zego", false),
        new("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", false),
        new("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", false),
        new("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", false),
        new("janus", "rtc-janus", "sdkwork-rtc-driver-janus", false),
        new("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", false),
    ];

public static RtcProviderCatalogEntry? GetRtcProviderByProviderKey(string providerKey) =>
        Entries.FirstOrDefault(entry => entry.providerKey == providerKey);

}
