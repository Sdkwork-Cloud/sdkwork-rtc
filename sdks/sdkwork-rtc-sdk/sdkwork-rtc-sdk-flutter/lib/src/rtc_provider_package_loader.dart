import 'dart:async';

import 'rtc_driver_manager.dart';
import 'rtc_provider_package_catalog.dart';
import 'rtc_standard_contract.dart';
import 'rtc_types.dart';

final class RtcProviderPackageLoaderException implements Exception {
  const RtcProviderPackageLoaderException(this.code, this.message);

  final String code;
  final String message;

  @override
  String toString() => 'RtcProviderPackageLoaderException($code): $message';
}

typedef RtcProviderModuleDriverOptions<TNativeClient> = ({
  FutureOr<TNativeClient> Function(RtcResolvedClientConfig config)? nativeFactory,
  RtcRuntimeController<TNativeClient>? runtimeController,
});

final class RtcProviderModule<TNativeClient> {
  const RtcProviderModule({
    required this.packageName,
    required this.metadata,
    required this.builtin,
    required this.createDriver,
  });

  final String packageName;
  final RtcProviderMetadata metadata;
  final bool builtin;
  final RtcProviderDriver<TNativeClient> Function([
    RtcProviderModuleDriverOptions<TNativeClient>? options,
  ]) createDriver;
}

final class RtcProviderModuleRegistration<TNativeClient> {
  const RtcProviderModuleRegistration({
    required this.providerModule,
    this.options,
  });

  final RtcProviderModule<TNativeClient> providerModule;
  final RtcProviderModuleDriverOptions<TNativeClient>? options;
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
typedef RtcProviderPackageImportFn = Future<RtcProviderModuleNamespace> Function(
  RtcResolvedProviderPackageLoadTarget target,
);
typedef RtcProviderPackageLoader = Future<RtcProviderModuleNamespace> Function(
  RtcProviderPackageLoadRequest request,
);

final class RtcProviderPackageInstallRequest<TNativeClient> {
  const RtcProviderPackageInstallRequest({
    required this.driverManager,
    required this.loadRequest,
    this.options,
  });

  final RtcDriverManager driverManager;
  final RtcProviderPackageLoadRequest loadRequest;
  final RtcProviderModuleDriverOptions<TNativeClient>? options;
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
  return (request) async => loadRtcProviderModuleNamespace(
        request,
        importPackage: importPackage,
      );
}

Future<RtcProviderModuleNamespace> loadRtcProviderModuleNamespace(
  RtcProviderPackageLoadRequest request, {
  required RtcProviderPackageImportFn importPackage,
}) async {
  final target = resolveRtcProviderPackageLoadTarget(request);

  try {
    final namespace = await importPackage(target);
    if (namespace == null) {
      throw const RtcProviderPackageLoaderException(
        'provider_module_export_missing',
        'Provider package loader requires an executable provider module namespace.',
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

Future<RtcProviderModule<TNativeClient>> loadRtcProviderModule<TNativeClient>(
  RtcProviderPackageLoadRequest request, {
  required RtcProviderPackageImportFn importPackage,
}) async {
  final target = resolveRtcProviderPackageLoadTarget(request);
  final namespace = await loadRtcProviderModuleNamespace(
    request,
    importPackage: importPackage,
  );
  final providerModule = _extractProviderModule<TNativeClient>(namespace, target.packageEntry);
  _assertRtcProviderModuleContract(providerModule, target.packageEntry);

  return providerModule;
}

Future<void> installRtcProviderPackage<TNativeClient>(
  RtcProviderPackageInstallRequest<TNativeClient> request, {
  required RtcProviderPackageImportFn importPackage,
}) async {
  final providerModule = await loadRtcProviderModule<TNativeClient>(
    request.loadRequest,
    importPackage: importPackage,
  );
  request.driverManager.register(providerModule.createDriver(request.options));
}

Future<void> installRtcProviderPackages<TNativeClient>(
  Iterable<RtcProviderPackageInstallRequest<TNativeClient>> requests, {
  required RtcProviderPackageImportFn importPackage,
}) async {
  final materializedRequests = requests.toList(growable: false);
  if (materializedRequests.isEmpty) {
    return;
  }

  final manager = materializedRequests.first.driverManager;
  final drivers = <RtcProviderDriver<TNativeClient>>[];

  for (final request in materializedRequests) {
    if (!identical(request.driverManager, manager)) {
      throw const RtcProviderPackageLoaderException(
        'provider_module_contract_mismatch',
        'Batch RTC provider package installation requires one shared RtcDriverManager.',
      );
    }

    final providerModule = await loadRtcProviderModule<TNativeClient>(
      request.loadRequest,
      importPackage: importPackage,
    );
    drivers.add(providerModule.createDriver(request.options));
  }

  manager.registerAll(drivers);
}

RtcProviderModule<TNativeClient> _extractProviderModule<TNativeClient>(
  Object? namespace,
  RtcProviderPackageCatalogEntry packageEntry,
) {
  if (namespace is RtcProviderModule) {
    return namespace as RtcProviderModule<TNativeClient>;
  }

  if (namespace is Map<String, Object?>) {
    final value = namespace[packageEntry.sourceSymbol];
    if (value is RtcProviderModule) {
      return value as RtcProviderModule<TNativeClient>;
    }
  }

  throw RtcProviderPackageLoaderException(
    'provider_module_export_missing',
    'RTC provider package is missing the required provider module export: ${packageEntry.sourceSymbol}.',
  );
}

void _assertRtcProviderModuleContract<TNativeClient>(
  RtcProviderModule<TNativeClient> providerModule,
  RtcProviderPackageCatalogEntry packageEntry,
) {
  if (providerModule.packageName != packageEntry.packageIdentity) {
    throw const RtcProviderPackageLoaderException(
      'provider_module_contract_mismatch',
      'RTC provider module packageName must match the provider package catalog identity.',
    );
  }

  if (providerModule.metadata.providerKey != packageEntry.providerKey ||
      providerModule.metadata.pluginId != packageEntry.pluginId ||
      providerModule.metadata.driverId != packageEntry.driverId) {
    throw const RtcProviderPackageLoaderException(
      'provider_module_contract_mismatch',
      'RTC provider module metadata must match the provider package catalog entry.',
    );
  }
}
