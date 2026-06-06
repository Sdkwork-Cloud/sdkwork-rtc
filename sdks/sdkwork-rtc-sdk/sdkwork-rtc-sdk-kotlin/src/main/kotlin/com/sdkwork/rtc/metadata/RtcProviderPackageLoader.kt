package com.sdkwork.rtc.metadata

class RtcProviderPackageLoaderException(
    val code: String,
    override val message: String,
) : RuntimeException(message)

data class RtcProviderPackageLoadRequest(
    val providerKey: String? = null,
    val packageIdentity: String? = null,
)

data class RtcResolvedProviderPackageLoadTarget(
    val packageEntry: RtcProviderPackageCatalogEntry,
)

typealias RtcProviderModuleNamespace = Map<String, String>
typealias RtcProviderPackageImportFn = (RtcResolvedProviderPackageLoadTarget) -> RtcProviderModuleNamespace
typealias RtcProviderPackageLoader = (RtcProviderPackageLoadRequest) -> RtcProviderModuleNamespace

data class RtcProviderPackageInstallRequest(
    val driverManager: Any,
    val loadRequest: RtcProviderPackageLoadRequest,
)

fun resolveRtcProviderPackageLoadTarget(
    request: RtcProviderPackageLoadRequest,
): RtcResolvedProviderPackageLoadTarget {
    val packageByProviderKey = request.providerKey?.let { RtcProviderPackageCatalog.getRtcProviderPackageByProviderKey(it) }
    val packageByIdentity = request.packageIdentity?.let { RtcProviderPackageCatalog.getRtcProviderPackageByPackageIdentity(it) }

    if (packageByProviderKey != null
        && packageByIdentity != null
        && packageByProviderKey.packageIdentity != packageByIdentity.packageIdentity
    ) {
        throw RtcProviderPackageLoaderException(
            code = "provider_package_identity_mismatch",
            message = "providerKey and packageIdentity must resolve to the same provider package boundary.",
        )
    }

    val resolvedPackage = packageByProviderKey ?: packageByIdentity
        ?: throw RtcProviderPackageLoaderException(
            code = "provider_package_not_found",
            message = "No official provider package matches the requested provider boundary.",
        )

    return RtcResolvedProviderPackageLoadTarget(packageEntry = resolvedPackage)
}

fun createRtcProviderPackageLoader(
    importPackage: RtcProviderPackageImportFn,
): RtcProviderPackageLoader = { request ->
    loadRtcProviderModule(request, importPackage)
}

fun loadRtcProviderModule(
    request: RtcProviderPackageLoadRequest,
    importPackage: RtcProviderPackageImportFn,
): RtcProviderModuleNamespace {
    val target = resolveRtcProviderPackageLoadTarget(request)

    return try {
        val namespace = importPackage(target)
        if (namespace.isEmpty()) {
            throw RtcProviderPackageLoaderException(
                code = "provider_module_export_missing",
                message = "Reserved provider package loader scaffold requires an executable provider module namespace.",
            )
        }

        namespace
    } catch (error: RtcProviderPackageLoaderException) {
        throw error
    } catch (error: RuntimeException) {
        throw RtcProviderPackageLoaderException(
            code = "provider_package_load_failed",
            message = "Reserved provider package loader scaffold could not load ${target.packageEntry.packageIdentity}: ${error.message}",
        )
    }
}

fun installRtcProviderPackage(
    request: RtcProviderPackageInstallRequest,
    importPackage: RtcProviderPackageImportFn,
) {
    loadRtcProviderModule(request.loadRequest, importPackage)

    throw RtcProviderPackageLoaderException(
        code = "provider_package_load_failed",
        message = "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
    )
}

fun installRtcProviderPackages(
    requests: Iterable<RtcProviderPackageInstallRequest>,
    importPackage: RtcProviderPackageImportFn,
) {
    val materializedRequests = requests.toList()
    materializedRequests.forEach { request ->
        loadRtcProviderModule(request.loadRequest, importPackage)
    }

    if (materializedRequests.isNotEmpty()) {
        throw RtcProviderPackageLoaderException(
            code = "provider_package_load_failed",
            message = "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
        )
    }
}
