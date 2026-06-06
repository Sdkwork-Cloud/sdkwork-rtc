"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderTencentPackageContract:
    provider_key = "tencent"
    plugin_id = "rtc-tencent"
    driver_id = "sdkwork-rtc-driver-tencent"
    package_identity = "sdkwork-rtc-sdk-provider-tencent"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderTencentPackageContract"]
