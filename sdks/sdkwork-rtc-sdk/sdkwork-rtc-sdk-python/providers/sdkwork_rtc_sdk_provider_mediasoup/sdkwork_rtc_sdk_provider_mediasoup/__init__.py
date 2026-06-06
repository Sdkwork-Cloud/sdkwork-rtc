"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderMediasoupPackageContract:
    provider_key = "mediasoup"
    plugin_id = "rtc-mediasoup"
    driver_id = "sdkwork-rtc-driver-mediasoup"
    package_identity = "sdkwork-rtc-sdk-provider-mediasoup"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderMediasoupPackageContract"]
