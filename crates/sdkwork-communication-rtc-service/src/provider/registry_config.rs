use std::fmt;
use std::path::Path;

use serde::Deserialize;

use crate::provider::registry::StaticProviderRegistry;
use crate::provider::schema::plugin_descriptor_from_provider_schema;

pub const PLATFORM_DEFAULT_PROVIDER_REGISTRY_JSON: &str =
    include_str!("../../../../specs/provider-registry/platform-default.json");

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderRegistryManifest {
    pub schema_version: String,
    pub interface_version: String,
    pub plugins: Vec<ProviderRegistryPluginEntry>,
    #[serde(default)]
    pub precedence: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderRegistryPluginEntry {
    pub plugin_id: String,
    pub provider_kind: String,
    pub display_name: String,
    #[serde(default)]
    pub default_selected: bool,
    #[serde(default = "default_tenant_override_allowed")]
    pub tenant_override_allowed: bool,
}

fn default_tenant_override_allowed() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProviderRegistryConfigError {
    InvalidJson(String),
    MissingProviderSchema { provider_kind: String },
}

impl fmt::Display for ProviderRegistryConfigError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidJson(message) => {
                write!(formatter, "invalid provider registry manifest: {message}")
            }
            Self::MissingProviderSchema { provider_kind } => write!(
                formatter,
                "provider registry references unknown provider schema: {provider_kind}"
            ),
        }
    }
}

impl std::error::Error for ProviderRegistryConfigError {}

pub fn parse_provider_registry_manifest(
    json: &str,
) -> Result<ProviderRegistryManifest, ProviderRegistryConfigError> {
    serde_json::from_str(json)
        .map_err(|error| ProviderRegistryConfigError::InvalidJson(error.to_string()))
}

pub fn platform_default_provider_registry_manifest() -> ProviderRegistryManifest {
    parse_provider_registry_manifest(PLATFORM_DEFAULT_PROVIDER_REGISTRY_JSON)
        .expect("platform-default provider registry manifest must be valid")
}

pub fn platform_default_provider_kinds() -> Vec<String> {
    platform_default_provider_registry_manifest()
        .plugins
        .iter()
        .map(|entry| entry.provider_kind.clone())
        .collect()
}

pub fn load_static_provider_registry(
    json: &str,
) -> Result<StaticProviderRegistry, ProviderRegistryConfigError> {
    let manifest = parse_provider_registry_manifest(json)?;
    let mut descriptors = Vec::with_capacity(manifest.plugins.len());
    for entry in manifest.plugins {
        descriptors.push(descriptor_from_entry(&entry)?);
    }
    Ok(StaticProviderRegistry::new(descriptors))
}

pub fn load_static_provider_registry_from_env()
-> Result<StaticProviderRegistry, ProviderRegistryConfigError> {
    if let Ok(path) = std::env::var("SDKWORK_RTC_PROVIDER_REGISTRY_PATH") {
        let json = std::fs::read_to_string(Path::new(path.as_str())).map_err(|error| {
            ProviderRegistryConfigError::InvalidJson(format!(
                "failed to read SDKWORK_RTC_PROVIDER_REGISTRY_PATH ({path}): {error}"
            ))
        })?;
        return load_static_provider_registry(&json);
    }
    load_static_provider_registry(PLATFORM_DEFAULT_PROVIDER_REGISTRY_JSON)
}

fn descriptor_from_entry(
    entry: &ProviderRegistryPluginEntry,
) -> Result<crate::provider::descriptor::ProviderPluginDescriptor, ProviderRegistryConfigError> {
    plugin_descriptor_from_provider_schema(
        entry.plugin_id.as_str(),
        entry.provider_kind.as_str(),
        entry.display_name.as_str(),
        entry.default_selected,
    )
    .map(|descriptor| descriptor.with_tenant_override_allowed(entry.tenant_override_allowed))
    .map_err(|message| {
        if message.contains("missing provider config schema") {
            ProviderRegistryConfigError::MissingProviderSchema {
                provider_kind: entry.provider_kind.clone(),
            }
        } else {
            ProviderRegistryConfigError::InvalidJson(message)
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::descriptor::ProviderDomain;
    use crate::provider::registry::ProviderRegistry;

    #[test]
    fn platform_default_manifest_declares_builtin_rtc_plugins() {
        let manifest = platform_default_provider_registry_manifest();
        assert_eq!(manifest.interface_version, "provider-registry/v1");
        let plugin_ids = manifest
            .plugins
            .iter()
            .map(|entry| entry.plugin_id.as_str())
            .collect::<Vec<_>>();
        for expected in [
            "rtc-volcengine",
            "rtc-aliyun",
            "rtc-tencent",
            "rtc-agora",
            "rtc-livekit",
        ] {
            assert!(plugin_ids.contains(&expected), "missing plugin {expected}");
        }
        assert!(
            manifest
                .plugins
                .iter()
                .any(|entry| entry.default_selected && entry.plugin_id == "rtc-volcengine")
        );
    }

    #[test]
    fn load_platform_default_registry_aligns_capabilities_with_provider_schemas() {
        let registry = load_static_provider_registry(PLATFORM_DEFAULT_PROVIDER_REGISTRY_JSON)
            .expect("platform-default registry must load");
        let plugins = registry.plugins_for_domain(ProviderDomain::Rtc);
        assert_eq!(plugins.len(), 5);
        for plugin in plugins {
            for capability in [
                "session",
                "credential",
                "provider.webhook",
                "health",
                "media.audio",
                "media.video",
                "live.broadcast",
                "live.audience",
                "provider.event-normalization",
            ] {
                assert!(
                    plugin
                        .required_capabilities
                        .iter()
                        .any(|value| value == capability),
                    "{} must require {capability}",
                    plugin.plugin_id
                );
            }
            for capability in [
                "recording",
                "artifact",
                "screen-share",
                "provider.active-query",
            ] {
                assert!(
                    plugin
                        .optional_capabilities
                        .iter()
                        .any(|value| value == capability),
                    "{} must optionally support {capability}",
                    plugin.plugin_id
                );
            }
        }
    }
}
