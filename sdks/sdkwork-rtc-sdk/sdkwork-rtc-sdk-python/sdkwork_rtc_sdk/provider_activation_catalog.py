from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RtcProviderActivationCatalogEntry:
    providerKey: str
    pluginId: str
    driverId: str
    activationStatus: str
    runtimeBridge: bool
    rootPublic: bool
    packageBoundary: bool
    builtin: bool
    packageIdentity: str


class RtcProviderActivationCatalog:
    recognizedActivationStatuses = [
        "package-boundary",
        "control-metadata-only",
    ]

    entries = [
        RtcProviderActivationCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "control-metadata-only", False, False, False, True, "sdkwork-rtc-sdk-provider-volcengine"),
        RtcProviderActivationCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "control-metadata-only", False, False, False, True, "sdkwork-rtc-sdk-provider-aliyun"),
        RtcProviderActivationCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "control-metadata-only", False, False, False, True, "sdkwork-rtc-sdk-provider-tencent"),
        RtcProviderActivationCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "control-metadata-only", False, False, False, True, "sdkwork-rtc-sdk-provider-agora"),
        RtcProviderActivationCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "control-metadata-only", False, False, False, False, "sdkwork-rtc-sdk-provider-zego"),
        RtcProviderActivationCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "control-metadata-only", False, False, False, True, "sdkwork-rtc-sdk-provider-livekit"),
        RtcProviderActivationCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "control-metadata-only", False, False, False, False, "sdkwork-rtc-sdk-provider-twilio"),
        RtcProviderActivationCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "control-metadata-only", False, False, False, False, "sdkwork-rtc-sdk-provider-jitsi"),
        RtcProviderActivationCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "control-metadata-only", False, False, False, False, "sdkwork-rtc-sdk-provider-janus"),
        RtcProviderActivationCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "control-metadata-only", False, False, False, False, "sdkwork-rtc-sdk-provider-mediasoup"),
    ]


def get_rtc_provider_activation_by_provider_key(provider_key: str) -> Optional[RtcProviderActivationCatalogEntry]:
    for entry in RtcProviderActivationCatalog.entries:
        if entry.providerKey == provider_key:
            return entry

    return None
