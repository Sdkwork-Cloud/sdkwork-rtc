from dataclasses import dataclass


@dataclass(frozen=True)
class RtcProviderPackageCatalogEntry:
    providerKey: str
    pluginId: str
    driverId: str
    packageIdentity: str
    manifestPath: str
    readmePath: str
    sourcePath: str
    sourceSymbol: str
    builtin: bool
    rootPublic: bool
    status: str
    runtimeBridgeStatus: str


class RtcProviderPackageCatalog:
    entries = [
        RtcProviderPackageCatalogEntry("volcengine", "rtc-volcengine", "sdkwork-rtc-driver-volcengine", "sdkwork-rtc-sdk-provider-volcengine", "providers/sdkwork_rtc_sdk_provider_volcengine/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_volcengine/README.md", "providers/sdkwork_rtc_sdk_provider_volcengine/sdkwork_rtc_sdk_provider_volcengine/__init__.py", "RtcProviderVolcenginePackageContract", True, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("aliyun", "rtc-aliyun", "sdkwork-rtc-driver-aliyun", "sdkwork-rtc-sdk-provider-aliyun", "providers/sdkwork_rtc_sdk_provider_aliyun/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_aliyun/README.md", "providers/sdkwork_rtc_sdk_provider_aliyun/sdkwork_rtc_sdk_provider_aliyun/__init__.py", "RtcProviderAliyunPackageContract", True, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("tencent", "rtc-tencent", "sdkwork-rtc-driver-tencent", "sdkwork-rtc-sdk-provider-tencent", "providers/sdkwork_rtc_sdk_provider_tencent/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_tencent/README.md", "providers/sdkwork_rtc_sdk_provider_tencent/sdkwork_rtc_sdk_provider_tencent/__init__.py", "RtcProviderTencentPackageContract", True, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("agora", "rtc-agora", "sdkwork-rtc-driver-agora", "sdkwork-rtc-sdk-provider-agora", "providers/sdkwork_rtc_sdk_provider_agora/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_agora/README.md", "providers/sdkwork_rtc_sdk_provider_agora/sdkwork_rtc_sdk_provider_agora/__init__.py", "RtcProviderAgoraPackageContract", True, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("zego", "rtc-zego", "sdkwork-rtc-driver-zego", "sdkwork-rtc-sdk-provider-zego", "providers/sdkwork_rtc_sdk_provider_zego/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_zego/README.md", "providers/sdkwork_rtc_sdk_provider_zego/sdkwork_rtc_sdk_provider_zego/__init__.py", "RtcProviderZegoPackageContract", False, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("livekit", "rtc-livekit", "sdkwork-rtc-driver-livekit", "sdkwork-rtc-sdk-provider-livekit", "providers/sdkwork_rtc_sdk_provider_livekit/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_livekit/README.md", "providers/sdkwork_rtc_sdk_provider_livekit/sdkwork_rtc_sdk_provider_livekit/__init__.py", "RtcProviderLivekitPackageContract", True, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("twilio", "rtc-twilio", "sdkwork-rtc-driver-twilio", "sdkwork-rtc-sdk-provider-twilio", "providers/sdkwork_rtc_sdk_provider_twilio/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_twilio/README.md", "providers/sdkwork_rtc_sdk_provider_twilio/sdkwork_rtc_sdk_provider_twilio/__init__.py", "RtcProviderTwilioPackageContract", False, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("jitsi", "rtc-jitsi", "sdkwork-rtc-driver-jitsi", "sdkwork-rtc-sdk-provider-jitsi", "providers/sdkwork_rtc_sdk_provider_jitsi/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_jitsi/README.md", "providers/sdkwork_rtc_sdk_provider_jitsi/sdkwork_rtc_sdk_provider_jitsi/__init__.py", "RtcProviderJitsiPackageContract", False, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("janus", "rtc-janus", "sdkwork-rtc-driver-janus", "sdkwork-rtc-sdk-provider-janus", "providers/sdkwork_rtc_sdk_provider_janus/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_janus/README.md", "providers/sdkwork_rtc_sdk_provider_janus/sdkwork_rtc_sdk_provider_janus/__init__.py", "RtcProviderJanusPackageContract", False, False, "future-runtime-bridge-only", "reserved"),
        RtcProviderPackageCatalogEntry("mediasoup", "rtc-mediasoup", "sdkwork-rtc-driver-mediasoup", "sdkwork-rtc-sdk-provider-mediasoup", "providers/sdkwork_rtc_sdk_provider_mediasoup/pyproject.toml", "providers/sdkwork_rtc_sdk_provider_mediasoup/README.md", "providers/sdkwork_rtc_sdk_provider_mediasoup/sdkwork_rtc_sdk_provider_mediasoup/__init__.py", "RtcProviderMediasoupPackageContract", False, False, "future-runtime-bridge-only", "reserved"),
    ]


def get_rtc_provider_package_by_provider_key(provider_key: str) -> Optional[RtcProviderPackageCatalogEntry]:
    for entry in RtcProviderPackageCatalog.entries:
        if entry.providerKey == provider_key:
            return entry

    return None


def get_rtc_provider_package_by_package_identity(package_identity: str) -> Optional[RtcProviderPackageCatalogEntry]:
    for entry in RtcProviderPackageCatalog.entries:
        if entry.packageIdentity == package_identity:
            return entry

    return None
