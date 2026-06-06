from dataclasses import dataclass

from .driver_manager import RtcDriverManager
from .provider_catalog import DEFAULT_RTC_PROVIDER_KEY
from .provider_selection import RtcProviderSelection, RtcProviderSelectionRequest
from .provider_support import RtcProviderSupport


@dataclass(frozen=True)
class RtcDataSourceOptions:
    providerUrl: str | None = None
    providerKey: str | None = None
    tenantOverrideProviderKey: str | None = None
    deploymentProfileProviderKey: str | None = None
    defaultProviderKey: str = DEFAULT_RTC_PROVIDER_KEY


def _prefer(overrideValue: str | None, baseValue: str | None) -> str | None:
    return overrideValue if overrideValue is not None else baseValue


def _merge_options(
    base: RtcDataSourceOptions,
    overrides: RtcDataSourceOptions | None,
) -> RtcDataSourceOptions:
    if overrides is None:
        return base

    return RtcDataSourceOptions(
        providerUrl=_prefer(overrides.providerUrl, base.providerUrl),
        providerKey=_prefer(overrides.providerKey, base.providerKey),
        tenantOverrideProviderKey=_prefer(
            overrides.tenantOverrideProviderKey,
            base.tenantOverrideProviderKey,
        ),
        deploymentProfileProviderKey=_prefer(
            overrides.deploymentProfileProviderKey,
            base.deploymentProfileProviderKey,
        ),
        defaultProviderKey=overrides.defaultProviderKey or base.defaultProviderKey,
    )


class RtcDataSource:
    def __init__(
        self,
        options: RtcDataSourceOptions | None = None,
        driverManager: RtcDriverManager | None = None,
    ) -> None:
        self._options = options or RtcDataSourceOptions()
        self._driverManager = driverManager or RtcDriverManager()

    def describeSelection(
        self,
        overrides: RtcDataSourceOptions | None = None,
    ) -> RtcProviderSelection:
        merged = _merge_options(self._options, overrides)
        return self._driverManager.resolveSelection(
            RtcProviderSelectionRequest(
                providerUrl=merged.providerUrl,
                providerKey=merged.providerKey,
                tenantOverrideProviderKey=merged.tenantOverrideProviderKey,
                deploymentProfileProviderKey=merged.deploymentProfileProviderKey,
            ),
            defaultProviderKey=merged.defaultProviderKey,
        )

    def describeProviderSupport(
        self,
        overrides: RtcDataSourceOptions | None = None,
    ) -> RtcProviderSupport:
        selection = self.describeSelection(overrides)
        return self._driverManager.describeProviderSupport(selection.providerKey)

    def listProviderSupport(self) -> list[RtcProviderSupport]:
        return self._driverManager.listProviderSupport()
