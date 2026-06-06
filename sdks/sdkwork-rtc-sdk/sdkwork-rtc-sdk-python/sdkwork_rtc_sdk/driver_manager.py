from .provider_activation_catalog import get_rtc_provider_activation_by_provider_key
from .provider_catalog import (
    DEFAULT_RTC_PROVIDER_KEY,
    RtcProviderCatalog,
    get_rtc_provider_by_provider_key,
)
from .provider_selection import (
    RtcProviderSelection,
    RtcProviderSelectionRequest,
    resolve_rtc_provider_selection,
)
from .provider_support import (
    RtcProviderSupport,
    RtcProviderSupportStateRequest,
    create_rtc_provider_support_state,
)


class RtcDriverManager:
    def resolveSelection(
        self,
        request: RtcProviderSelectionRequest | None = None,
        *,
        defaultProviderKey: str = DEFAULT_RTC_PROVIDER_KEY,
    ) -> RtcProviderSelection:
        return resolve_rtc_provider_selection(
            request,
            default_provider_key=defaultProviderKey,
        )

    def describeProviderSupport(self, providerKey: str) -> RtcProviderSupport:
        official = get_rtc_provider_by_provider_key(providerKey) is not None
        activation = get_rtc_provider_activation_by_provider_key(providerKey)

        return create_rtc_provider_support_state(
            RtcProviderSupportStateRequest(
                providerKey=providerKey,
                builtin=activation.builtin if activation is not None else False,
                official=official,
                registered=activation.runtimeBridge if activation is not None else False,
            )
        )

    def listProviderSupport(self) -> list[RtcProviderSupport]:
        return [
            self.describeProviderSupport(entry.providerKey)
            for entry in RtcProviderCatalog.entries
        ]
