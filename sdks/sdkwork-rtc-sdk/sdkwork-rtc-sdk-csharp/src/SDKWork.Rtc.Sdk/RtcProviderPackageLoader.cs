namespace Sdkwork.Rtc.Sdk;

using System;
using System.Collections.Generic;
using System.Linq;

public sealed class RtcProviderPackageLoaderException : Exception
{
    public RtcProviderPackageLoaderException(string code, string message)
        : base(message)
    {
        this.code = code;
    }

    public string code { get; }
}

public sealed record RtcProviderPackageLoadRequest(
    string? providerKey = null,
    string? packageIdentity = null
);

public sealed record RtcResolvedProviderPackageLoadTarget(
    RtcProviderPackageCatalogEntry packageEntry
);

public delegate object? RtcProviderPackageImportFn(RtcResolvedProviderPackageLoadTarget target);
public delegate object? RtcProviderPackageLoaderFn(RtcProviderPackageLoadRequest request);

public sealed record RtcProviderPackageInstallRequest(
    object driverManager,
    RtcProviderPackageLoadRequest loadRequest
);

public static class RtcProviderPackageLoader
{
    public const string ProviderPackageNotFound = "provider_package_not_found";
    public const string ProviderPackageIdentityMismatch = "provider_package_identity_mismatch";
    public const string ProviderPackageLoadFailed = "provider_package_load_failed";
    public const string ProviderModuleExportMissing = "provider_module_export_missing";

    public static RtcResolvedProviderPackageLoadTarget ResolveRtcProviderPackageLoadTarget(
        RtcProviderPackageLoadRequest? request
    )
    {
        request ??= new RtcProviderPackageLoadRequest();
        var packageByProviderKey = string.IsNullOrWhiteSpace(request.providerKey)
            ? null
            : RtcProviderPackageCatalog.GetRtcProviderPackageByProviderKey(request.providerKey!);
        var packageByIdentity = string.IsNullOrWhiteSpace(request.packageIdentity)
            ? null
            : RtcProviderPackageCatalog.GetRtcProviderPackageByPackageIdentity(request.packageIdentity!);

        if (packageByProviderKey is not null
            && packageByIdentity is not null
            && !string.Equals(packageByProviderKey.packageIdentity, packageByIdentity.packageIdentity, StringComparison.Ordinal))
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageIdentityMismatch,
                "providerKey and packageIdentity must resolve to the same provider package boundary."
            );
        }

        var resolvedPackage = packageByProviderKey ?? packageByIdentity;
        if (resolvedPackage is null)
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageNotFound,
                "No official provider package matches the requested provider boundary."
            );
        }

        return new RtcResolvedProviderPackageLoadTarget(resolvedPackage);
    }

    public static RtcProviderPackageLoaderFn CreateRtcProviderPackageLoader(
        RtcProviderPackageImportFn importPackage
    ) => request => LoadRtcProviderModule(request, importPackage);

    public static object? LoadRtcProviderModule(
        RtcProviderPackageLoadRequest request,
        RtcProviderPackageImportFn importPackage
    )
    {
        var target = ResolveRtcProviderPackageLoadTarget(request);

        try
        {
            var providerModule = importPackage(target);
            if (providerModule is null)
            {
                throw new RtcProviderPackageLoaderException(
                    ProviderModuleExportMissing,
                    "Reserved provider package loader scaffold requires an executable provider module namespace."
                );
            }

            return providerModule;
        }
        catch (RtcProviderPackageLoaderException)
        {
            throw;
        }
        catch (Exception error)
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageLoadFailed,
                $"Reserved provider package loader scaffold could not load {target.packageEntry.packageIdentity}: {error.Message}"
            );
        }
    }

    public static void InstallRtcProviderPackage(
        RtcProviderPackageInstallRequest request,
        RtcProviderPackageImportFn importPackage
    )
    {
        _ = LoadRtcProviderModule(request.loadRequest, importPackage);

        throw new RtcProviderPackageLoaderException(
            ProviderPackageLoadFailed,
            "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
        );
    }

    public static void InstallRtcProviderPackages(
        IReadOnlyList<RtcProviderPackageInstallRequest> requests,
        RtcProviderPackageImportFn importPackage
    )
    {
        foreach (var request in requests)
        {
            _ = LoadRtcProviderModule(request.loadRequest, importPackage);
        }

        if (requests.Count > 0)
        {
            throw new RtcProviderPackageLoaderException(
                ProviderPackageLoadFailed,
                "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands."
            );
        }
    }
}
