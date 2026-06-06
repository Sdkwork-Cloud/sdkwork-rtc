public struct RtcProviderPackageLoaderException: Error {
    public let code: String
    public let message: String

    public init(code: String, message: String) {
        self.code = code
        self.message = message
    }
}

public struct RtcProviderPackageLoadRequest {
    public let providerKey: String?
    public let packageIdentity: String?

    public init(providerKey: String? = nil, packageIdentity: String? = nil) {
        self.providerKey = providerKey
        self.packageIdentity = packageIdentity
    }
}

public struct RtcResolvedProviderPackageLoadTarget {
    public let packageEntry: RtcProviderPackageCatalogEntry

    public init(packageEntry: RtcProviderPackageCatalogEntry) {
        self.packageEntry = packageEntry
    }
}

public typealias RtcProviderModuleNamespace = [String: String]
public typealias RtcProviderPackageImportFn = (RtcResolvedProviderPackageLoadTarget) throws -> RtcProviderModuleNamespace
public typealias RtcProviderPackageLoader = (RtcProviderPackageLoadRequest) throws -> RtcProviderModuleNamespace

public struct RtcProviderPackageInstallRequest {
    public let driverManager: Any
    public let loadRequest: RtcProviderPackageLoadRequest

    public init(driverManager: Any, loadRequest: RtcProviderPackageLoadRequest) {
        self.driverManager = driverManager
        self.loadRequest = loadRequest
    }
}

public func resolveRtcProviderPackageLoadTarget(
    _ request: RtcProviderPackageLoadRequest
) throws -> RtcResolvedProviderPackageLoadTarget {
    let packageByProviderKey = request.providerKey.flatMap(RtcProviderPackageCatalog.getRtcProviderPackageByProviderKey)
    let packageByIdentity = request.packageIdentity.flatMap(RtcProviderPackageCatalog.getRtcProviderPackageByPackageIdentity)

    if let providerKeyEntry = packageByProviderKey,
       let packageIdentityEntry = packageByIdentity,
       providerKeyEntry.packageIdentity != packageIdentityEntry.packageIdentity {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_identity_mismatch",
            message: "providerKey and packageIdentity must resolve to the same provider package boundary."
        )
    }

    guard let resolvedPackage = packageByProviderKey ?? packageByIdentity else {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_not_found",
            message: "No official provider package matches the requested provider boundary."
        )
    }

    return RtcResolvedProviderPackageLoadTarget(packageEntry: resolvedPackage)
}

public func createRtcProviderPackageLoader(
    importPackage: @escaping RtcProviderPackageImportFn
) -> RtcProviderPackageLoader {
    return { request in
        try loadRtcProviderModule(request, importPackage: importPackage)
    }
}

public func loadRtcProviderModule(
    _ request: RtcProviderPackageLoadRequest,
    importPackage: RtcProviderPackageImportFn
) throws -> RtcProviderModuleNamespace {
    let target = try resolveRtcProviderPackageLoadTarget(request)

    do {
        let namespace = try importPackage(target)
        if namespace.isEmpty {
            throw RtcProviderPackageLoaderException(
                code: "provider_module_export_missing",
                message: "Reserved provider package loader scaffold requires an executable provider module namespace."
            )
        }

        return namespace
    } catch let error as RtcProviderPackageLoaderException {
        throw error
    } catch {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_load_failed",
            message: "Reserved provider package loader scaffold could not load \(target.packageEntry.packageIdentity): \(error)"
        )
    }
}

public func installRtcProviderPackage(
    _ request: RtcProviderPackageInstallRequest,
    importPackage: RtcProviderPackageImportFn
) throws {
    _ = try loadRtcProviderModule(request.loadRequest, importPackage: importPackage)

    throw RtcProviderPackageLoaderException(
        code: "provider_package_load_failed",
        message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
    )
}

public func installRtcProviderPackages(
    _ requests: [RtcProviderPackageInstallRequest],
    importPackage: RtcProviderPackageImportFn
) throws {
    for request in requests {
        _ = try loadRtcProviderModule(request.loadRequest, importPackage: importPackage)
    }

    if !requests.isEmpty {
        throw RtcProviderPackageLoaderException(
            code: "provider_package_load_failed",
            message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
        )
    }
}
