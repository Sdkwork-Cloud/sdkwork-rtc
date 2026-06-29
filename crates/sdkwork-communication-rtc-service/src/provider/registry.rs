use std::collections::BTreeMap;

use crate::constants::PROVIDER_REGISTRY_INTERFACE_VERSION;
use crate::provider::descriptor::{
    EffectiveProviderBinding, ProviderDomain, ProviderPluginDescriptor, ProviderRegistrySnapshot,
};

pub trait ProviderRegistry: Send + Sync {
    fn snapshot(&self) -> ProviderRegistrySnapshot;
    fn plugins_for_domain(&self, domain: ProviderDomain) -> Vec<ProviderPluginDescriptor>;
    fn effective_binding(
        &self,
        domain: ProviderDomain,
        tenant_id: Option<&str>,
    ) -> Option<EffectiveProviderBinding>;
}

#[derive(Clone, Debug, Default)]
pub struct StaticProviderRegistry {
    plugins: BTreeMap<String, ProviderPluginDescriptor>,
    defaults: BTreeMap<ProviderDomain, String>,
    deployment_profiles: BTreeMap<ProviderDomain, String>,
    tenant_overrides: BTreeMap<String, BTreeMap<ProviderDomain, String>>,
}

impl StaticProviderRegistry {
    pub fn new<I>(plugins: I) -> Self
    where
        I: IntoIterator<Item = ProviderPluginDescriptor>,
    {
        let mut registry = Self::default();
        for plugin in plugins {
            if plugin.default_selected {
                registry
                    .defaults
                    .insert(plugin.domain, plugin.plugin_id.clone());
            }
            registry.plugins.insert(plugin.plugin_id.clone(), plugin);
        }
        registry
    }

    pub fn platform_default() -> Self {
        super::registry_config::load_static_provider_registry(
            super::registry_config::PLATFORM_DEFAULT_PROVIDER_REGISTRY_JSON,
        )
        .expect("platform-default provider registry manifest must be valid")
    }

    pub fn from_manifest_json(
        json: &str,
    ) -> Result<Self, super::registry_config::ProviderRegistryConfigError> {
        super::registry_config::load_static_provider_registry(json)
    }

    pub fn with_tenant_override(
        mut self,
        tenant_id: impl Into<String>,
        domain: ProviderDomain,
        plugin_id: impl Into<String>,
    ) -> Self {
        self.tenant_overrides
            .entry(tenant_id.into())
            .or_default()
            .insert(domain, plugin_id.into());
        self
    }

    pub fn with_deployment_profile(
        mut self,
        domain: ProviderDomain,
        plugin_id: impl Into<String>,
    ) -> Self {
        self.deployment_profiles.insert(domain, plugin_id.into());
        self
    }

    fn plugin_matches_domain(&self, plugin_id: &str, domain: ProviderDomain) -> bool {
        self.plugins
            .get(plugin_id)
            .is_some_and(|plugin| plugin.domain == domain)
    }

    fn default_binding_for(&self, domain: ProviderDomain) -> EffectiveProviderBinding {
        let default_plugin_id = self.defaults.get(&domain).cloned();
        EffectiveProviderBinding {
            domain,
            default_plugin_id: default_plugin_id.clone(),
            selected_plugin_id: default_plugin_id,
            selection_source: if self.defaults.contains_key(&domain) {
                "global_default".into()
            } else {
                "deployment_required".into()
            },
            tenant_override_allowed: true,
        }
    }

    fn deployment_profile_binding_for(
        &self,
        domain: ProviderDomain,
        plugin_id: String,
    ) -> EffectiveProviderBinding {
        let tenant_override_allowed = self
            .plugins
            .get(plugin_id.as_str())
            .map(|plugin| plugin.tenant_override_allowed)
            .unwrap_or(true);
        EffectiveProviderBinding {
            domain,
            default_plugin_id: self.defaults.get(&domain).cloned(),
            selected_plugin_id: Some(plugin_id),
            selection_source: "deployment_profile".into(),
            tenant_override_allowed,
        }
    }
}

impl ProviderRegistry for StaticProviderRegistry {
    fn snapshot(&self) -> ProviderRegistrySnapshot {
        ProviderRegistrySnapshot {
            interface_version: PROVIDER_REGISTRY_INTERFACE_VERSION.into(),
            plugins: self.plugins.values().cloned().collect(),
            effective_bindings: ProviderDomain::ALL
                .into_iter()
                .filter_map(|domain| self.effective_binding(domain, None))
                .collect(),
            precedence: vec![
                "tenant_override".into(),
                "deployment_profile".into(),
                "global_default".into(),
            ],
        }
    }

    fn plugins_for_domain(&self, domain: ProviderDomain) -> Vec<ProviderPluginDescriptor> {
        self.plugins
            .values()
            .filter(|plugin| plugin.domain == domain)
            .cloned()
            .collect()
    }

    fn effective_binding(
        &self,
        domain: ProviderDomain,
        tenant_id: Option<&str>,
    ) -> Option<EffectiveProviderBinding> {
        if let Some(tenant_id) = tenant_id
            && let Some(plugin_id) = self
                .tenant_overrides
                .get(tenant_id)
                .and_then(|overrides| overrides.get(&domain))
                .cloned()
            && self.plugin_matches_domain(plugin_id.as_str(), domain)
        {
            let tenant_override_allowed = self
                .plugins
                .get(plugin_id.as_str())
                .map(|plugin| plugin.tenant_override_allowed)
                .unwrap_or(true);
            return Some(EffectiveProviderBinding {
                domain,
                default_plugin_id: self.defaults.get(&domain).cloned(),
                selected_plugin_id: Some(plugin_id),
                selection_source: "tenant_override".into(),
                tenant_override_allowed,
            });
        }

        if let Some(plugin_id) = self.deployment_profiles.get(&domain).cloned()
            && self.plugin_matches_domain(plugin_id.as_str(), domain)
        {
            return Some(self.deployment_profile_binding_for(domain, plugin_id));
        }

        Some(self.default_binding_for(domain))
    }
}
