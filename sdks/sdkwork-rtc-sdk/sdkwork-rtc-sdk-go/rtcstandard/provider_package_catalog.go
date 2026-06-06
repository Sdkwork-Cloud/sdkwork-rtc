package rtcstandard

type RtcProviderPackageCatalogEntry struct {
    ProviderKey         string
    PluginId            string
    DriverId            string
    PackageIdentity     string
    ManifestPath        string
    ReadmePath          string
    SourcePath          string
    SourceSymbol        string
    Builtin             bool
    RootPublic          bool
    Status              string
    RuntimeBridgeStatus string
}

type RtcProviderPackageCatalog struct{}

var OFFICIAL_RTC_PROVIDER_PACKAGES = []RtcProviderPackageCatalogEntry{
    {ProviderKey: "volcengine", PluginId: "rtc-volcengine", DriverId: "sdkwork-rtc-driver-volcengine", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-volcengine", ManifestPath: "providers/rtc-sdk-provider-volcengine/go.mod", ReadmePath: "providers/rtc-sdk-provider-volcengine/README.md", SourcePath: "providers/rtc-sdk-provider-volcengine/provider_package_contract.go", SourceSymbol: "RtcProviderVolcenginePackageContract", Builtin: true, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "aliyun", PluginId: "rtc-aliyun", DriverId: "sdkwork-rtc-driver-aliyun", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-aliyun", ManifestPath: "providers/rtc-sdk-provider-aliyun/go.mod", ReadmePath: "providers/rtc-sdk-provider-aliyun/README.md", SourcePath: "providers/rtc-sdk-provider-aliyun/provider_package_contract.go", SourceSymbol: "RtcProviderAliyunPackageContract", Builtin: true, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "tencent", PluginId: "rtc-tencent", DriverId: "sdkwork-rtc-driver-tencent", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-tencent", ManifestPath: "providers/rtc-sdk-provider-tencent/go.mod", ReadmePath: "providers/rtc-sdk-provider-tencent/README.md", SourcePath: "providers/rtc-sdk-provider-tencent/provider_package_contract.go", SourceSymbol: "RtcProviderTencentPackageContract", Builtin: true, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "agora", PluginId: "rtc-agora", DriverId: "sdkwork-rtc-driver-agora", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-agora", ManifestPath: "providers/rtc-sdk-provider-agora/go.mod", ReadmePath: "providers/rtc-sdk-provider-agora/README.md", SourcePath: "providers/rtc-sdk-provider-agora/provider_package_contract.go", SourceSymbol: "RtcProviderAgoraPackageContract", Builtin: true, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "zego", PluginId: "rtc-zego", DriverId: "sdkwork-rtc-driver-zego", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-zego", ManifestPath: "providers/rtc-sdk-provider-zego/go.mod", ReadmePath: "providers/rtc-sdk-provider-zego/README.md", SourcePath: "providers/rtc-sdk-provider-zego/provider_package_contract.go", SourceSymbol: "RtcProviderZegoPackageContract", Builtin: false, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "livekit", PluginId: "rtc-livekit", DriverId: "sdkwork-rtc-driver-livekit", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-livekit", ManifestPath: "providers/rtc-sdk-provider-livekit/go.mod", ReadmePath: "providers/rtc-sdk-provider-livekit/README.md", SourcePath: "providers/rtc-sdk-provider-livekit/provider_package_contract.go", SourceSymbol: "RtcProviderLivekitPackageContract", Builtin: true, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "twilio", PluginId: "rtc-twilio", DriverId: "sdkwork-rtc-driver-twilio", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-twilio", ManifestPath: "providers/rtc-sdk-provider-twilio/go.mod", ReadmePath: "providers/rtc-sdk-provider-twilio/README.md", SourcePath: "providers/rtc-sdk-provider-twilio/provider_package_contract.go", SourceSymbol: "RtcProviderTwilioPackageContract", Builtin: false, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "jitsi", PluginId: "rtc-jitsi", DriverId: "sdkwork-rtc-driver-jitsi", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-jitsi", ManifestPath: "providers/rtc-sdk-provider-jitsi/go.mod", ReadmePath: "providers/rtc-sdk-provider-jitsi/README.md", SourcePath: "providers/rtc-sdk-provider-jitsi/provider_package_contract.go", SourceSymbol: "RtcProviderJitsiPackageContract", Builtin: false, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "janus", PluginId: "rtc-janus", DriverId: "sdkwork-rtc-driver-janus", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-janus", ManifestPath: "providers/rtc-sdk-provider-janus/go.mod", ReadmePath: "providers/rtc-sdk-provider-janus/README.md", SourcePath: "providers/rtc-sdk-provider-janus/provider_package_contract.go", SourceSymbol: "RtcProviderJanusPackageContract", Builtin: false, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
    {ProviderKey: "mediasoup", PluginId: "rtc-mediasoup", DriverId: "sdkwork-rtc-driver-mediasoup", PackageIdentity: "github.com/sdkwork/rtc-sdk-provider-mediasoup", ManifestPath: "providers/rtc-sdk-provider-mediasoup/go.mod", ReadmePath: "providers/rtc-sdk-provider-mediasoup/README.md", SourcePath: "providers/rtc-sdk-provider-mediasoup/provider_package_contract.go", SourceSymbol: "RtcProviderMediasoupPackageContract", Builtin: false, RootPublic: false, Status: "future-runtime-bridge-only", RuntimeBridgeStatus: "reserved"},
}

func GetRtcProviderPackageByProviderKey(providerKey string) *RtcProviderPackageCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDER_PACKAGES {
        if OFFICIAL_RTC_PROVIDER_PACKAGES[index].ProviderKey == providerKey {
            return &OFFICIAL_RTC_PROVIDER_PACKAGES[index]
        }
    }

    return nil
}

func GetRtcProviderPackageByPackageIdentity(packageIdentity string) *RtcProviderPackageCatalogEntry {
    for index := range OFFICIAL_RTC_PROVIDER_PACKAGES {
        if OFFICIAL_RTC_PROVIDER_PACKAGES[index].PackageIdentity == packageIdentity {
            return &OFFICIAL_RTC_PROVIDER_PACKAGES[index]
        }
    }

    return nil
}
