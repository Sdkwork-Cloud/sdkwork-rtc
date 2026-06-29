use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

use crate::provider::descriptor::{ProviderDomain, ProviderPluginDescriptor};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProviderConfigSchema {
    pub provider: String,
    pub display_name: String,
    pub description: String,
    pub account_fields: Vec<ConfigFieldSchema>,
    pub application_fields: Vec<ConfigFieldSchema>,
    pub credential_roles: Vec<CredentialRoleSchema>,
    pub profile_fields: Vec<ConfigFieldSchema>,
    pub optional_capabilities: Vec<String>,
    pub required_capabilities: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ConfigFieldSchema {
    pub key: String,
    pub label: String,
    #[serde(rename = "type")]
    pub field_type: String,
    #[serde(default)]
    pub required: bool,
    pub default: Option<JsonValue>,
    pub placeholder: Option<String>,
    pub values: Option<Vec<String>>,
    pub min: Option<i64>,
    pub max: Option<i64>,
    #[serde(default)]
    pub hidden: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CredentialRoleSchema {
    pub role: String,
    pub label: String,
    pub description: String,
    pub fields: Vec<ConfigFieldSchema>,
}

pub fn load_provider_config_schema(provider: &str) -> Option<ProviderConfigSchema> {
    let schema_json = match provider {
        "tencent" => include_str!("../../../../configs/provider-schemas/tencent.json"),
        "volcengine" => include_str!("../../../../configs/provider-schemas/volcengine.json"),
        "agora" => include_str!("../../../../configs/provider-schemas/agora.json"),
        "aliyun" => include_str!("../../../../configs/provider-schemas/aliyun.json"),
        "livekit" => include_str!("../../../../configs/provider-schemas/livekit.json"),
        _ => return None,
    };
    serde_json::from_str(schema_json).ok()
}

pub fn list_provider_config_schemas() -> Vec<ProviderConfigSchema> {
    ["tencent", "volcengine", "agora", "aliyun", "livekit"]
        .iter()
        .filter_map(|provider| load_provider_config_schema(provider))
        .collect()
}

pub fn plugin_descriptor_from_provider_schema(
    plugin_id: impl Into<String>,
    provider_kind: impl Into<String>,
    display_name: impl Into<String>,
    default_selected: bool,
) -> Result<ProviderPluginDescriptor, String> {
    let provider_kind = provider_kind.into();
    let schema = load_provider_config_schema(provider_kind.as_str()).ok_or_else(|| {
        format!("missing provider config schema for provider kind `{provider_kind}`")
    })?;
    Ok(ProviderPluginDescriptor::new(
        plugin_id,
        ProviderDomain::Rtc,
        provider_kind.as_str(),
        display_name.into(),
    )
    .with_default_selected(default_selected)
    .with_required_capabilities(schema.required_capabilities)
    .with_optional_capabilities(schema.optional_capabilities))
}
