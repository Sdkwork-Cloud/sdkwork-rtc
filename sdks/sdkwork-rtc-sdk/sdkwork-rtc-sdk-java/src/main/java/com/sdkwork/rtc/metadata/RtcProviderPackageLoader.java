package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcProviderPackageLoader {

  public static final String PROVIDER_PACKAGE_NOT_FOUND = "provider_package_not_found";
  public static final String PROVIDER_PACKAGE_IDENTITY_MISMATCH = "provider_package_identity_mismatch";
  public static final String PROVIDER_PACKAGE_LOAD_FAILED = "provider_package_load_failed";
  public static final String PROVIDER_MODULE_EXPORT_MISSING = "provider_module_export_missing";

  public record RtcProviderPackageLoadRequest(
      String providerKey,
      String packageIdentity
  ) {
  }

  public record RtcResolvedProviderPackageLoadTarget(
      RtcProviderPackageCatalog.RtcProviderPackageCatalogEntry packageEntry
  ) {
  }

  @FunctionalInterface
  public interface RtcProviderPackageImportFn {
    Object importPackage(RtcResolvedProviderPackageLoadTarget target);
  }

  @FunctionalInterface
  public interface RtcProviderPackageLoaderFn {
    Object load(RtcProviderPackageLoadRequest request);
  }

  public record RtcProviderPackageInstallRequest(
      Object driverManager,
      RtcProviderPackageLoadRequest loadRequest
  ) {
  }

  public static RtcResolvedProviderPackageLoadTarget resolveRtcProviderPackageLoadTarget(
      RtcProviderPackageLoadRequest request
  ) {
    var resolvedRequest = request == null
        ? new RtcProviderPackageLoadRequest(null, null)
        : request;
    var packageByProviderKey = Optional.ofNullable(resolvedRequest.providerKey())
        .flatMap(RtcProviderPackageCatalog::getRtcProviderPackageByProviderKey);
    var packageByIdentity = Optional.ofNullable(resolvedRequest.packageIdentity())
        .flatMap(RtcProviderPackageCatalog::getRtcProviderPackageByPackageIdentity);

    if (packageByProviderKey.isPresent() && packageByIdentity.isPresent()
        && !packageByProviderKey.get().packageIdentity().equals(packageByIdentity.get().packageIdentity())) {
      throw new RtcProviderPackageLoaderException(
          PROVIDER_PACKAGE_IDENTITY_MISMATCH,
          "providerKey and packageIdentity must resolve to the same provider package boundary."
      );
    }

    var resolvedPackage = packageByProviderKey.or(() -> packageByIdentity).orElseThrow(() ->
        new RtcProviderPackageLoaderException(
            PROVIDER_PACKAGE_NOT_FOUND,
            "No official provider package matches the requested provider boundary."
        )
    );

    return new RtcResolvedProviderPackageLoadTarget(resolvedPackage);
  }

  public static RtcProviderPackageLoaderFn createRtcProviderPackageLoader(
      RtcProviderPackageImportFn importPackage
  ) {
    return request -> loadRtcProviderModule(request, importPackage);
  }

  public static Object loadRtcProviderModule(
      RtcProviderPackageLoadRequest request,
      RtcProviderPackageImportFn importPackage
  ) {
    var target = resolveRtcProviderPackageLoadTarget(request);

    try {
      var namespace = importPackage.importPackage(target);
      if (namespace == null) {
        throw new RtcProviderPackageLoaderException(
            PROVIDER_MODULE_EXPORT_MISSING,
            "Reserved provider package loader scaffold requires an executable provider module namespace."
        );
      }

      return namespace;
    } catch (RtcProviderPackageLoaderException error) {
      throw error;
    } catch (RuntimeException error) {
      throw new RtcProviderPackageLoaderException(
          PROVIDER_PACKAGE_LOAD_FAILED,
          "Reserved provider package loader scaffold could not load "
              + target.packageEntry().packageIdentity()
              + ": "
              + error.getMessage()
      );
    }
  }

  public static void installRtcProviderPackage(
      RtcProviderPackageInstallRequest request,
      RtcProviderPackageImportFn importPackage
  ) {
    loadRtcProviderModule(request.loadRequest(), importPackage);

    throw new RtcProviderPackageLoaderException(
        PROVIDER_PACKAGE_LOAD_FAILED,
        "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
    );
  }

  public static void installRtcProviderPackages(
      List<RtcProviderPackageInstallRequest> requests,
      RtcProviderPackageImportFn importPackage
  ) {
    for (var request : requests) {
      loadRtcProviderModule(request.loadRequest(), importPackage);
    }

    if (!requests.isEmpty()) {
      throw new RtcProviderPackageLoaderException(
          PROVIDER_PACKAGE_LOAD_FAILED,
          "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
      );
    }
  }

  public static final class RtcProviderPackageLoaderException extends RuntimeException {
    private final String code;

    public RtcProviderPackageLoaderException(String code, String message) {
      super(message);
      this.code = code;
    }

    public String code() {
      return code;
    }
  }

  private RtcProviderPackageLoader() {
  }
}
