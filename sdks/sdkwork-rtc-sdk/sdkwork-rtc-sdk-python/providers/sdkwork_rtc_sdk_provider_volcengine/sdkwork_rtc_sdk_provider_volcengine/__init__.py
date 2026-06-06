"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderVolcenginePackageContract:
    provider_key = "volcengine"
    plugin_id = "rtc-volcengine"
    driver_id = "sdkwork-rtc-driver-volcengine"
    package_identity = "sdkwork-rtc-sdk-provider-volcengine"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderVolcenginePackageContract"]
