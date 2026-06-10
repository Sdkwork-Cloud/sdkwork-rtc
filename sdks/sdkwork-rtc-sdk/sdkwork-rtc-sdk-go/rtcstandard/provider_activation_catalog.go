package rtcstandard

type RtcProviderActivationCatalogEntry struct {
    ProviderKey      string
    PluginId         string
    DriverId         string
    ActivationStatus string
    RuntimeBridge    bool
    RootPublic       bool
    PackageBoundary  bool
    Builtin          bool
    PackageIdentity  string
}

type RtcProviderActivationCatalog struct{}

var RTC_PROVIDER_ACTIVATION_STATUSES = []string{"package-boundary", "control-metadata-only"}

var OFFICIAL_RTC_PROVIDER_ACTIVATIONS = []RtcProviderActivationCatalogEntry{
    {ProviderKey: "volcengine", PluginId: "rtc-volcengine", DriverId: "sdkwork-rtc-driver-volcengine", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: true, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-volcengine"},
    {ProviderKey: "aliyun", PluginId: "rtc-aliyun", DriverId: "sdkwork-rtc-driver-aliyun", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: true, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-aliyun"},
    {ProviderKey: "tencent", PluginId: "rtc-tencent", DriverId: "sdkwork-rtc-driver-tencent", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: true, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-tencent"},
    {ProviderKey: "agora", PluginId: "rtc-agora", DriverId: "sdkwork-rtc-driver-agora", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: true, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-agora"},
    {ProviderKey: "zego", PluginId: "rtc-zego", DriverId: "sdkwork-rtc-driver-zego", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: false, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-zego"},
    {ProviderKey: "livekit", PluginId: "rtc-livekit", DriverId: "sdkwork-rtc-driver-livekit", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: true, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-livekit"},
    {ProviderKey: "twilio", PluginId: "rtc-twilio", DriverId: "sdkwork-rtc-driver-twilio", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: false, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-twilio"},
    {ProviderKey: "jitsi", PluginId: "rtc-jitsi", DriverId: "sdkwork-rtc-driver-jitsi", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: false, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-jitsi"},
    {ProviderKey: "janus", PluginId: "rtc-janus", DriverId: "sdkwork-rtc-driver-janus", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: false, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-janus"},
    {ProviderKey: "mediasoup", PluginId: "rtc-mediasoup", DriverId: "sdkwork-rtc-driver-mediasoup", ActivationStatus: "control-metadata-only", RuntimeBridge: false, RootPublic: false, PackageBoundary: false, Builtin: false, PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-mediasoup"},
}

func GetRtcProviderActivationByProviderKey(providerKey string) *RtcProviderActivationCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDER_ACTIVATIONS {
        if OFFICIAL_RTC_PROVIDER_ACTIVATIONS[index].ProviderKey == providerKey {
            return &OFFICIAL_RTC_PROVIDER_ACTIVATIONS[index]
        }
    }

    return nil
}
