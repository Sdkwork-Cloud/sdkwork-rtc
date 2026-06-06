namespace Sdkwork.Rtc.Sdk;

using System.Collections.Generic;
using System.Linq;

public sealed record RtcProviderExtensionCatalogEntry(
    string extensionKey,
    string providerKey,
    string displayName,
    string surface,
    string access,
    string status
);

public static class RtcProviderExtensionCatalog
{
    public static readonly IReadOnlyList<string> RecognizedSurfaces =
    [
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    ];

    public static readonly IReadOnlyList<string> RecognizedAccessModes =
    [
        "unwrap-only",
        "extension-object",
    ];

    public static readonly IReadOnlyList<string> RecognizedStatuses =
    [
        "reference-baseline",
        "reserved",
    ];

    public static readonly IReadOnlyList<RtcProviderExtensionCatalogEntry> Entries =
    [
        new("volcengine.native-client", "volcengine", "Volcengine Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        new("aliyun.native-client", "aliyun", "Aliyun Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        new("tencent.native-client", "tencent", "Tencent Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        new("agora.native-client", "agora", "Agora Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        new("zego.native-client", "zego", "ZEGO Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        new("livekit.native-client", "livekit", "LiveKit Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        new("twilio.native-client", "twilio", "Twilio Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        new("jitsi.native-client", "jitsi", "Jitsi Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        new("janus.native-client", "janus", "Janus Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        new("mediasoup.native-client", "mediasoup", "mediasoup Native Client", "runtime-bridge", "unwrap-only", "reserved"),
    ];

public static IReadOnlyList<RtcProviderExtensionCatalogEntry> GetRtcProviderExtensionCatalog() =>
        Entries;

    public static RtcProviderExtensionCatalogEntry? GetRtcProviderExtensionDescriptor(string extensionKey) =>
        Entries.FirstOrDefault(entry => entry.extensionKey == extensionKey);

    public static IReadOnlyList<RtcProviderExtensionCatalogEntry> GetRtcProviderExtensionsForProvider(string providerKey) =>
        Entries.Where(entry => entry.providerKey == providerKey).ToArray();

    public static IReadOnlyList<RtcProviderExtensionCatalogEntry> GetRtcProviderExtensions(IReadOnlyList<string> extensionKeys)
    {
        var entries = new List<RtcProviderExtensionCatalogEntry>();
        foreach (var extensionKey in extensionKeys)
        {
            var entry = GetRtcProviderExtensionDescriptor(extensionKey);
            if (entry is not null)
            {
                entries.Add(entry);
            }
        }

        return entries.ToArray();
    }

    public static bool HasRtcProviderExtension(IReadOnlyList<string> extensionKeys, string extensionKey) =>
        extensionKeys.Contains(extensionKey) && GetRtcProviderExtensionDescriptor(extensionKey) is not null;

}
