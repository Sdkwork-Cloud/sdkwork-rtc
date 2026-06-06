package rtcstandard

type RtcProviderExtensionCatalogEntry struct {
    ExtensionKey string
    ProviderKey  string
    DisplayName  string
    Surface      string
    Access       string
    Status       string
}

type RtcProviderExtensionCatalog struct{}

var RTC_PROVIDER_EXTENSION_SURFACES = []string{
    "control-plane",
    "runtime-bridge",
    "cross-surface",
}

var RTC_PROVIDER_EXTENSION_ACCESSES = []string{
    "unwrap-only",
    "extension-object",
}

var RTC_PROVIDER_EXTENSION_STATUSES = []string{
    "reference-baseline",
    "reserved",
}

var RTC_PROVIDER_EXTENSION_CATALOG = []RtcProviderExtensionCatalogEntry{
    {ExtensionKey: "volcengine.native-client", ProviderKey: "volcengine", DisplayName: "Volcengine Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reference-baseline"},
    {ExtensionKey: "aliyun.native-client", ProviderKey: "aliyun", DisplayName: "Aliyun Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reference-baseline"},
    {ExtensionKey: "tencent.native-client", ProviderKey: "tencent", DisplayName: "Tencent Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reference-baseline"},
    {ExtensionKey: "agora.native-client", ProviderKey: "agora", DisplayName: "Agora Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reserved"},
    {ExtensionKey: "zego.native-client", ProviderKey: "zego", DisplayName: "ZEGO Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reserved"},
    {ExtensionKey: "livekit.native-client", ProviderKey: "livekit", DisplayName: "LiveKit Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reserved"},
    {ExtensionKey: "twilio.native-client", ProviderKey: "twilio", DisplayName: "Twilio Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reserved"},
    {ExtensionKey: "jitsi.native-client", ProviderKey: "jitsi", DisplayName: "Jitsi Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reserved"},
    {ExtensionKey: "janus.native-client", ProviderKey: "janus", DisplayName: "Janus Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reserved"},
    {ExtensionKey: "mediasoup.native-client", ProviderKey: "mediasoup", DisplayName: "mediasoup Native Client", Surface: "runtime-bridge", Access: "unwrap-only", Status: "reserved"},
}

func GetRtcProviderExtensionCatalog() []RtcProviderExtensionCatalogEntry {
    return append([]RtcProviderExtensionCatalogEntry(nil), RTC_PROVIDER_EXTENSION_CATALOG...)
}

func GetRtcProviderExtensionDescriptor(extensionKey string) *RtcProviderExtensionCatalogEntry {
    for index := range RTC_PROVIDER_EXTENSION_CATALOG {
        if RTC_PROVIDER_EXTENSION_CATALOG[index].ExtensionKey == extensionKey {
            return &RTC_PROVIDER_EXTENSION_CATALOG[index]
        }
    }

    return nil
}

func GetRtcProviderExtensionsForProvider(providerKey string) []RtcProviderExtensionCatalogEntry {
    entries := make([]RtcProviderExtensionCatalogEntry, 0)
    for _, entry := range RTC_PROVIDER_EXTENSION_CATALOG {
        if entry.ProviderKey == providerKey {
            entries = append(entries, entry)
        }
    }

    return entries
}

func GetRtcProviderExtensions(extensionKeys []string) []RtcProviderExtensionCatalogEntry {
    entries := make([]RtcProviderExtensionCatalogEntry, 0)
    for _, extensionKey := range extensionKeys {
        entry := GetRtcProviderExtensionDescriptor(extensionKey)
        if entry != nil {
            entries = append(entries, *entry)
        }
    }

    return entries
}

func HasRtcProviderExtension(extensionKeys []string, extensionKey string) bool {
    if GetRtcProviderExtensionDescriptor(extensionKey) == nil {
        return false
    }

    for _, value := range extensionKeys {
        if value == extensionKey {
            return true
        }
    }

    return false
}
