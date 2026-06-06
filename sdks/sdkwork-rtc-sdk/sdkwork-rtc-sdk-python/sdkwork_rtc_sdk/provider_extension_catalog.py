from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RtcProviderExtensionCatalogEntry:
    extensionKey: str
    providerKey: str
    displayName: str
    surface: str
    access: str
    status: str


class RtcProviderExtensionCatalog:
    recognizedSurfaces = [
        "control-plane",
        "runtime-bridge",
        "cross-surface",
    ]

    recognizedAccessModes = [
        "unwrap-only",
        "extension-object",
    ]

    recognizedStatuses = [
        "reference-baseline",
        "reserved",
    ]

    entries = [
        RtcProviderExtensionCatalogEntry("volcengine.native-client", "volcengine", "Volcengine Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        RtcProviderExtensionCatalogEntry("aliyun.native-client", "aliyun", "Aliyun Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        RtcProviderExtensionCatalogEntry("tencent.native-client", "tencent", "Tencent Native Client", "runtime-bridge", "unwrap-only", "reference-baseline"),
        RtcProviderExtensionCatalogEntry("agora.native-client", "agora", "Agora Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("zego.native-client", "zego", "ZEGO Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("livekit.native-client", "livekit", "LiveKit Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("twilio.native-client", "twilio", "Twilio Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("jitsi.native-client", "jitsi", "Jitsi Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("janus.native-client", "janus", "Janus Native Client", "runtime-bridge", "unwrap-only", "reserved"),
        RtcProviderExtensionCatalogEntry("mediasoup.native-client", "mediasoup", "mediasoup Native Client", "runtime-bridge", "unwrap-only", "reserved"),
    ]


def get_rtc_provider_extension_catalog() -> list[RtcProviderExtensionCatalogEntry]:
    return RtcProviderExtensionCatalog.entries


def get_rtc_provider_extension_descriptor(
    extension_key: str,
) -> Optional[RtcProviderExtensionCatalogEntry]:
    for entry in RtcProviderExtensionCatalog.entries:
        if entry.extensionKey == extension_key:
            return entry

    return None


def get_rtc_provider_extensions_for_provider(
    provider_key: str,
) -> list[RtcProviderExtensionCatalogEntry]:
    return [
        entry for entry in RtcProviderExtensionCatalog.entries if entry.providerKey == provider_key
    ]


def get_rtc_provider_extensions(
    extension_keys: list[str],
) -> list[RtcProviderExtensionCatalogEntry]:
    entries: list[RtcProviderExtensionCatalogEntry] = []
    for extension_key in extension_keys:
        entry = get_rtc_provider_extension_descriptor(extension_key)
        if entry is not None:
            entries.append(entry)

    return entries


def has_rtc_provider_extension(extension_keys: list[str], extension_key: str) -> bool:
    return extension_key in extension_keys and get_rtc_provider_extension_descriptor(extension_key) is not None
