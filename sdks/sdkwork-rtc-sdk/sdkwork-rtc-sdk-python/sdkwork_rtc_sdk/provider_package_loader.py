from dataclasses import dataclass
from typing import Any, Callable

from .provider_package_catalog import (
    RtcProviderPackageCatalogEntry,
    get_rtc_provider_package_by_package_identity,
    get_rtc_provider_package_by_provider_key,
)


class RtcProviderPackageLoaderException(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class RtcProviderPackageLoadRequest:
    providerKey: str | None = None
    packageIdentity: str | None = None


@dataclass(frozen=True)
class RtcResolvedProviderPackageLoadTarget:
    packageEntry: RtcProviderPackageCatalogEntry


RtcProviderModuleNamespace = dict[str, str]
RtcProviderPackageImportFn = Callable[
    [RtcResolvedProviderPackageLoadTarget],
    RtcProviderModuleNamespace,
]
RtcProviderPackageLoader = Callable[
    [RtcProviderPackageLoadRequest],
    RtcProviderModuleNamespace,
]


@dataclass(frozen=True)
class RtcProviderPackageInstallRequest:
    driverManager: Any
    loadRequest: RtcProviderPackageLoadRequest


def resolve_rtc_provider_package_load_target(
    request: RtcProviderPackageLoadRequest,
) -> RtcResolvedProviderPackageLoadTarget:
    package_by_provider_key = (
        get_rtc_provider_package_by_provider_key(request.providerKey)
        if request.providerKey
        else None
    )
    package_by_identity = (
        get_rtc_provider_package_by_package_identity(request.packageIdentity)
        if request.packageIdentity
        else None
    )

    if (
        package_by_provider_key is not None
        and package_by_identity is not None
        and package_by_provider_key.packageIdentity
        != package_by_identity.packageIdentity
    ):
        raise RtcProviderPackageLoaderException(
            "provider_package_identity_mismatch",
            "providerKey and packageIdentity must resolve to the same provider package boundary.",
        )

    resolved_package = package_by_provider_key or package_by_identity
    if resolved_package is None:
        raise RtcProviderPackageLoaderException(
            "provider_package_not_found",
            "No official provider package matches the requested provider boundary.",
        )

    return RtcResolvedProviderPackageLoadTarget(packageEntry=resolved_package)


def create_rtc_provider_package_loader(
    import_package: RtcProviderPackageImportFn,
) -> RtcProviderPackageLoader:
    def _loader(request: RtcProviderPackageLoadRequest) -> RtcProviderModuleNamespace:
        return load_rtc_provider_module(request, import_package)

    return _loader


def load_rtc_provider_module(
    request: RtcProviderPackageLoadRequest,
    import_package: RtcProviderPackageImportFn,
) -> RtcProviderModuleNamespace:
    target = resolve_rtc_provider_package_load_target(request)

    try:
        namespace = import_package(target)
    except RtcProviderPackageLoaderException:
        raise
    except Exception as error:  # pragma: no cover - scaffold-only failure wrapper
        raise RtcProviderPackageLoaderException(
            "provider_package_load_failed",
            f"Reserved provider package loader scaffold could not load {target.packageEntry.packageIdentity}: {error}",
        ) from error

    if not namespace:
        raise RtcProviderPackageLoaderException(
            "provider_module_export_missing",
            "Reserved provider package loader scaffold requires an executable provider module namespace.",
        )

    return namespace


def install_rtc_provider_package(
    request: RtcProviderPackageInstallRequest,
    import_package: RtcProviderPackageImportFn,
) -> None:
    load_rtc_provider_module(request.loadRequest, import_package)
    raise RtcProviderPackageLoaderException(
        "provider_package_load_failed",
        "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
    )


def install_rtc_provider_packages(
    requests: list[RtcProviderPackageInstallRequest],
    import_package: RtcProviderPackageImportFn,
) -> None:
    for request in requests:
        load_rtc_provider_module(request.loadRequest, import_package)

    if requests:
        raise RtcProviderPackageLoaderException(
            "provider_package_load_failed",
            "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
        )
