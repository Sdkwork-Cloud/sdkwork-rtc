from dataclasses import dataclass
from enum import Enum


class RtcProviderSupportStatus(str, Enum):
    builtin_registered = "builtin_registered"
    official_registered = "official_registered"
    official_unregistered = "official_unregistered"
    unknown = "unknown"


@dataclass(frozen=True)
class RtcProviderSupport:
    providerKey: str
    status: RtcProviderSupportStatus
    builtin: bool
    official: bool
    registered: bool


@dataclass(frozen=True)
class RtcProviderSupportStateRequest:
    providerKey: str
    builtin: bool
    official: bool
    registered: bool


RTC_PROVIDER_SUPPORT_STATUSES = [
    "builtin_registered",
    "official_registered",
    "official_unregistered",
    "unknown",
]


def resolve_rtc_provider_support_status(
    request: RtcProviderSupportStateRequest,
) -> RtcProviderSupportStatus:
    if request.official and request.registered:
        return (
            RtcProviderSupportStatus.builtin_registered
            if request.builtin
            else RtcProviderSupportStatus.official_registered
        )

    if request.official:
        return RtcProviderSupportStatus.official_unregistered

    return RtcProviderSupportStatus.unknown


def create_rtc_provider_support_state(
    request: RtcProviderSupportStateRequest,
) -> RtcProviderSupport:
    return RtcProviderSupport(
        providerKey=request.providerKey,
        status=resolve_rtc_provider_support_status(request),
        builtin=request.builtin,
        official=request.official,
        registered=request.registered,
    )
