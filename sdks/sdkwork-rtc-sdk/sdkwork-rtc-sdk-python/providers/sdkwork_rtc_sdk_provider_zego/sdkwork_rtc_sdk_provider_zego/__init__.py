"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderZegoPackageContract:
    provider_key = "zego"
    plugin_id = "rtc-zego"
    driver_id = "sdkwork-rtc-driver-zego"
    package_identity = "sdkwork-rtc-sdk-provider-zego"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderZegoPackageContract"]
