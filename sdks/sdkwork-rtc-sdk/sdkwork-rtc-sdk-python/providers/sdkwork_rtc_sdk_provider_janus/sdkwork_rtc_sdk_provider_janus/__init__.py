"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderJanusPackageContract:
    provider_key = "janus"
    plugin_id = "rtc-janus"
    driver_id = "sdkwork-rtc-driver-janus"
    package_identity = "sdkwork-rtc-sdk-provider-janus"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderJanusPackageContract"]
