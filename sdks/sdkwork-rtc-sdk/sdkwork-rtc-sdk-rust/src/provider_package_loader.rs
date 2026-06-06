use std::collections::BTreeMap;

use crate::provider_package_catalog::{
    get_rtc_provider_package_by_package_identity, get_rtc_provider_package_by_provider_key,
    RtcProviderPackageCatalogEntry,
};

#[derive(Debug, Clone)]
pub struct RtcProviderPackageLoaderError {
    pub code: &'static str,
    pub message: String,
}

impl RtcProviderPackageLoaderError {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

#[derive(Debug, Clone, Default)]
#[allow(non_snake_case)]
pub struct RtcProviderPackageLoadRequest {
    pub providerKey: Option<String>,
    pub packageIdentity: Option<String>,
}

#[allow(non_snake_case)]
pub struct RtcResolvedProviderPackageLoadTarget {
    pub packageEntry: &'static RtcProviderPackageCatalogEntry,
}

pub type RtcProviderModuleNamespace = BTreeMap<String, String>;
pub type RtcProviderPackageImportFn =
    fn(&RtcResolvedProviderPackageLoadTarget) -> Result<RtcProviderModuleNamespace, RtcProviderPackageLoaderError>;
pub type RtcProviderPackageLoader = Box<
    dyn Fn(RtcProviderPackageLoadRequest) -> Result<RtcProviderModuleNamespace, RtcProviderPackageLoaderError>,
>;

#[allow(non_snake_case)]
pub struct RtcProviderPackageInstallRequest<TDriverManager> {
    pub driverManager: TDriverManager,
    pub loadRequest: RtcProviderPackageLoadRequest,
}

pub fn resolve_rtc_provider_package_load_target(
    request: &RtcProviderPackageLoadRequest,
) -> Result<RtcResolvedProviderPackageLoadTarget, RtcProviderPackageLoaderError> {
    let package_by_provider_key = request
        .providerKey
        .as_deref()
        .and_then(get_rtc_provider_package_by_provider_key);
    let package_by_identity = request
        .packageIdentity
        .as_deref()
        .and_then(get_rtc_provider_package_by_package_identity);

    if let (Some(provider_key_entry), Some(package_identity_entry)) =
        (package_by_provider_key, package_by_identity)
    {
        if provider_key_entry.packageIdentity != package_identity_entry.packageIdentity {
            return Err(RtcProviderPackageLoaderError::new(
                "provider_package_identity_mismatch",
                "providerKey and packageIdentity must resolve to the same provider package boundary.",
            ));
        }
    }

    let resolved_package = package_by_provider_key.or(package_by_identity).ok_or_else(|| {
        RtcProviderPackageLoaderError::new(
            "provider_package_not_found",
            "No official provider package matches the requested provider boundary.",
        )
    })?;

    Ok(RtcResolvedProviderPackageLoadTarget {
        packageEntry: resolved_package,
    })
}

pub fn create_rtc_provider_package_loader(
    import_package: RtcProviderPackageImportFn,
) -> RtcProviderPackageLoader {
    Box::new(move |request| load_rtc_provider_module(&request, import_package))
}

pub fn load_rtc_provider_module(
    request: &RtcProviderPackageLoadRequest,
    import_package: RtcProviderPackageImportFn,
) -> Result<RtcProviderModuleNamespace, RtcProviderPackageLoaderError> {
    let target = resolve_rtc_provider_package_load_target(request)?;
    let namespace = import_package(&target).map_err(|error| {
        if error.code == "provider_package_load_failed" || error.code == "provider_module_export_missing" {
            error
        } else {
            RtcProviderPackageLoaderError::new(
                "provider_package_load_failed",
                format!(
                    "Reserved provider package loader scaffold could not load {}: {}",
                    target.packageEntry.packageIdentity, error.message
                ),
            )
        }
    })?;

    if namespace.is_empty() {
        return Err(RtcProviderPackageLoaderError::new(
            "provider_module_export_missing",
            "Reserved provider package loader scaffold requires an executable provider module namespace.",
        ));
    }

    Ok(namespace)
}

pub fn install_rtc_provider_package<TDriverManager>(
    request: &RtcProviderPackageInstallRequest<TDriverManager>,
    import_package: RtcProviderPackageImportFn,
) -> Result<(), RtcProviderPackageLoaderError> {
    let _namespace = load_rtc_provider_module(&request.loadRequest, import_package)?;

    Err(RtcProviderPackageLoaderError::new(
        "provider_package_load_failed",
        "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
    ))
}

pub fn install_rtc_provider_packages<TDriverManager>(
    requests: &[RtcProviderPackageInstallRequest<TDriverManager>],
    import_package: RtcProviderPackageImportFn,
) -> Result<(), RtcProviderPackageLoaderError> {
    for request in requests {
        let _namespace = load_rtc_provider_module(&request.loadRequest, import_package)?;
    }

    if !requests.is_empty() {
        return Err(RtcProviderPackageLoaderError::new(
            "provider_package_load_failed",
            "Reserved provider package installer scaffold cannot register provider modules until a verified runtime bridge lands.",
        ));
    }

    Ok(())
}
