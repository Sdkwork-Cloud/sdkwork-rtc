"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderJitsiPackageContract:
    provider_key = "jitsi"
    plugin_id = "rtc-jitsi"
    driver_id = "sdkwork-rtc-driver-jitsi"
    package_identity = "sdkwork-rtc-sdk-provider-jitsi"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderJitsiPackageContract"]
