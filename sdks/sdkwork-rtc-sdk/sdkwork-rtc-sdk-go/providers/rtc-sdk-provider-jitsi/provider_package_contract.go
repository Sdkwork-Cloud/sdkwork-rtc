package rtcprovider

// Metadata-only provider package scaffold. No runtime bridge is implemented here yet.
type RtcProviderJitsiPackageContract struct{}

const (
	RtcProviderJitsiPackageContractProviderKey = "jitsi"
	RtcProviderJitsiPackageContractPluginID = "rtc-jitsi"
	RtcProviderJitsiPackageContractDriverID = "sdkwork-rtc-driver-jitsi"
	RtcProviderJitsiPackageContractPackageIdentity = "github.com/sdkwork/rtc-sdk-provider-jitsi"
	RtcProviderJitsiPackageContractStatus = "future-runtime-bridge-only"
	RtcProviderJitsiPackageContractRuntimeBridgeStatus = "reserved"
)

const RtcProviderJitsiPackageContractRootPublic = false
