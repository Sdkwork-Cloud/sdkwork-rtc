import 'rtc_provider_package_catalog.dart';

final class RtcProviderPackageLoaderException implements Exception {
  const RtcProviderPackageLoaderException(this.code, this.message);

  final String code;
  final String message;

  @override
  String toString() => 'RtcProviderPackageLoaderException($code): $message';
}

final class RtcProviderPackageLoadRequest {
  const RtcProviderPackageLoadRequest({
    this.providerKey,
    this.packageIdentity,
  });

  final String? providerKey;
  final String? packageIdentity;
}

final class RtcResolvedProviderPackageLoadTarget {
  const RtcResolvedProviderPackageLoadTarget({
    required this.packageEntry,
  });

  final RtcProviderPackageCatalogEntry packageEntry;
}

typedef RtcProviderModuleNamespace = Object?;
typedef RtcProviderPackageImportFn = RtcProviderModuleNamespace Function(
  RtcResolvedProviderPackageLoadTarget target,
);
typedef RtcProviderPackageLoader = RtcProviderModuleNamespace Function(
  RtcProviderPackageLoadRequest request,
);

final class RtcProviderPackageInstallRequest {
  const RtcProviderPackageInstallRequest({
    required this.driverManager,
    required this.loadRequest,
  });

  final Object driverManager;
  final RtcProviderPackageLoadRequest loadRequest;
}

RtcResolvedProviderPackageLoadTarget resolveRtcProviderPackageLoadTarget(
  RtcProviderPackageLoadRequest request,
) {
  final packageByProviderKey = request.providerKey == null
      ? null
      : getRtcProviderPackageByProviderKey(request.providerKey!);
  final packageByIdentity = request.packageIdentity == null
      ? null
      : getRtcProviderPackageByPackageIdentity(request.packageIdentity!);

  if (packageByProviderKey != null &&
      packageByIdentity != null &&
      packageByProviderKey.packageIdentity != packageByIdentity.packageIdentity) {
    throw const RtcProviderPackageLoaderException(
      'provider_package_identity_mismatch',
      'providerKey and packageIdentity must resolve to the same provider package boundary.',
    );
  }

  final resolvedPackage = packageByProviderKey ?? packageByIdentity;
  if (resolvedPackage == null) {
    throw const RtcProviderPackageLoaderException(
      'provider_package_not_found',
      'No official provider package matches the requested provider boundary.',
    );
  }

  return RtcResolvedProviderPackageLoadTarget(packageEntry: resolvedPackage);
}

RtcProviderPackageLoader createRtcProviderPackageLoader({
  required RtcProviderPackageImportFn importPackage,
}) {
  return (request) => loadRtcProviderModule(
        request,
        importPackage: importPackage,
      );
}

RtcProviderModuleNamespace loadRtcProviderModule(
  RtcProviderPackageLoadRequest request, {
  required RtcProviderPackageImportFn importPackage,
}) {
  final target = resolveRtcProviderPackageLoadTarget(request);

  try {
    final namespace = importPackage(target);
    if (namespace == null) {
      throw const RtcProviderPackageLoaderException(
        'provider_module_export_missing',
        'Reserved provider package loader scaffold requires an executable provider module namespace.',
      );
    }

    return namespace;
  } on RtcProviderPackageLoaderException {
    rethrow;
  } catch (error) {
    throw RtcProviderPackageLoaderException(
      'provider_package_load_failed',
      'Reserved provider package loader scaffold could not load ${target.packageEntry.packageIdentity}: $error',
    );
  }
}

void installRtcProviderPackage(
  RtcProviderPackageInstallRequest request, {
  required RtcProviderPackageImportFn importPackage,
}) {
  loadRtcProviderModule(
    request.loadRequest,
    importPackage: importPackage,
  );

  throw const RtcProviderPackageLoaderException(
    'provider_package_load_failed',
    'Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.',
  );
}

void installRtcProviderPackages(
  Iterable<RtcProviderPackageInstallRequest> requests, {
  required RtcProviderPackageImportFn importPackage,
}) {
  final materializedRequests = requests.toList(growable: false);
  for (final request in materializedRequests) {
    loadRtcProviderModule(
      request.loadRequest,
      importPackage: importPackage,
    );
  }

  if (materializedRequests.isNotEmpty) {
    throw const RtcProviderPackageLoaderException(
      'provider_package_load_failed',
      'Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.',
    );
  }
}
