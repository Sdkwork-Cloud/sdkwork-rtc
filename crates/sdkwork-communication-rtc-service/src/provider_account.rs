use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderAccountStatus {
    Active,
    Disabled,
    Archived,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderApplicationStatus {
    Active,
    Disabled,
    Archived,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderCredentialStatus {
    Active,
    Pending,
    Disabled,
    Revoked,
    Expired,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderCredentialRole {
    RtcTokenSigning,
    OpenApiSigning,
    UserSigSigning,
    CloudApiSigning,
    WebhookSigning,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderAccount {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider: String,
    pub code: String,
    pub name: String,
    pub status: RtcProviderAccountStatus,
    pub environment: String,
    pub external_tenant_id: Option<String>,
    pub cloud_account_id: Option<String>,
    pub project_id: Option<String>,
    pub resource_group_id: Option<String>,
    pub last_verified_at: Option<String>,
    pub last_verification_error: Option<String>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub version: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderAccountCommand {
    pub provider: String,
    pub code: String,
    pub name: String,
    pub status: Option<RtcProviderAccountStatus>,
    pub environment: String,
    pub external_tenant_id: Option<String>,
    pub cloud_account_id: Option<String>,
    pub project_id: Option<String>,
    pub resource_group_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderAccountDisableRequest {
    pub reason: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderApplication {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider_account_id: String,
    pub provider: String,
    pub code: String,
    pub name: String,
    pub status: RtcProviderApplicationStatus,
    pub environment: String,
    pub region: Option<String>,
    pub provider_application_id: String,
    pub provider_application_id_kind: String,
    pub access_endpoint: Option<String>,
    pub api_endpoint: Option<String>,
    pub api_host: Option<String>,
    pub api_version: Option<String>,
    pub webhook_callback_url: Option<String>,
    pub config_snapshot: JsonValue,
    pub last_verified_at: Option<String>,
    pub last_verification_error: Option<String>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub version: String,
    pub deleted_at: Option<String>,
    pub deleted_by: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderApplicationCommand {
    pub code: String,
    pub name: String,
    pub status: Option<RtcProviderApplicationStatus>,
    pub environment: String,
    pub region: Option<String>,
    pub provider_application_id: String,
    pub provider_application_id_kind: String,
    pub access_endpoint: Option<String>,
    pub api_endpoint: Option<String>,
    pub api_host: Option<String>,
    pub api_version: Option<String>,
    pub webhook_callback_url: Option<String>,
    pub config_snapshot: JsonValue,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderApplicationDisableRequest {
    pub reason: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderCredential {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider_account_id: String,
    pub provider_application_id: String,
    pub provider: String,
    pub credential_role: RtcProviderCredentialRole,
    pub credential_label: String,
    pub credential_ref: String,
    pub credential_fingerprint: Option<String>,
    pub secret_version: Option<String>,
    pub status: RtcProviderCredentialStatus,
    pub valid_from: Option<String>,
    pub expires_at: Option<String>,
    pub rotation_due_at: Option<String>,
    pub rotated_at: Option<String>,
    pub revoked_at: Option<String>,
    pub last_verified_at: Option<String>,
    pub last_used_at: Option<String>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub version: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderCredentialCommand {
    pub credential_role: RtcProviderCredentialRole,
    pub credential_label: String,
    pub credential_ref: String,
    pub credential_fingerprint: Option<String>,
    pub secret_version: Option<String>,
    pub status: Option<RtcProviderCredentialStatus>,
    pub valid_from: Option<String>,
    pub expires_at: Option<String>,
    pub rotation_due_at: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderCredentialRevokeRequest {
    pub reason: Option<String>,
}

impl RtcProviderCredential {
    pub fn is_active(&self) -> bool {
        self.status == RtcProviderCredentialStatus::Active && self.revoked_at.is_none()
    }
}
