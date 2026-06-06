package rtcprovider

// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
type RtcProviderJanusPackageContract struct{}

const (
	RtcProviderJanusPackageContractProviderKey = "janus"
	RtcProviderJanusPackageContractPluginID = "rtc-janus"
	RtcProviderJanusPackageContractDriverID = "sdkwork-rtc-driver-janus"
	RtcProviderJanusPackageContractPackageIdentity = "github.com/sdkwork/rtc-sdk-provider-janus"
	RtcProviderJanusPackageContractStatus = "future-runtime-bridge-only"
	RtcProviderJanusPackageContractRuntimeBridgeStatus = "reserved"
)

const RtcProviderJanusPackageContractRootPublic = false
