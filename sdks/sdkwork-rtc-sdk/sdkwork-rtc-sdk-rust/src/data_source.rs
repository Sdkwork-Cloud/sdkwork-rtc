use crate::driver_manager::RtcDriverManager;
use crate::provider_catalog::DEFAULT_RTC_PROVIDER_KEY;
use crate::provider_selection::{RtcProviderSelection, RtcProviderSelectionRequest};
use crate::provider_support::RtcProviderSupport;

#[derive(Clone)]
#[allow(non_snake_case)]
pub struct RtcDataSourceOptions {
    pub providerUrl: String,
    pub providerKey: String,
    pub tenantOverrideProviderKey: String,
    pub deploymentProfileProviderKey: String,
    pub defaultProviderKey: String,
}

#[allow(non_snake_case)]
pub struct RtcDataSource {
    options: RtcDataSourceOptions,
    driverManager: RtcDriverManager,
}

impl RtcDataSourceOptions {
    pub fn new() -> Self {
        Self {
            providerUrl: String::new(),
            providerKey: String::new(),
            tenantOverrideProviderKey: String::new(),
            deploymentProfileProviderKey: String::new(),
            defaultProviderKey: DEFAULT_RTC_PROVIDER_KEY.to_string(),
        }
    }
}

impl Default for RtcDataSourceOptions {
    fn default() -> Self {
        Self::new()
    }
}

impl RtcDataSource {
    #[allow(non_snake_case)]
    pub fn new(options: RtcDataSourceOptions, driverManager: RtcDriverManager) -> Self {
        let mut resolved_options = options;
        if resolved_options.defaultProviderKey.trim().is_empty() {
          resolved_options.defaultProviderKey = DEFAULT_RTC_PROVIDER_KEY.to_string();
        }

        Self {
            options: resolved_options,
            driverManager,
        }
    }

    #[allow(non_snake_case)]
    fn mergeRtcDataSourceOptions(
        base: &RtcDataSourceOptions,
        overrides: Option<&RtcDataSourceOptions>,
    ) -> RtcDataSourceOptions {
        let mut merged = base.clone();
        if let Some(value) = overrides {
            if !value.providerUrl.trim().is_empty() {
                merged.providerUrl = value.providerUrl.clone();
            }
            if !value.providerKey.trim().is_empty() {
                merged.providerKey = value.providerKey.clone();
            }
            if !value.tenantOverrideProviderKey.trim().is_empty() {
                merged.tenantOverrideProviderKey = value.tenantOverrideProviderKey.clone();
            }
            if !value.deploymentProfileProviderKey.trim().is_empty() {
                merged.deploymentProfileProviderKey = value.deploymentProfileProviderKey.clone();
            }
            if !value.defaultProviderKey.trim().is_empty() {
                merged.defaultProviderKey = value.defaultProviderKey.clone();
            }
        }
        merged
    }

    #[allow(non_snake_case)]
    fn describeSelectionInternal(&self, overrides: Option<&RtcDataSourceOptions>) -> RtcProviderSelection {
        let merged = Self::mergeRtcDataSourceOptions(&self.options, overrides);
        self.driverManager.resolveSelection(
            &RtcProviderSelectionRequest {
                providerUrl: if merged.providerUrl.trim().is_empty() { None } else { Some(merged.providerUrl) },
                providerKey: if merged.providerKey.trim().is_empty() { None } else { Some(merged.providerKey) },
                tenantOverrideProviderKey: if merged.tenantOverrideProviderKey.trim().is_empty() { None } else { Some(merged.tenantOverrideProviderKey) },
                deploymentProfileProviderKey: if merged.deploymentProfileProviderKey.trim().is_empty() { None } else { Some(merged.deploymentProfileProviderKey) },
            },
            Some(merged.defaultProviderKey.as_str()),
        )
    }

    #[allow(non_snake_case)]
    pub fn describeSelection(&self, overrides: Option<&RtcDataSourceOptions>) -> RtcProviderSelection {
        self.describeSelectionInternal(overrides)
    }

    #[allow(non_snake_case)]
    pub fn describeProviderSupport(&self, overrides: Option<&RtcDataSourceOptions>) -> RtcProviderSupport {
        let selection = self.describeSelectionInternal(overrides);
        self.driverManager.describeProviderSupport(selection.providerKey.as_str())
    }

    #[allow(non_snake_case)]
    pub fn listProviderSupport(&self) -> Vec<RtcProviderSupport> {
        self.driverManager.listProviderSupport()
    }
}
