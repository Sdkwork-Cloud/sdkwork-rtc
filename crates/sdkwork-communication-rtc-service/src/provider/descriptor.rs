use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderDomain {
    Rtc,
}

impl ProviderDomain {
    pub const ALL: [Self; 1] = [Self::Rtc];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Rtc => "rtc",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPluginDescriptor {
    pub plugin_id: String,
    pub domain: ProviderDomain,
    pub provider_kind: String,
    pub display_name: String,
    pub interface_version: String,
    pub config_schema_ref: String,
    pub default_selected: bool,
    pub tenant_override_allowed: bool,
    pub required_capabilities: Vec<String>,
    pub optional_capabilities: Vec<String>,
    pub unsupported_features: Vec<String>,
    pub degraded_behaviors: Vec<String>,
}

impl ProviderPluginDescriptor {
    pub fn new(
        plugin_id: impl Into<String>,
        domain: ProviderDomain,
        provider_kind: impl Into<String>,
        display_name: impl Into<String>,
    ) -> Self {
        let plugin_id = plugin_id.into();
        let provider_kind = provider_kind.into();
        Self {
            config_schema_ref: format!("specs/provider-schemas/{provider_kind}.json"),
            plugin_id,
            domain,
            provider_kind,
            display_name: display_name.into(),
            interface_version: "v1".into(),
            default_selected: false,
            tenant_override_allowed: true,
            required_capabilities: Vec::new(),
            optional_capabilities: Vec::new(),
            unsupported_features: Vec::new(),
            degraded_behaviors: Vec::new(),
        }
    }

    pub fn with_default_selected(mut self, default_selected: bool) -> Self {
        self.default_selected = default_selected;
        self
    }

    pub fn with_required_capabilities<I, S>(mut self, capabilities: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.required_capabilities = capabilities.into_iter().map(Into::into).collect();
        self
    }

    pub fn with_optional_capabilities<I, S>(mut self, capabilities: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.optional_capabilities = capabilities.into_iter().map(Into::into).collect();
        self
    }

    pub fn with_tenant_override_allowed(mut self, tenant_override_allowed: bool) -> Self {
        self.tenant_override_allowed = tenant_override_allowed;
        self
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderHealthSnapshot {
    pub plugin_id: String,
    pub status: String,
    pub checked_at: String,
    pub details: BTreeMap<String, String>,
}

impl ProviderHealthSnapshot {
    pub fn healthy(plugin_id: impl Into<String>, checked_at: impl Into<String>) -> Self {
        Self {
            plugin_id: plugin_id.into(),
            status: "healthy".into(),
            checked_at: checked_at.into(),
            details: BTreeMap::new(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EffectiveProviderBinding {
    pub domain: ProviderDomain,
    pub default_plugin_id: Option<String>,
    pub selected_plugin_id: Option<String>,
    pub selection_source: String,
    pub tenant_override_allowed: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderRegistrySnapshot {
    pub interface_version: String,
    pub plugins: Vec<ProviderPluginDescriptor>,
    pub effective_bindings: Vec<EffectiveProviderBinding>,
    pub precedence: Vec<String>,
}
