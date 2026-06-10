package rtcstandard

type RtcCapabilityCatalogEntry struct {
    CapabilityKey string
    Category      string
    Surface       string
}

type RtcCapabilityCatalog struct{}

var RTC_CAPABILITY_CATALOG = []RtcCapabilityCatalogEntry{
    {CapabilityKey: "session", Category: "required-baseline", Surface: "cross-surface"},
    {CapabilityKey: "credential", Category: "required-baseline", Surface: "control-plane"},
    {CapabilityKey: "provider.webhook", Category: "required-baseline", Surface: "control-plane"},
    {CapabilityKey: "provider.event-normalization", Category: "required-baseline", Surface: "control-plane"},
    {CapabilityKey: "health", Category: "required-baseline", Surface: "control-plane"},
    {CapabilityKey: "media.audio", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "media.video", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "live.broadcast", Category: "required-baseline", Surface: "cross-surface"},
    {CapabilityKey: "live.audience", Category: "required-baseline", Surface: "cross-surface"},
    {CapabilityKey: "screen-share", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "recording", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "artifact", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "cloud-mix", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "cdn-relay", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "data-channel", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "transcription", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "beauty", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "spatial-audio", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "e2ee", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "provider.active-query", Category: "optional-advanced", Surface: "control-plane"},
}

func GetRtcCapabilityCatalog() []RtcCapabilityCatalogEntry {
    return append([]RtcCapabilityCatalogEntry(nil), RTC_CAPABILITY_CATALOG...)
}

func GetRtcCapabilityDescriptor(capabilityKey string) *RtcCapabilityCatalogEntry {
    for index := range RTC_CAPABILITY_CATALOG {
        if RTC_CAPABILITY_CATALOG[index].CapabilityKey == capabilityKey {
            return &RTC_CAPABILITY_CATALOG[index]
        }
    }

    return nil
}
