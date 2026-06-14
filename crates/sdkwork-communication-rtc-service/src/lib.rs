use std::collections::BTreeMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::{Value as JsonValue, json};
use sha2::{Digest, Sha256};

pub mod completion;
pub mod persistence;
pub mod provider_account;
pub mod provider_event;
pub mod provider_profile;
pub mod provider_route;
pub use completion::*;
pub use persistence::*;
pub use provider_account::*;
pub use provider_event::*;
pub use provider_profile::*;
pub use provider_route::*;

pub const RTC_OWNER: &str = "sdkwork-rtc";
pub const RTC_DOMAIN: &str = "rtc";
pub const RTC_APP_API_AUTHORITY: &str = "sdkwork-rtc-app-api";
pub const RTC_APP_SDK_FAMILY: &str = "sdkwork-rtc-app-sdk";
pub const RTC_APP_API_PREFIX: &str = "/app/v3/api";
pub const RTC_BACKEND_API_AUTHORITY: &str = "sdkwork-rtc-backend-api";
pub const RTC_BACKEND_SDK_FAMILY: &str = "sdkwork-rtc-backend-sdk";
pub const RTC_BACKEND_API_PREFIX: &str = "/backend/v3/api";
pub const RTC_DRIVE_SPACE_TYPE: &str = "rtc";
pub const PROVIDER_REGISTRY_INTERFACE_VERSION: &str = "provider-registry/v1";
pub const RTC_PROVIDER_REQUIRED_CAPABILITIES: [&str; 9] = [
    "session",
    "credential",
    "provider.webhook",
    "health",
    "media.audio",
    "media.video",
    "live.broadcast",
    "live.audience",
    "provider.event-normalization",
];
pub const RTC_PROVIDER_VOLCENGINE_OPTIONAL_CAPABILITIES: [&str; 5] = [
    "recording",
    "artifact",
    "screen-share",
    "cloud-mix",
    "provider.active-query",
];
pub const RTC_PROVIDER_ALIYUN_OPTIONAL_CAPABILITIES: [&str; 5] = [
    "recording",
    "artifact",
    "screen-share",
    "cloud-mix",
    "provider.active-query",
];
pub const RTC_PROVIDER_TENCENT_OPTIONAL_CAPABILITIES: [&str; 5] = [
    "recording",
    "artifact",
    "screen-share",
    "cdn-relay",
    "provider.active-query",
];
pub const RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES: [&str; 8] = [
    "recording",
    "artifact",
    "screen-share",
    "cloud-mix",
    "data-channel",
    "spatial-audio",
    "e2ee",
    "provider.active-query",
];
pub const RTC_PROVIDER_LIVEKIT_OPTIONAL_CAPABILITIES: [&str; 7] = [
    "recording",
    "artifact",
    "screen-share",
    "data-channel",
    "transcription",
    "e2ee",
    "provider.active-query",
];

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RtcContractError {
    UnsupportedCapability(String),
    Conflict(String),
    Unavailable(String),
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcRoomStatus {
    Active,
    Archived,
    Disabled,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaSessionMode {
    Audio,
    Video,
    Live,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaSessionStatus {
    Preparing,
    Active,
    Closing,
    Ended,
    Failed,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcParticipantRole {
    Host,
    Guest,
    Listener,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcParticipantState {
    Joining,
    Joined,
    Left,
    Kicked,
    Timeout,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaKind {
    Image,
    Video,
    Audio,
    Voice,
    Document,
    Archive,
    Model,
    Other,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaSource {
    Drive,
    ExternalUrl,
    DataUrl,
    ProviderAsset,
    Generated,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaChecksumAlgorithm {
    Sha256,
    Md5,
    Etag,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcMediaChecksum {
    pub algorithm: RtcMediaChecksumAlgorithm,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaVisibility {
    Private,
    Tenant,
    Organization,
    Public,
    Signed,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcMediaAccess {
    pub visibility: RtcMediaVisibility,
    pub expires_at: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaProvenance {
    Uploaded,
    Generated,
    Edited,
    Imported,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcMediaModerationStatus {
    Unknown,
    Pending,
    Approved,
    Rejected,
    Blocked,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcMediaAiProvenance {
    pub provenance: Option<RtcMediaProvenance>,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub prompt_id: Option<String>,
    pub generation_task_id: Option<String>,
    pub source_media_ids: Option<Vec<String>>,
    pub seed: Option<String>,
    pub moderation_status: Option<RtcMediaModerationStatus>,
    pub safety_labels: Option<Vec<String>>,
}

pub type RtcMediaMetadata = BTreeMap<String, JsonValue>;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcDriveSpaceType {
    Rtc,
}

impl RtcDriveSpaceType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Rtc => RTC_DRIVE_SPACE_TYPE,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcDriveReference {
    pub drive_uri: String,
    pub space_id: String,
    pub space_type: RtcDriveSpaceType,
    pub node_id: String,
    pub node_version: Option<String>,
}

impl RtcDriveReference {
    pub fn canonical_uri(space_id: &str, node_id: &str) -> String {
        format!("drive://spaces/{space_id}/nodes/{node_id}")
    }

    pub fn is_canonical(&self) -> bool {
        self.drive_uri == Self::canonical_uri(self.space_id.as_str(), self.node_id.as_str())
    }

    pub fn is_rtc_space(&self) -> bool {
        self.space_type == RtcDriveSpaceType::Rtc
    }

    pub fn rtc(
        space_id: impl Into<String>,
        node_id: impl Into<String>,
        node_version: Option<String>,
    ) -> Self {
        let space_id = space_id.into();
        let node_id = node_id.into();
        Self {
            drive_uri: Self::canonical_uri(space_id.as_str(), node_id.as_str()),
            space_id,
            space_type: RtcDriveSpaceType::Rtc,
            node_id,
            node_version,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaResource {
    pub id: Option<String>,
    pub kind: RtcMediaKind,
    pub source: RtcMediaSource,
    pub url: Option<String>,
    pub public_url: Option<String>,
    pub uri: Option<String>,
    pub object_blob_id: Option<String>,
    pub file_name: Option<String>,
    pub mime_type: Option<String>,
    pub size_bytes: Option<String>,
    pub checksum: Option<RtcMediaChecksum>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration_seconds: Option<u32>,
    pub alt_text: Option<String>,
    pub title: Option<String>,
    pub poster: Option<Box<RtcMediaResource>>,
    pub thumbnails: Option<Vec<RtcMediaResource>>,
    pub variants: Option<Vec<RtcMediaResource>>,
    pub access: Option<RtcMediaAccess>,
    pub ai: Option<RtcMediaAiProvenance>,
    pub metadata: Option<RtcMediaMetadata>,
}

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
        Self {
            config_schema_ref: format!("providers/{plugin_id}.schema.json"),
            plugin_id,
            domain,
            provider_kind: provider_kind.into(),
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
        Self::new([
            ProviderPluginDescriptor::new(
                "rtc-volcengine",
                ProviderDomain::Rtc,
                "volcengine",
                "Volcengine RTC",
            )
            .with_default_selected(true)
            .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
            .with_optional_capabilities(RTC_PROVIDER_VOLCENGINE_OPTIONAL_CAPABILITIES),
            ProviderPluginDescriptor::new(
                "rtc-aliyun",
                ProviderDomain::Rtc,
                "aliyun",
                "Aliyun RTC",
            )
            .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
            .with_optional_capabilities(RTC_PROVIDER_ALIYUN_OPTIONAL_CAPABILITIES),
            ProviderPluginDescriptor::new(
                "rtc-tencent",
                ProviderDomain::Rtc,
                "tencent",
                "Tencent RTC",
            )
            .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
            .with_optional_capabilities(RTC_PROVIDER_TENCENT_OPTIONAL_CAPABILITIES),
            ProviderPluginDescriptor::new("rtc-agora", ProviderDomain::Rtc, "agora", "Agora RTC")
                .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
                .with_optional_capabilities(RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES),
            ProviderPluginDescriptor::new(
                "rtc-livekit",
                ProviderDomain::Rtc,
                "livekit",
                "LiveKit RTC",
            )
            .with_required_capabilities(RTC_PROVIDER_REQUIRED_CAPABILITIES)
            .with_optional_capabilities(RTC_PROVIDER_LIVEKIT_OPTIONAL_CAPABILITIES),
        ])
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

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcCreateMediaSessionRequest {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub media_mode: RtcMediaSessionMode,
    pub room_id: Option<String>,
    pub region: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcSessionHandle {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub provider_session_id: String,
    pub access_endpoint: Option<String>,
    pub region: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcParticipantCredential {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub participant_id: String,
    pub credential: String,
    pub expires_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcRecordingArtifactKind {
    Recording,
    Transcript,
    ScreenShare,
    Snapshot,
    Other,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcRecordingArtifactStatus {
    Pending,
    Processing,
    Ready,
    Failed,
    Deleted,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaArtifact {
    pub id: String,
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub owner_user_id: String,
    pub artifact_kind: RtcRecordingArtifactKind,
    pub artifact_status: RtcRecordingArtifactStatus,
    pub media_role: String,
    pub provider_profile_id: Option<String>,
    pub provider_artifact_id: Option<String>,
    pub drive: RtcDriveReference,
    pub resource: RtcMediaResource,
    pub resource_hash: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub failure_reason: Option<String>,
    pub source_provider_webhook_event_id: Option<String>,
    pub source_provider_query_job_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RtcMediaArtifactDescriptor {
    pub id: String,
    pub owner_user_id: String,
    pub artifact_kind: RtcRecordingArtifactKind,
    pub artifact_status: RtcRecordingArtifactStatus,
    pub media_role: String,
    pub started_at: String,
    pub ended_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaArtifactList {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub items: Vec<RtcMediaArtifact>,
}

impl RtcMediaArtifactList {
    pub fn new(
        tenant_id: impl Into<String>,
        rtc_session_id: impl Into<String>,
        items: Vec<RtcMediaArtifact>,
    ) -> Self {
        Self {
            tenant_id: tenant_id.into(),
            rtc_session_id: rtc_session_id.into(),
            items,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcRecordingArtifact {
    pub tenant_id: String,
    pub rtc_session_id: String,
    #[serde(rename = "drive")]
    pub drive: RtcDriveReference,
    #[serde(rename = "resource")]
    pub resource: RtcMediaResource,
    pub media_role: String,
}

impl RtcRecordingArtifact {
    pub fn drive_backed_recording(
        tenant_id: impl Into<String>,
        rtc_session_id: impl Into<String>,
        space_id: impl Into<String>,
        node_id: impl Into<String>,
        node_version: Option<String>,
    ) -> Self {
        let tenant_id = tenant_id.into();
        let rtc_session_id = rtc_session_id.into();
        let drive = RtcDriveReference::rtc(space_id, node_id, node_version);
        let drive_uri = drive.drive_uri.clone();
        let drive_space_id = drive.space_id.clone();
        let drive_node_id = drive.node_id.clone();
        let resource_id = drive_node_id.clone();
        let drive_node_version = drive.node_version.clone();
        let mut drive_metadata = BTreeMap::new();
        drive_metadata.insert("spaceId".to_string(), json!(drive_space_id));
        drive_metadata.insert("nodeId".to_string(), json!(drive_node_id));
        drive_metadata.insert("spaceType".to_string(), json!(RTC_DRIVE_SPACE_TYPE));
        drive_metadata.insert("nodeVersion".to_string(), json!(drive_node_version));
        let mut metadata = BTreeMap::new();
        metadata.insert("drive".to_string(), json!(drive_metadata));
        Self {
            tenant_id,
            rtc_session_id: rtc_session_id.clone(),
            drive,
            resource: RtcMediaResource {
                id: Some(resource_id),
                kind: RtcMediaKind::Video,
                source: RtcMediaSource::Drive,
                url: None,
                public_url: None,
                uri: Some(drive_uri),
                object_blob_id: None,
                file_name: Some(format!("{rtc_session_id}.mp4")),
                mime_type: Some("video/mp4".into()),
                size_bytes: None,
                checksum: None,
                width: None,
                height: None,
                duration_seconds: None,
                alt_text: None,
                title: None,
                poster: None,
                thumbnails: None,
                variants: None,
                access: None,
                ai: None,
                metadata: Some(metadata),
            },
            media_role: "rtc_recording".into(),
        }
    }

    pub fn into_media_artifact(self, descriptor: RtcMediaArtifactDescriptor) -> RtcMediaArtifact {
        RtcMediaArtifact {
            id: descriptor.id,
            tenant_id: self.tenant_id,
            rtc_session_id: self.rtc_session_id,
            owner_user_id: descriptor.owner_user_id,
            artifact_kind: descriptor.artifact_kind,
            artifact_status: descriptor.artifact_status,
            media_role: descriptor.media_role,
            provider_profile_id: None,
            provider_artifact_id: None,
            drive: self.drive,
            resource: self.resource,
            resource_hash: None,
            started_at: Some(descriptor.started_at),
            ended_at: Some(descriptor.ended_at),
            duration_ms: None,
            failure_reason: None,
            source_provider_webhook_event_id: None,
            source_provider_query_job_id: None,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcRecordingArtifactImportRequest {
    pub provider: String,
    pub tenant_id: String,
    #[serde(default)]
    pub organization_id: Option<String>,
    #[serde(default)]
    pub owner_user_id: Option<String>,
    pub rtc_session_id: String,
    pub provider_profile_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub recording_id: Option<String>,
    pub provider_snapshot_json: Option<String>,
}

impl RtcRecordingArtifactImportRequest {
    pub fn from_export(
        provider: impl Into<String>,
        request: RtcRecordingArtifactExportRequest,
    ) -> Self {
        Self {
            provider: provider.into(),
            tenant_id: request.tenant_id,
            organization_id: request.organization_id,
            owner_user_id: request.owner_user_id,
            rtc_session_id: request.rtc_session_id,
            provider_profile_id: request.provider_profile_id,
            provider_session_id: request.provider_session_id,
            recording_id: request.recording_id,
            provider_snapshot_json: request.provider_snapshot_json,
        }
    }
}

pub type RtcRecordingArtifactImportFuture<'a> = Pin<
    Box<dyn Future<Output = Result<Option<RtcRecordingArtifact>, RtcContractError>> + Send + 'a>,
>;

pub type RtcRecordingArtifactsFuture<'a> =
    Pin<Box<dyn Future<Output = Result<Vec<RtcRecordingArtifact>, RtcContractError>> + Send + 'a>>;

pub trait RtcRecordingArtifactImportPort: Send + Sync {
    fn import_recording_artifact(
        &self,
        request: RtcRecordingArtifactImportRequest,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError>;

    fn import_recording_artifacts(
        &self,
        request: RtcRecordingArtifactImportRequest,
    ) -> Result<Vec<RtcRecordingArtifact>, RtcContractError> {
        Ok(self
            .import_recording_artifact(request)?
            .into_iter()
            .collect())
    }

    fn import_recording_artifact_async<'a>(
        &'a self,
        request: RtcRecordingArtifactImportRequest,
    ) -> RtcRecordingArtifactImportFuture<'a> {
        Box::pin(async move { self.import_recording_artifact(request) })
    }

    fn import_recording_artifacts_async<'a>(
        &'a self,
        request: RtcRecordingArtifactImportRequest,
    ) -> RtcRecordingArtifactsFuture<'a> {
        Box::pin(async move { self.import_recording_artifacts(request) })
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcRecordingArtifactExportRequest {
    pub tenant_id: String,
    #[serde(default)]
    pub organization_id: Option<String>,
    #[serde(default)]
    pub owner_user_id: Option<String>,
    pub rtc_session_id: String,
    pub provider_profile_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub recording_id: Option<String>,
    pub provider_snapshot_json: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderEventKind {
    RoomStarted,
    RoomEnded,
    ParticipantJoined,
    ParticipantLeft,
    RecordingStarted,
    RecordingCompleted,
    RecordingFailed,
    MediaTrackStarted,
    MediaTrackStopped,
    QualitySample,
    Unknown,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderWebhookParseRequest {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub received_at: String,
    pub headers: Vec<(String, String)>,
    pub raw_payload: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderWebhookEvent {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub external_event_id: Option<String>,
    pub event_type: String,
    pub event_kind: RtcProviderEventKind,
    pub room_id: Option<String>,
    pub rtc_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub participant_id: Option<String>,
    pub recording_id: Option<String>,
    pub occurred_at: Option<String>,
    pub received_at: String,
    pub payload_hash: String,
    pub signature_header: Option<String>,
    pub raw_payload: String,
    pub normalized_event_json: String,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderQueryKind {
    RoomOnlineUsers,
    RoomState,
    MediaSessionState,
    RecordingArtifacts,
    QualitySamples,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderQueryRequest {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub query_kind: RtcProviderQueryKind,
    pub room_id: Option<String>,
    pub rtc_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub cursor: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderQueryResult {
    pub provider: String,
    pub provider_profile_id: Option<String>,
    pub query_kind: RtcProviderQueryKind,
    pub room_id: Option<String>,
    pub rtc_session_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub status: String,
    pub raw_provider_action: String,
    pub result_snapshot_json: String,
    pub next_cursor: Option<String>,
    pub queried_at: String,
}

pub fn rtc_provider_payload_hash(payload: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(payload.as_bytes());
    let digest = hasher.finalize();
    format!("sha256:{digest:x}")
}

pub trait RtcProviderPort: Send + Sync {
    fn descriptor(&self) -> ProviderPluginDescriptor;
    fn create_session(
        &self,
        request: RtcCreateMediaSessionRequest,
    ) -> Result<RtcSessionHandle, RtcContractError>;
    fn close_session(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<bool, RtcContractError>;
    fn issue_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
    ) -> Result<RtcParticipantCredential, RtcContractError>;
    fn refresh_participant_credential(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
        participant_id: &str,
    ) -> Result<RtcParticipantCredential, RtcContractError>;
    fn parse_provider_webhook(
        &self,
        request: RtcProviderWebhookParseRequest,
    ) -> Result<RtcProviderWebhookEvent, RtcContractError> {
        Err(RtcContractError::UnsupportedCapability(format!(
            "{} provider webhook parsing is not implemented",
            request.provider
        )))
    }
    fn query_provider_state(
        &self,
        request: RtcProviderQueryRequest,
    ) -> Result<RtcProviderQueryResult, RtcContractError> {
        Err(RtcContractError::UnsupportedCapability(format!(
            "{} provider active query is not implemented",
            request.provider
        )))
    }
    fn export_recording_artifact(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcRecordingArtifact>, RtcContractError>;
    fn export_recording_artifacts(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Vec<RtcRecordingArtifact>, RtcContractError> {
        Ok(self
            .export_recording_artifact(tenant_id, rtc_session_id)?
            .into_iter()
            .collect())
    }
    fn export_recording_artifacts_for_query<'a>(
        &'a self,
        request: RtcRecordingArtifactExportRequest,
    ) -> RtcRecordingArtifactsFuture<'a> {
        Box::pin(async move {
            self.export_recording_artifacts(
                request.tenant_id.as_str(),
                request.rtc_session_id.as_str(),
            )
        })
    }
    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot;
}

pub trait RtcProviderPluginFactory: Send + Sync {
    fn descriptor(&self) -> ProviderPluginDescriptor;
    fn create_provider(&self) -> Arc<dyn RtcProviderPort>;
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcRoom {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub owner_user_id: String,
    pub title: String,
    pub status: RtcRoomStatus,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcMediaParticipant {
    pub id: String,
    pub session_id: String,
    pub user_id: String,
    pub display_name: String,
    pub role: RtcParticipantRole,
    pub state: RtcParticipantState,
    pub audio_muted: bool,
    pub video_muted: bool,
    pub screen_share_active: bool,
    pub provider_participant_id: Option<String>,
    pub joined_at: Option<String>,
    pub left_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub leave_reason: Option<String>,
    pub last_seen_at: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcMediaSession {
    pub id: String,
    pub room_id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub owner_user_id: String,
    pub media_mode: RtcMediaSessionMode,
    pub status: RtcMediaSessionStatus,
    pub provider_profile_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub started_at: Option<String>,
    pub connected_at: Option<String>,
    pub ended_at: Option<String>,
    pub duration_ms: Option<u64>,
    pub end_reason: Option<String>,
    pub end_source: Option<RtcMediaSessionEndSource>,
    pub participant_count: u32,
    pub max_concurrent_participants: u32,
    pub quality_summary: Option<RtcMediaSessionCompletionQualitySummary>,
    pub recording_summary: Option<RtcMediaSessionCompletionRecordingSummary>,
    pub completion_recorded_at: Option<String>,
    pub last_provider_webhook_event_id: Option<String>,
    pub last_provider_query_job_id: Option<String>,
    pub participants: Vec<RtcMediaParticipant>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcWorkspaceDigest {
    pub active_sessions: usize,
    pub connected_sessions: usize,
    pub ended_sessions: usize,
    pub live_sessions: usize,
    pub total_participants: usize,
    pub total_rooms: usize,
    pub total_sessions: usize,
    pub video_sessions: usize,
}

pub fn summarize_rtc_workspace(
    rooms: &[RtcRoom],
    sessions: &[RtcMediaSession],
) -> RtcWorkspaceDigest {
    RtcWorkspaceDigest {
        active_sessions: sessions
            .iter()
            .filter(|session| matches!(session.status, RtcMediaSessionStatus::Active))
            .count(),
        connected_sessions: sessions
            .iter()
            .filter(|session| session.connected_at.is_some())
            .count(),
        ended_sessions: sessions
            .iter()
            .filter(|session| {
                matches!(
                    session.status,
                    RtcMediaSessionStatus::Ended | RtcMediaSessionStatus::Failed
                )
            })
            .count(),
        live_sessions: sessions
            .iter()
            .filter(|session| session.media_mode == RtcMediaSessionMode::Live)
            .count(),
        total_participants: sessions
            .iter()
            .map(|session| session.participants.len())
            .sum(),
        total_rooms: rooms.len(),
        total_sessions: sessions.len(),
        video_sessions: sessions
            .iter()
            .filter(|session| session.media_mode == RtcMediaSessionMode::Video)
            .count(),
    }
}

pub fn utc_now_rfc3339_millis() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock is before UNIX epoch");
    format_unix_millis(now.as_millis() as i128)
}

fn format_unix_millis(millis: i128) -> String {
    let seconds = millis.div_euclid(1000);
    let millisecond = millis.rem_euclid(1000);
    let days = seconds.div_euclid(86_400);
    let seconds_of_day = seconds.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.{millisecond:03}Z")
}

fn civil_from_days(days: i128) -> (i128, i128, i128) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let year = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = mp + if mp < 10 { 3 } else { -9 };
    let year = year + i128::from(month <= 2);
    (year, month, day)
}

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
        "tencent" => include_str!("../../../configs/provider-schemas/tencent.json"),
        "volcengine" => include_str!("../../../configs/provider-schemas/volcengine.json"),
        "agora" => include_str!("../../../configs/provider-schemas/agora.json"),
        "aliyun" => include_str!("../../../configs/provider-schemas/aliyun.json"),
        "livekit" => include_str!("../../../configs/provider-schemas/livekit.json"),
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn platform_default_registry_includes_professional_rtc_provider_plugins() {
        let registry = StaticProviderRegistry::platform_default();
        let rtc_plugins = registry.plugins_for_domain(ProviderDomain::Rtc);
        let plugin_ids = rtc_plugins
            .iter()
            .map(|plugin| plugin.plugin_id.as_str())
            .collect::<Vec<_>>();

        assert!(plugin_ids.contains(&"rtc-volcengine"));
        assert!(plugin_ids.contains(&"rtc-aliyun"));
        assert!(plugin_ids.contains(&"rtc-tencent"));
        assert!(plugin_ids.contains(&"rtc-agora"));
        assert!(plugin_ids.contains(&"rtc-livekit"));

        for plugin in rtc_plugins {
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
                        .any(|registered| registered == capability),
                    "{} should require {capability}",
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
                        .any(|registered| registered == capability),
                    "{} should optionally support {capability}",
                    plugin.plugin_id
                );
            }
        }
    }

    #[test]
    fn drive_backed_recording_artifact_uses_drive_media_source() {
        let artifact = RtcRecordingArtifact::drive_backed_recording(
            "tenant-1",
            "rtc-session-1",
            "space-rtc-user-1",
            "node-recording-1",
            Some("1".to_string()),
        );

        assert_eq!(artifact.resource.source, RtcMediaSource::Drive);
        assert_eq!(artifact.drive.space_type, RtcDriveSpaceType::Rtc);
        assert!(artifact.drive.is_rtc_space());
        assert_eq!(
            artifact.resource.uri.as_deref(),
            Some("drive://spaces/space-rtc-user-1/nodes/node-recording-1")
        );
        assert_eq!(artifact.resource.url, None);
        assert_eq!(artifact.resource.public_url, None);

        let artifact_json =
            serde_json::to_value(&artifact).expect("RTC recording artifact should serialize");
        assert_eq!(artifact_json["drive"]["spaceType"], "rtc");
        assert_eq!(
            artifact_json["resource"]["metadata"]["drive"]["spaceType"],
            "rtc"
        );
        assert_eq!(
            artifact_json["resource"]["metadata"]["drive"]["spaceId"],
            "space-rtc-user-1"
        );
        assert_eq!(
            artifact_json["resource"]["metadata"]["drive"]["nodeId"],
            "node-recording-1"
        );
        for forbidden in ["bucket", "objectKey", "storageProvider", "signedUrl"] {
            assert!(
                artifact_json.get(forbidden).is_none(),
                "Drive-backed RTC artifact must not expose object storage field {forbidden}"
            );
        }
    }

    #[test]
    fn rtc_media_artifact_list_models_multiple_drive_backed_records_for_one_session() {
        let recording = RtcRecordingArtifact::drive_backed_recording(
            "tenant-1",
            "rtc-session-1",
            "space-rtc-user-1",
            "node-recording-1",
            Some("1".to_string()),
        );
        let transcript = RtcRecordingArtifact::drive_backed_recording(
            "tenant-1",
            "rtc-session-1",
            "space-rtc-user-1",
            "node-transcript-1",
            Some("1".to_string()),
        )
        .into_media_artifact(RtcMediaArtifactDescriptor {
            id: "record-transcript-1".into(),
            owner_user_id: "user-1".into(),
            artifact_kind: RtcRecordingArtifactKind::Transcript,
            artifact_status: RtcRecordingArtifactStatus::Ready,
            media_role: "rtc_transcript".into(),
            started_at: "2026-06-06T00:00:00.000Z".into(),
            ended_at: "2026-06-06T00:10:00.000Z".into(),
        });
        let recording = recording.into_media_artifact(RtcMediaArtifactDescriptor {
            id: "record-recording-1".into(),
            owner_user_id: "user-1".into(),
            artifact_kind: RtcRecordingArtifactKind::Recording,
            artifact_status: RtcRecordingArtifactStatus::Ready,
            media_role: "rtc_recording".into(),
            started_at: "2026-06-06T00:00:00.000Z".into(),
            ended_at: "2026-06-06T00:10:00.000Z".into(),
        });
        let records =
            RtcMediaArtifactList::new("tenant-1", "rtc-session-1", vec![recording, transcript]);

        assert_eq!(records.items.len(), 2);
        assert!(
            records
                .items
                .iter()
                .all(|record| record.tenant_id == "tenant-1"
                    && record.rtc_session_id == "rtc-session-1"
                    && record.drive.is_canonical()
                    && record.resource.source == RtcMediaSource::Drive)
        );
        assert_eq!(
            records
                .items
                .iter()
                .map(|record| record.artifact_kind.clone())
                .collect::<Vec<_>>(),
            vec![
                RtcRecordingArtifactKind::Recording,
                RtcRecordingArtifactKind::Transcript
            ]
        );
    }

    #[test]
    fn summarizes_rtc_workspace_without_transport_state() {
        let rooms = vec![RtcRoom {
            id: "room-1".to_string(),
            tenant_id: "tenant-1".to_string(),
            organization_id: "org-1".to_string(),
            owner_user_id: "user-1".to_string(),
            title: "Daily sync".to_string(),
            status: RtcRoomStatus::Active,
        }];
        let sessions = vec![
            RtcMediaSession {
                id: "session-1".to_string(),
                room_id: "room-1".to_string(),
                tenant_id: "tenant-1".to_string(),
                organization_id: "org-1".to_string(),
                owner_user_id: "user-1".to_string(),
                media_mode: RtcMediaSessionMode::Video,
                status: RtcMediaSessionStatus::Active,
                provider_profile_id: Some("provider-volcengine".to_string()),
                provider_session_id: Some("volcengine:session-1".to_string()),
                started_at: Some("2026-06-06T00:00:00Z".to_string()),
                connected_at: Some("2026-06-06T00:00:01Z".to_string()),
                ended_at: None,
                duration_ms: None,
                end_reason: None,
                end_source: None,
                participant_count: 2,
                max_concurrent_participants: 2,
                quality_summary: None,
                recording_summary: None,
                completion_recorded_at: None,
                last_provider_webhook_event_id: None,
                last_provider_query_job_id: None,
                participants: vec![
                    RtcMediaParticipant {
                        id: "participant-1".to_string(),
                        session_id: "session-1".to_string(),
                        user_id: "user-1".to_string(),
                        display_name: "Host".to_string(),
                        role: RtcParticipantRole::Host,
                        state: RtcParticipantState::Joined,
                        audio_muted: false,
                        video_muted: false,
                        screen_share_active: false,
                        provider_participant_id: None,
                        joined_at: Some("2026-06-06T00:00:01Z".to_string()),
                        left_at: None,
                        duration_ms: None,
                        leave_reason: None,
                        last_seen_at: Some("2026-06-06T00:00:01Z".to_string()),
                    },
                    RtcMediaParticipant {
                        id: "participant-2".to_string(),
                        session_id: "session-1".to_string(),
                        user_id: "user-2".to_string(),
                        display_name: "Guest".to_string(),
                        role: RtcParticipantRole::Guest,
                        state: RtcParticipantState::Joined,
                        audio_muted: true,
                        video_muted: false,
                        screen_share_active: false,
                        provider_participant_id: None,
                        joined_at: Some("2026-06-06T00:00:02Z".to_string()),
                        left_at: None,
                        duration_ms: None,
                        leave_reason: None,
                        last_seen_at: Some("2026-06-06T00:00:02Z".to_string()),
                    },
                ],
            },
            RtcMediaSession {
                id: "session-2".to_string(),
                room_id: "room-1".to_string(),
                tenant_id: "tenant-1".to_string(),
                organization_id: "org-1".to_string(),
                owner_user_id: "user-1".to_string(),
                media_mode: RtcMediaSessionMode::Audio,
                status: RtcMediaSessionStatus::Ended,
                provider_profile_id: None,
                provider_session_id: None,
                started_at: Some("2026-06-06T01:00:00Z".to_string()),
                connected_at: Some("2026-06-06T01:00:00Z".to_string()),
                ended_at: Some("2026-06-06T01:05:00Z".to_string()),
                duration_ms: Some(300_000),
                end_reason: Some("manual_close".to_string()),
                end_source: Some(RtcMediaSessionEndSource::ManualClose),
                participant_count: 0,
                max_concurrent_participants: 0,
                quality_summary: None,
                recording_summary: None,
                completion_recorded_at: Some("2026-06-06T01:05:01Z".to_string()),
                last_provider_webhook_event_id: None,
                last_provider_query_job_id: None,
                participants: Vec::new(),
            },
        ];

        assert_eq!(
            summarize_rtc_workspace(&rooms, &sessions),
            RtcWorkspaceDigest {
                active_sessions: 1,
                connected_sessions: 2,
                ended_sessions: 1,
                total_participants: 2,
                total_rooms: 1,
                total_sessions: 2,
                live_sessions: 0,
                video_sessions: 1,
            }
        );
    }

    #[test]
    fn utc_time_helpers_format_unix_millis() {
        assert_eq!(format_unix_millis(0), "1970-01-01T00:00:00.000Z");
    }
}
