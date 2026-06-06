"""Metadata-only provider package scaffold. No runtime bridge is implemented here yet."""


class RtcProviderTwilioPackageContract:
    provider_key = "twilio"
    plugin_id = "rtc-twilio"
    driver_id = "sdkwork-rtc-driver-twilio"
    package_identity = "sdkwork-rtc-sdk-provider-twilio"
    status = "future-runtime-bridge-only"
    runtime_bridge_status = "reserved"
    root_public = False


__all__ = ["RtcProviderTwilioPackageContract"]
