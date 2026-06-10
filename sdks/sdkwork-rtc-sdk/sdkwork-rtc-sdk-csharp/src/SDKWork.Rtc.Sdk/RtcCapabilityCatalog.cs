namespace Sdkwork.Rtc.Sdk;

using System.Collections.Generic;
using System.Linq;

public sealed record RtcCapabilityCatalogEntry(
    string capabilityKey,
    string category,
    string surface
);

public static class RtcCapabilityCatalog
{
    public static readonly IReadOnlyList<RtcCapabilityCatalogEntry> Entries =
    [
        new("session", "required-baseline", "cross-surface"),
        new("credential", "required-baseline", "control-plane"),
        new("provider.webhook", "required-baseline", "control-plane"),
        new("provider.event-normalization", "required-baseline", "control-plane"),
        new("health", "required-baseline", "control-plane"),
        new("media.audio", "required-baseline", "runtime-bridge"),
        new("media.video", "required-baseline", "runtime-bridge"),
        new("live.broadcast", "required-baseline", "cross-surface"),
        new("live.audience", "required-baseline", "cross-surface"),
        new("screen-share", "optional-advanced", "runtime-bridge"),
        new("recording", "optional-advanced", "control-plane"),
        new("artifact", "optional-advanced", "control-plane"),
        new("cloud-mix", "optional-advanced", "control-plane"),
        new("cdn-relay", "optional-advanced", "control-plane"),
        new("data-channel", "optional-advanced", "runtime-bridge"),
        new("transcription", "optional-advanced", "control-plane"),
        new("beauty", "optional-advanced", "runtime-bridge"),
        new("spatial-audio", "optional-advanced", "runtime-bridge"),
        new("e2ee", "optional-advanced", "runtime-bridge"),
        new("provider.active-query", "optional-advanced", "control-plane"),
    ];

public static IReadOnlyList<RtcCapabilityCatalogEntry> GetRtcCapabilityCatalog() =>
        Entries;

    public static RtcCapabilityCatalogEntry? GetRtcCapabilityDescriptor(string capabilityKey) =>
        Entries.FirstOrDefault(entry => entry.capabilityKey == capabilityKey);

}
