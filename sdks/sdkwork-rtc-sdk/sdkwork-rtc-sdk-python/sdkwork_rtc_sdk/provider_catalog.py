from dataclasses import dataclass
from typing import Optional


DEFAULT_RTC_PROVIDER_KEY = "volcengine"


@dataclass(frozen=True)
class RtcProviderCatalogEntry:
    providerKey: str
    pluginId: str
    driverId: str
    defaultSelected: bool


class RtcProviderCatalog:
    entries = [
        RtcProviderCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", True),
        RtcProviderCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", False),
        RtcProviderCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", False),
        RtcProviderCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", False),
        RtcProviderCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", False),
        RtcProviderCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", False),
        RtcProviderCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", False),
        RtcProviderCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", False),
        RtcProviderCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", False),
        RtcProviderCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", False),
    ]


def get_rtc_provider_by_provider_key(provider_key: str) -> Optional[RtcProviderCatalogEntry]:
    for entry in RtcProviderCatalog.entries:
        if entry.providerKey == provider_key:
            return entry

    return None
