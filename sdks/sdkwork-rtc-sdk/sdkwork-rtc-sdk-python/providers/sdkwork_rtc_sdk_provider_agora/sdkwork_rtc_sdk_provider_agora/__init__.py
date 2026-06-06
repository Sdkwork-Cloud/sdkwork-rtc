"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderAgoraPackageContract:
    provider_key = "agora"
    plugin_id = "rtc-agora"
    driver_id = "sdkwork-rtc-driver-agora"
    package_identity = "sdkwork-rtc-sdk-provider-agora"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderAgoraPackageContract"]
