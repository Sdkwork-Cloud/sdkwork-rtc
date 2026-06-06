namespace Sdkwork.Rtc.Sdk;

using System.Linq;

public sealed record RtcProviderPackageCatalogEntry(
    string providerKey,
    string pluginId,
    string driverId,
    string packageIdentity,
    string manifestPath,
    string readmePath,
    string sourcePath,
    string sourceSymbol,
    bool builtin,
    bool rootPublic,
    string status,
    string runtimeBridgeStatus
);

public static class RtcProviderPackageCatalog
{
    public static readonly IReadOnlyList<RtcProviderPackageCatalogEntry> Entries =
    [
        new("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "Sdkwork.Rtc.Sdk.Provider.Volcengine", "providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/Sdkwork.Rtc.Sdk.Provider.Volcengine.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Volcengine/src/RtcProviderVolcenginePackageContract.cs", "RtcProviderVolcenginePackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        new("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "Sdkwork.Rtc.Sdk.Provider.Aliyun", "providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/Sdkwork.Rtc.Sdk.Provider.Aliyun.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Aliyun/src/RtcProviderAliyunPackageContract.cs", "RtcProviderAliyunPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        new("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "Sdkwork.Rtc.Sdk.Provider.Tencent", "providers/Sdkwork.Rtc.Sdk.Provider.Tencent/Sdkwork.Rtc.Sdk.Provider.Tencent.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Tencent/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Tencent/src/RtcProviderTencentPackageContract.cs", "RtcProviderTencentPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        new("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "Sdkwork.Rtc.Sdk.Provider.Agora", "providers/Sdkwork.Rtc.Sdk.Provider.Agora/Sdkwork.Rtc.Sdk.Provider.Agora.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Agora/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Agora/src/RtcProviderAgoraPackageContract.cs", "RtcProviderAgoraPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        new("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "Sdkwork.Rtc.Sdk.Provider.Zego", "providers/Sdkwork.Rtc.Sdk.Provider.Zego/Sdkwork.Rtc.Sdk.Provider.Zego.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Zego/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Zego/src/RtcProviderZegoPackageContract.cs", "RtcProviderZegoPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        new("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "Sdkwork.Rtc.Sdk.Provider.Livekit", "providers/Sdkwork.Rtc.Sdk.Provider.Livekit/Sdkwork.Rtc.Sdk.Provider.Livekit.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Livekit/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Livekit/src/RtcProviderLivekitPackageContract.cs", "RtcProviderLivekitPackageContract", true, false, "future-runtime-bridge-only", "reserved"),
        new("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "Sdkwork.Rtc.Sdk.Provider.Twilio", "providers/Sdkwork.Rtc.Sdk.Provider.Twilio/Sdkwork.Rtc.Sdk.Provider.Twilio.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Twilio/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Twilio/src/RtcProviderTwilioPackageContract.cs", "RtcProviderTwilioPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        new("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "Sdkwork.Rtc.Sdk.Provider.Jitsi", "providers/Sdkwork.Rtc.Sdk.Provider.Jitsi/Sdkwork.Rtc.Sdk.Provider.Jitsi.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Jitsi/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Jitsi/src/RtcProviderJitsiPackageContract.cs", "RtcProviderJitsiPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        new("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "Sdkwork.Rtc.Sdk.Provider.Janus", "providers/Sdkwork.Rtc.Sdk.Provider.Janus/Sdkwork.Rtc.Sdk.Provider.Janus.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Janus/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Janus/src/RtcProviderJanusPackageContract.cs", "RtcProviderJanusPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
        new("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "Sdkwork.Rtc.Sdk.Provider.Mediasoup", "providers/Sdkwork.Rtc.Sdk.Provider.Mediasoup/Sdkwork.Rtc.Sdk.Provider.Mediasoup.csproj", "providers/Sdkwork.Rtc.Sdk.Provider.Mediasoup/README.md", "providers/Sdkwork.Rtc.Sdk.Provider.Mediasoup/src/RtcProviderMediasoupPackageContract.cs", "RtcProviderMediasoupPackageContract", false, false, "future-runtime-bridge-only", "reserved"),
    ];

public static RtcProviderPackageCatalogEntry? GetRtcProviderPackageByProviderKey(string providerKey) =>
        Entries.FirstOrDefault(entry => entry.providerKey == providerKey);

    public static RtcProviderPackageCatalogEntry? GetRtcProviderPackageByPackageIdentity(string packageIdentity) =>
        Entries.FirstOrDefault(entry => entry.packageIdentity == packageIdentity);

}
