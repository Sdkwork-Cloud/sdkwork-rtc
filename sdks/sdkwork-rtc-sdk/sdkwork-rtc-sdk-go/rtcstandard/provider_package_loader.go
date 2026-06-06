package rtcstandard

import "fmt"

type RtcProviderPackageLoaderError struct {
	Code    string
	Message string
}

func (e RtcProviderPackageLoaderError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

type RtcProviderPackageLoadRequest struct {
	ProviderKey     string
	PackageIdentity string
}

type RtcResolvedProviderPackageLoadTarget struct {
	PackageEntry RtcProviderPackageCatalogEntry
}

type RtcProviderModuleNamespace map[string]string
type RtcProviderPackageImportFn func(RtcResolvedProviderPackageLoadTarget) (RtcProviderModuleNamespace, error)
type RtcProviderPackageLoader func(RtcProviderPackageLoadRequest) (RtcProviderModuleNamespace, error)

type RtcProviderPackageInstallRequest struct {
	DriverManager any
	LoadRequest   RtcProviderPackageLoadRequest
}

func ResolveRtcProviderPackageLoadTarget(
	request RtcProviderPackageLoadRequest,
) (RtcResolvedProviderPackageLoadTarget, error) {
	var packageByProviderKey *RtcProviderPackageCatalogEntry
	if request.ProviderKey != "" {
		packageByProviderKey = GetRtcProviderPackageByProviderKey(request.ProviderKey)
	}

	var packageByIdentity *RtcProviderPackageCatalogEntry
	if request.PackageIdentity != "" {
		packageByIdentity = GetRtcProviderPackageByPackageIdentity(request.PackageIdentity)
	}

	if packageByProviderKey != nil && packageByIdentity != nil && packageByProviderKey.PackageIdentity != packageByIdentity.PackageIdentity {
		return RtcResolvedProviderPackageLoadTarget{}, RtcProviderPackageLoaderError{
			Code:    "provider_package_identity_mismatch",
			Message: "providerKey and packageIdentity must resolve to the same provider package boundary.",
		}
	}

	resolvedPackage := packageByProviderKey
	if resolvedPackage == nil {
		resolvedPackage = packageByIdentity
	}

	if resolvedPackage == nil {
		return RtcResolvedProviderPackageLoadTarget{}, RtcProviderPackageLoaderError{
			Code:    "provider_package_not_found",
			Message: "No official provider package matches the requested provider boundary.",
		}
	}

	return RtcResolvedProviderPackageLoadTarget{PackageEntry: *resolvedPackage}, nil
}

func CreateRtcProviderPackageLoader(importPackage RtcProviderPackageImportFn) RtcProviderPackageLoader {
	return func(request RtcProviderPackageLoadRequest) (RtcProviderModuleNamespace, error) {
		return LoadRtcProviderModule(request, importPackage)
	}
}

func LoadRtcProviderModule(
	request RtcProviderPackageLoadRequest,
	importPackage RtcProviderPackageImportFn,
) (RtcProviderModuleNamespace, error) {
	target, err := ResolveRtcProviderPackageLoadTarget(request)
	if err != nil {
		return nil, err
	}

	namespace, err := importPackage(target)
	if err != nil {
		return nil, RtcProviderPackageLoaderError{
			Code:    "provider_package_load_failed",
			Message: fmt.Sprintf("Reserved provider package loader scaffold could not load %s: %v", target.PackageEntry.PackageIdentity, err),
		}
	}

	if len(namespace) == 0 {
		return nil, RtcProviderPackageLoaderError{
			Code:    "provider_module_export_missing",
			Message: "Reserved provider package loader scaffold requires an executable provider module namespace.",
		}
	}

	return namespace, nil
}

func InstallRtcProviderPackage(
	request RtcProviderPackageInstallRequest,
	importPackage RtcProviderPackageImportFn,
) error {
	if _, err := LoadRtcProviderModule(request.LoadRequest, importPackage); err != nil {
		return err
	}

	return RtcProviderPackageLoaderError{
		Code:    "provider_package_load_failed",
		Message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
	}
}

func InstallRtcProviderPackages(
	requests []RtcProviderPackageInstallRequest,
	importPackage RtcProviderPackageImportFn,
) error {
	for _, request := range requests {
		if _, err := LoadRtcProviderModule(request.LoadRequest, importPackage); err != nil {
			return err
		}
	}

	if len(requests) > 0 {
		return RtcProviderPackageLoaderError{
			Code:    "provider_package_load_failed",
			Message: "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
		}
	}

	return nil
}
