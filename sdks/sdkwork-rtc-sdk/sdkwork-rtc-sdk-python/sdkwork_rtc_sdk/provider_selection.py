from dataclasses import dataclass
from enum import Enum

from .provider_catalog import DEFAULT_RTC_PROVIDER_KEY


class RtcProviderSelectionSource(str, Enum):
    provider_url = "provider_url"
    provider_key = "provider_key"
    tenant_override = "tenant_override"
    deployment_profile = "deployment_profile"
    default_provider = "default_provider"


@dataclass(frozen=True)
class ParsedRtcProviderUrl:
    providerKey: str
    rawUrl: str


@dataclass(frozen=True)
class RtcProviderSelection:
    providerKey: str
    source: RtcProviderSelectionSource


@dataclass(frozen=True)
class RtcProviderSelectionRequest:
    providerUrl: str | None = None
    providerKey: str | None = None
    tenantOverrideProviderKey: str | None = None
    deploymentProfileProviderKey: str | None = None


RTC_PROVIDER_SELECTION_SOURCES = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
]

RTC_PROVIDER_SELECTION_PRECEDENCE = [
    "provider_url",
    "provider_key",
    "tenant_override",
    "deployment_profile",
    "default_provider",
]


def _has_rtc_provider_selection_text(value: str | None) -> bool:
    return value is not None and value.strip() != ""


def parse_rtc_provider_url(provider_url: str) -> ParsedRtcProviderUrl:
    trimmed = provider_url.strip()
    if not trimmed.startswith("rtc:") or "://" not in trimmed:
        raise ValueError(f"Invalid RTC provider URL: {provider_url}")

    return ParsedRtcProviderUrl(
        providerKey=trimmed[4:].split("://", 1)[0].lower(),
        rawUrl=provider_url,
    )


def resolve_rtc_provider_selection(
    request: RtcProviderSelectionRequest | None = None,
    *,
    default_provider_key: str = DEFAULT_RTC_PROVIDER_KEY,
) -> RtcProviderSelection:
    request = request or RtcProviderSelectionRequest()

    if _has_rtc_provider_selection_text(request.providerUrl):
        return RtcProviderSelection(
            providerKey=parse_rtc_provider_url(request.providerUrl).providerKey,
            source=RtcProviderSelectionSource.provider_url,
        )

    if _has_rtc_provider_selection_text(request.providerKey):
        return RtcProviderSelection(
            providerKey=request.providerKey.strip(),
            source=RtcProviderSelectionSource.provider_key,
        )

    if _has_rtc_provider_selection_text(request.tenantOverrideProviderKey):
        return RtcProviderSelection(
            providerKey=request.tenantOverrideProviderKey.strip(),
            source=RtcProviderSelectionSource.tenant_override,
        )

    if _has_rtc_provider_selection_text(request.deploymentProfileProviderKey):
        return RtcProviderSelection(
            providerKey=request.deploymentProfileProviderKey.strip(),
            source=RtcProviderSelectionSource.deployment_profile,
        )

    return RtcProviderSelection(
        providerKey=default_provider_key,
        source=RtcProviderSelectionSource.default_provider,
    )
