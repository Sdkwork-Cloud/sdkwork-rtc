"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderLivekitPackageContract:
    provider_key = "livekit"
    plugin_id = "rtc-livekit"
    driver_id = "sdkwork-rtc-driver-livekit"
    package_identity = "sdkwork-rtc-sdk-provider-livekit"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderLivekitPackageContract"]
