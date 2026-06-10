use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderProfileStatus {
    Active,
    Disabled,
    Archived,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderHealthStatus {
    Unknown,
    Healthy,
    Degraded,
    Unhealthy,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderCapabilitySnapshot {
    pub audio: bool,
    pub video: bool,
    pub live: bool,
    pub screen_share: bool,
    pub recording: bool,
    pub webhook: bool,
    pub active_query: bool,
    pub max_participants: Option<u32>,
    pub supported_regions: Vec<String>,
    pub provider_features: JsonValue,
}

impl RtcProviderCapabilitySnapshot {
    pub fn commercial_default() -> Self {
        Self {
            audio: true,
            video: true,
            live: true,
            screen_share: true,
            recording: true,
            webhook: true,
            active_query: true,
            max_participants: None,
            supported_regions: Vec::new(),
            provider_features: JsonValue::Object(Default::default()),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderProfile {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider: String,
    pub code: String,
    pub name: String,
    pub status: RtcProviderProfileStatus,
    pub is_default: bool,
    pub priority: i32,
    pub environment: String,
    pub region: Option<String>,
    pub provider_app_id: Option<String>,
    pub endpoint: Option<String>,
    pub credential_ref: Option<String>,
    pub credential_fingerprint: Option<String>,
    pub webhook_secret_ref: Option<String>,
    pub webhook_secret_fingerprint: Option<String>,
    pub capabilities: RtcProviderCapabilitySnapshot,
    pub config_snapshot: JsonValue,
    pub health_status: RtcProviderHealthStatus,
    pub last_verified_at: Option<String>,
    pub last_verification_latency_ms: Option<u32>,
    pub last_verification_error: Option<String>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub version: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
}

impl RtcProviderProfile {
    pub fn active_projection(&self) -> RtcActiveProviderProfile {
        RtcActiveProviderProfile {
            id: self.id.clone(),
            provider: self.provider.clone(),
            code: self.code.clone(),
            name: self.name.clone(),
            is_default: self.is_default,
            priority: self.priority,
            environment: self.environment.clone(),
            region: self.region.clone(),
            provider_app_id: self.provider_app_id.clone(),
            endpoint: self.endpoint.clone(),
            capabilities: self.capabilities.clone(),
            health_status: self.health_status.clone(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcActiveProviderProfile {
    pub id: String,
    pub provider: String,
    pub code: String,
    pub name: String,
    pub is_default: bool,
    pub priority: i32,
    pub environment: String,
    pub region: Option<String>,
    pub provider_app_id: Option<String>,
    pub endpoint: Option<String>,
    pub capabilities: RtcProviderCapabilitySnapshot,
    pub health_status: RtcProviderHealthStatus,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderProfileCommand {
    pub provider: String,
    pub code: String,
    pub name: String,
    pub status: Option<RtcProviderProfileStatus>,
    pub is_default: bool,
    pub priority: i32,
    pub environment: String,
    pub region: Option<String>,
    pub provider_app_id: Option<String>,
    pub endpoint: Option<String>,
    pub credential_ref: Option<String>,
    pub webhook_secret_ref: Option<String>,
    pub capabilities: RtcProviderCapabilitySnapshot,
    pub config_snapshot: JsonValue,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderProfileDisableRequest {
    pub reason: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderProfileVerifyKind {
    Credential,
    Webhook,
    ActiveQuery,
    Recording,
    Full,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderProfileVerifyRequest {
    pub query_kind: RtcProviderProfileVerifyKind,
    pub timeout_ms: Option<u32>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderProfileVerifyCheckStatus {
    Passed,
    Warning,
    Failed,
    Skipped,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderProfileVerifyCheck {
    pub name: String,
    pub status: RtcProviderProfileVerifyCheckStatus,
    pub detail: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderProfileVerifyResult {
    pub provider_profile_id: String,
    pub provider: String,
    pub status: RtcProviderHealthStatus,
    pub verified_at: String,
    pub latency_ms: Option<u32>,
    pub checks: Vec<RtcProviderProfileVerifyCheck>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RtcProviderProfileVerification {
    pub provider_profile_id: String,
    pub provider: String,
    pub status: RtcProviderHealthStatus,
    pub verified_at: String,
    pub latency_ms: Option<u32>,
    pub error: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn active_provider_profile_projection_excludes_secret_and_backend_config_fields() {
        let profile = RtcProviderProfile {
            id: "profile-volcengine".to_string(),
            tenant_id: "100".to_string(),
            organization_id: "200".to_string(),
            provider: "volcengine".to_string(),
            code: "default".to_string(),
            name: "Volcengine default".to_string(),
            status: RtcProviderProfileStatus::Active,
            is_default: true,
            priority: 10,
            environment: "production".to_string(),
            region: Some("cn-beijing".to_string()),
            provider_app_id: Some("app-id".to_string()),
            endpoint: Some("https://rtc.volcengine.example".to_string()),
            credential_ref: Some("secret://rtc/volcengine/default".to_string()),
            credential_fingerprint: Some("fingerprint:credential".to_string()),
            webhook_secret_ref: Some("secret://rtc/volcengine/webhook".to_string()),
            webhook_secret_fingerprint: Some("fingerprint:webhook".to_string()),
            capabilities: RtcProviderCapabilitySnapshot::commercial_default(),
            config_snapshot: serde_json::json!({ "tokenTtlSeconds": 3600 }),
            health_status: RtcProviderHealthStatus::Healthy,
            last_verified_at: Some("2026-06-10T00:00:00.000Z".to_string()),
            last_verification_latency_ms: Some(120),
            last_verification_error: None,
            created_by: Some("300".to_string()),
            updated_by: Some("300".to_string()),
            created_at: Some("2026-06-10T00:00:00.000Z".to_string()),
            updated_at: Some("2026-06-10T00:00:00.000Z".to_string()),
            version: "0".to_string(),
            deleted_at: None,
            deleted_by: None,
        };

        let projection_json =
            serde_json::to_string(&profile.active_projection()).expect("projection serializes");

        for forbidden in [
            "credentialRef",
            "credentialFingerprint",
            "webhookSecretRef",
            "webhookSecretFingerprint",
            "configSnapshot",
        ] {
            assert!(
                !projection_json.contains(forbidden),
                "active provider projection must not expose {forbidden}"
            );
        }
        assert!(projection_json.contains("providerAppId"));
        assert!(projection_json.contains("capabilities"));
    }
}
