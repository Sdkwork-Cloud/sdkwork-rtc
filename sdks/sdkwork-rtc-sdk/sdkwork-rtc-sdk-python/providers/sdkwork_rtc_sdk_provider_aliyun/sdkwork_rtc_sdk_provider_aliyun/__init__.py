"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderAliyunPackageContract:
    provider_key = "aliyun"
    plugin_id = "rtc-aliyun"
    driver_id = "sdkwork-rtc-driver-aliyun"
    package_identity = "sdkwork-rtc-sdk-provider-aliyun"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderAliyunPackageContract"]
