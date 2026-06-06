package rtcstandard

type RtcProviderCatalogEntry struct {
    ProviderKey     string
    PluginId        string
    DriverId        string
    DefaultSelected bool
}

type RtcProviderCatalog struct{}

const DEFAULT_RTC_PROVIDER_KEY = "volcengine"

var OFFICIAL_RTC_PROVIDERS = []RtcProviderCatalogEntry{
    {ProviderKey: "volcengine", PluginId: "rtc-volcengine", DriverId: "sdkwork-rtc-driver-volcengine", DefaultSelected: true},
    {ProviderKey: "aliyun", PluginId: "rtc-aliyun", DriverId: "sdkwork-rtc-driver-aliyun", DefaultSelected: false},
    {ProviderKey: "tencent", PluginId: "rtc-tencent", DriverId: "sdkwork-rtc-driver-tencent", DefaultSelected: false},
    {ProviderKey: "agora", PluginId: "rtc-agora", DriverId: "sdkwork-rtc-driver-agora", DefaultSelected: false},
    {ProviderKey: "zego", PluginId: "rtc-zego", DriverId: "sdkwork-rtc-driver-zego", DefaultSelected: false},
    {ProviderKey: "livekit", PluginId: "rtc-livekit", DriverId: "sdkwork-rtc-driver-livekit", DefaultSelected: false},
    {ProviderKey: "twilio", PluginId: "rtc-twilio", DriverId: "sdkwork-rtc-driver-twilio", DefaultSelected: false},
    {ProviderKey: "jitsi", PluginId: "rtc-jitsi", DriverId: "sdkwork-rtc-driver-jitsi", DefaultSelected: false},
    {ProviderKey: "janus", PluginId: "rtc-janus", DriverId: "sdkwork-rtc-driver-janus", DefaultSelected: false},
    {ProviderKey: "mediasoup", PluginId: "rtc-mediasoup", DriverId: "sdkwork-rtc-driver-mediasoup", DefaultSelected: false},
}

func GetRtcProviderByProviderKey(providerKey string) *RtcProviderCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDERS {
        if OFFICIAL_RTC_PROVIDERS[index].ProviderKey == providerKey {
            return &OFFICIAL_RTC_PROVIDERS[index]
        }
    }

    return nil
}
