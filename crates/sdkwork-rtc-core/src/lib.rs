use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

pub const RTC_OWNER: &str = "sdkwork-rtc";
pub const RTC_DOMAIN: &str = "rtc";
pub const RTC_APP_API_AUTHORITY: &str = "sdkwork-rtc-app-api";
pub const RTC_BACKEND_API_AUTHORITY: &str = "sdkwork-rtc-backend-api";
pub const RTC_APP_SDK_FAMILY: &str = "sdkwork-rtc-app-sdk";
pub const RTC_BACKEND_SDK_FAMILY: &str = "sdkwork-rtc-backend-sdk";
pub const RTC_APP_API_PREFIX: &str = "/app/v3/api";
pub const RTC_BACKEND_API_PREFIX: &str = "/backend/v3/api";
pub const PROVIDER_REGISTRY_INTERFACE_VERSION: &str = "provider-registry/v1";
pub const RTC_PROVIDER_REQUIRED_CAPABILITIES: [&str; 8] = [
    "session",
    "credential",
    "callback",
    "health",
    "call.audio",
    "call.video",
    "live.broadcast",
    "live.audience",
];
pub const RTC_PROVIDER_VOLCENGINE_OPTIONAL_CAPABILITIES: [&str; 4] =
    ["recording", "artifact", "screen-share", "cloud-mix"];
pub const RTC_PROVIDER_ALIYUN_OPTIONAL_CAPABILITIES: [&str; 4] =
    ["recording", "artifact", "screen-share", "cloud-mix"];
pub const RTC_PROVIDER_TENCENT_OPTIONAL_CAPABILITIES: [&str; 4] =
    ["recording", "artifact", "screen-share", "cdn-relay"];
pub const RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES: [&str; 7] = [
    "recording",
    "artifact",
    "screen-share",
    "cloud-mix",
    "data-channel",
    "spatial-audio",
    "e2ee",
];
pub const RTC_PROVIDER_LIVEKIT_OPTIONAL_CAPABILITIES: [&str; 6] = [
    "recording",
    "artifact",
    "screen-share",
    "data-channel",
    "transcription",
    "e2ee",
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
pub enum RtcCallType {
    Audio,
    Video,
    Live,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcCallSessionStatus {
    Ringing,
    Connecting,
    Connected,
    Ended,
    Failed,
    Terminated,
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
    Invited,
    Joined,
    Left,
    Kicked,
    Timeout,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcSessionState {
    Started,
    Accepted,
    Rejected,
    Ended,
}

impl RtcSessionState {
    pub fn as_wire_value(&self) -> &'static str {
        match self {
            Self::Started => "started",
            Self::Accepted => "accepted",
            Self::Rejected => "rejected",
            Self::Ended => "ended",
        }
    }
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
pub type RtcSignalSenderMetadata = BTreeMap<String, String>;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcDriveReference {
    pub drive_uri: String,
    pub space_id: String,
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

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcSignalSender {
    pub id: String,
    pub kind: String,
    pub member_id: Option<String>,
    pub device_id: Option<String>,
    pub session_id: Option<String>,
    pub metadata: RtcSignalSenderMetadata,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcSession {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub conversation_id: Option<String>,
    pub rtc_mode: String,
    pub initiator_id: String,
    pub initiator_kind: String,
    pub provider_plugin_id: Option<String>,
    pub provider_session_id: Option<String>,
    pub access_endpoint: Option<String>,
    pub provider_region: Option<String>,
    pub state: RtcSessionState,
    pub signaling_stream_id: Option<String>,
    pub artifact_message_id: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcSignalEvent {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub signal_seq: u64,
    pub conversation_id: Option<String>,
    pub rtc_mode: String,
    pub signal_type: String,
    pub schema_ref: Option<String>,
    pub payload: String,
    pub sender: RtcSignalSender,
    pub signaling_stream_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcStateRecord {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub session: RtcSession,
    pub signals: Vec<RtcSignalEvent>,
    pub updated_at: String,
}

impl RtcStateRecord {
    pub fn merge_monotonic(self, next: Self) -> Self {
        let session = if rtc_session_state_rank(&next.session.state)
            >= rtc_session_state_rank(&self.session.state)
        {
            next.session
        } else {
            self.session
        };
        let mut signals_by_seq = BTreeMap::new();
        for signal in self.signals.into_iter().chain(next.signals) {
            signals_by_seq.insert(signal.signal_seq, signal);
        }
        Self {
            tenant_id: next.tenant_id,
            rtc_session_id: next.rtc_session_id,
            session,
            signals: signals_by_seq.into_values().collect(),
            updated_at: max_rfc3339_string(self.updated_at, next.updated_at),
        }
    }
}

pub trait RtcStateStore: Send + Sync {
    fn load_state(
        &self,
        tenant_id: &str,
        rtc_session_id: &str,
    ) -> Result<Option<RtcStateRecord>, RtcContractError>;

    fn save_state(&self, record: RtcStateRecord) -> Result<(), RtcContractError>;

    fn clear_state(&self, tenant_id: &str, rtc_session_id: &str) -> Result<bool, RtcContractError>;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderDomain {
    Rtc,
    ObjectStorage,
    PrincipalProfile,
    IotAccess,
    IotProtocol,
}

impl ProviderDomain {
    pub const ALL: [Self; 5] = [
        Self::Rtc,
        Self::ObjectStorage,
        Self::PrincipalProfile,
        Self::IotAccess,
        Self::IotProtocol,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Rtc => "rtc",
            Self::ObjectStorage => "object-storage",
            Self::PrincipalProfile => "principal-profile",
            Self::IotAccess => "iot-access",
            Self::IotProtocol => "iot-protocol",
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
            ProviderPluginDescriptor::new(
                "object-storage-aliyun",
                ProviderDomain::ObjectStorage,
                "aliyun",
                "Aliyun Object Storage",
            )
            .with_required_capabilities(["s3", "presign", "multipart"]),
            ProviderPluginDescriptor::new(
                "object-storage-tencent",
                ProviderDomain::ObjectStorage,
                "tencent",
                "Tencent Object Storage",
            )
            .with_required_capabilities(["s3", "presign", "multipart"]),
            ProviderPluginDescriptor::new(
                "object-storage-volcengine",
                ProviderDomain::ObjectStorage,
                "volcengine",
                "Volcengine Object Storage",
            )
            .with_required_capabilities(["s3", "presign", "multipart"]),
            ProviderPluginDescriptor::new(
                "object-storage-aws",
                ProviderDomain::ObjectStorage,
                "aws",
                "Amazon Web Services",
            )
            .with_required_capabilities(["s3", "presign", "multipart"]),
            ProviderPluginDescriptor::new(
                "object-storage-google",
                ProviderDomain::ObjectStorage,
                "google",
                "Google",
            )
            .with_required_capabilities(["s3-gateway", "presign"]),
            ProviderPluginDescriptor::new(
                "object-storage-microsoft",
                ProviderDomain::ObjectStorage,
                "microsoft",
                "Microsoft",
            )
            .with_required_capabilities(["s3-gateway", "presign"]),
            ProviderPluginDescriptor::new(
                "principal-profile-upstream-context",
                ProviderDomain::PrincipalProfile,
                "upstream-context",
                "Local principal profile",
            )
            .with_default_selected(true)
            .with_required_capabilities(["read", "profile"]),
            ProviderPluginDescriptor::new(
                "principal-profile-external-catalog",
                ProviderDomain::PrincipalProfile,
                "external-catalog",
                "External principal catalog",
            )
            .with_required_capabilities(["read", "profile", "external-mapping"]),
            ProviderPluginDescriptor::new(
                "iot-access-local",
                ProviderDomain::IotAccess,
                "local",
                "Local device access",
            )
            .with_default_selected(true)
            .with_required_capabilities(["registry", "credential", "binding", "twin"]),
            ProviderPluginDescriptor::new("iot-mqtt", ProviderDomain::IotProtocol, "mqtt", "MQTT")
                .with_default_selected(true)
                .with_required_capabilities(["uplink", "downlink", "telemetry"]),
            ProviderPluginDescriptor::new(
                "iot-xiaozhi",
                ProviderDomain::IotProtocol,
                "xiaozhi",
                "Xiaozhi protocol",
            )
            .with_required_capabilities(["uplink", "downlink", "semantic-mapping"]),
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
pub struct RtcCreateSessionRequest {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub conversation_id: Option<String>,
    pub rtc_mode: String,
    pub initiator_id: String,
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
#[serde(rename_all = "camelCase")]
pub struct RtcCallbackRequest {
    pub rtc_session_id: String,
    pub callback_type: String,
    pub payload_json: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcCallbackEvent {
    pub rtc_session_id: String,
    pub event_type: String,
    pub participant_id: Option<String>,
    pub payload_json: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcCallRecordKind {
    Recording,
    Transcript,
    ScreenShare,
    Snapshot,
    ChatLog,
    Other,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcCallRecordStatus {
    Pending,
    Processing,
    Ready,
    Failed,
    Deleted,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcCallRecordArtifact {
    pub id: String,
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub owner_user_id: String,
    pub record_kind: RtcCallRecordKind,
    pub record_status: RtcCallRecordStatus,
    pub media_role: String,
    pub provider_profile_id: Option<String>,
    pub provider_record_id: Option<String>,
    pub drive: RtcDriveReference,
    pub resource: RtcMediaResource,
    pub resource_hash: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcCallRecordList {
    pub tenant_id: String,
    pub rtc_session_id: String,
    pub items: Vec<RtcCallRecordArtifact>,
}

impl RtcCallRecordList {
    pub fn new(
        tenant_id: impl Into<String>,
        rtc_session_id: impl Into<String>,
        items: Vec<RtcCallRecordArtifact>,
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
        let space_id = space_id.into();
        let node_id = node_id.into();
        let drive_uri = RtcDriveReference::canonical_uri(space_id.as_str(), node_id.as_str());
        Self {
            tenant_id,
            rtc_session_id: rtc_session_id.clone(),
            drive: RtcDriveReference {
                drive_uri: drive_uri.clone(),
                space_id,
                node_id: node_id.clone(),
                node_version,
            },
            resource: RtcMediaResource {
                id: Some(node_id),
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
                metadata: None,
            },
            media_role: "rtc_recording".into(),
        }
    }

    pub fn into_call_record_artifact(
        self,
        id: impl Into<String>,
        owner_user_id: impl Into<String>,
        record_kind: RtcCallRecordKind,
        record_status: RtcCallRecordStatus,
        media_role: impl Into<String>,
        started_at: impl Into<String>,
        ended_at: impl Into<String>,
    ) -> RtcCallRecordArtifact {
        RtcCallRecordArtifact {
            id: id.into(),
            tenant_id: self.tenant_id,
            rtc_session_id: self.rtc_session_id,
            owner_user_id: owner_user_id.into(),
            record_kind,
            record_status,
            media_role: media_role.into(),
            provider_profile_id: None,
            provider_record_id: None,
            drive: self.drive,
            resource: self.resource,
            resource_hash: None,
            started_at: Some(started_at.into()),
            ended_at: Some(ended_at.into()),
        }
    }
}

pub trait RtcProviderPort: Send + Sync {
    fn descriptor(&self) -> ProviderPluginDescriptor;
    fn create_session(
        &self,
        request: RtcCreateSessionRequest,
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
    fn map_provider_callback(
        &self,
        request: RtcCallbackRequest,
    ) -> Result<RtcCallbackEvent, RtcContractError>;
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
    fn provider_health_snapshot(&self) -> ProviderHealthSnapshot;
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
pub struct RtcCallParticipant {
    pub id: String,
    pub session_id: String,
    pub user_id: String,
    pub display_name: String,
    pub role: RtcParticipantRole,
    pub state: RtcParticipantState,
    pub audio_muted: bool,
    pub video_muted: bool,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcCallSession {
    pub id: String,
    pub room_id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub owner_user_id: String,
    pub call_type: RtcCallType,
    pub status: RtcCallSessionStatus,
    pub provider_profile_id: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub participants: Vec<RtcCallParticipant>,
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
    sessions: &[RtcCallSession],
) -> RtcWorkspaceDigest {
    RtcWorkspaceDigest {
        active_sessions: sessions
            .iter()
            .filter(|session| {
                matches!(
                    session.status,
                    RtcCallSessionStatus::Ringing
                        | RtcCallSessionStatus::Connecting
                        | RtcCallSessionStatus::Connected
                )
            })
            .count(),
        connected_sessions: sessions
            .iter()
            .filter(|session| session.status == RtcCallSessionStatus::Connected)
            .count(),
        ended_sessions: sessions
            .iter()
            .filter(|session| {
                matches!(
                    session.status,
                    RtcCallSessionStatus::Ended
                        | RtcCallSessionStatus::Failed
                        | RtcCallSessionStatus::Terminated
                )
            })
            .count(),
        live_sessions: sessions
            .iter()
            .filter(|session| session.call_type == RtcCallType::Live)
            .count(),
        total_participants: sessions
            .iter()
            .map(|session| session.participants.len())
            .sum(),
        total_rooms: rooms.len(),
        total_sessions: sessions.len(),
        video_sessions: sessions
            .iter()
            .filter(|session| session.call_type == RtcCallType::Video)
            .count(),
    }
}

pub fn encode_rtc_key_segments<const N: usize>(parts: [&str; N]) -> String {
    parts
        .iter()
        .map(|part| format!("{}:{part}", part.len()))
        .collect::<Vec<_>>()
        .join("|")
}

pub fn utc_now_rfc3339_millis() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format_unix_millis(now.as_millis() as i128)
}

pub fn max_rfc3339_string(left: String, right: String) -> String {
    match rfc3339_cmp(left.as_str(), right.as_str()) {
        std::cmp::Ordering::Less | std::cmp::Ordering::Equal => right,
        std::cmp::Ordering::Greater => left,
    }
}

fn rtc_session_state_rank(state: &RtcSessionState) -> u8 {
    match state {
        RtcSessionState::Started => 0,
        RtcSessionState::Rejected => 1,
        RtcSessionState::Accepted => 2,
        RtcSessionState::Ended => 3,
    }
}

fn rfc3339_cmp(left: &str, right: &str) -> std::cmp::Ordering {
    parse_rfc3339_to_millis(left)
        .unwrap_or_default()
        .cmp(&parse_rfc3339_to_millis(right).unwrap_or_default())
}

fn parse_rfc3339_to_millis(value: &str) -> Option<i128> {
    let value = value.trim();
    let date_time = value.strip_suffix('Z')?;
    let (date, time) = date_time.split_once('T')?;
    let mut date_parts = date.split('-');
    let year = date_parts.next()?.parse::<i32>().ok()?;
    let month = date_parts.next()?.parse::<u32>().ok()?;
    let day = date_parts.next()?.parse::<u32>().ok()?;
    if date_parts.next().is_some() {
        return None;
    }

    let mut time_parts = time.split(':');
    let hour = time_parts.next()?.parse::<u32>().ok()?;
    let minute = time_parts.next()?.parse::<u32>().ok()?;
    let second_part = time_parts.next()?;
    if time_parts.next().is_some() {
        return None;
    }

    let (second_text, millis_text) = second_part
        .split_once('.')
        .map_or((second_part, "0"), |(second, fraction)| (second, fraction));
    let second = second_text.parse::<u32>().ok()?;
    let millis = fraction_to_millis(millis_text)?;
    let days = days_from_civil(year, month, day)? as i128;
    Some(
        (((days * 24 + hour as i128) * 60 + minute as i128) * 60 + second as i128) * 1000
            + millis as i128,
    )
}

fn fraction_to_millis(value: &str) -> Option<u32> {
    if value.is_empty() || !value.bytes().all(|byte| byte.is_ascii_digit()) {
        return Some(0);
    }
    let mut normalized = value.chars().take(3).collect::<String>();
    while normalized.len() < 3 {
        normalized.push('0');
    }
    normalized.parse::<u32>().ok()
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

fn days_from_civil(year: i32, month: u32, day: u32) -> Option<i64> {
    if !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }
    let year = year - i32::from(month <= 2);
    let era = if year >= 0 { year } else { year - 399 } / 400;
    let yoe = year - era * 400;
    let month_adjusted = month as i32 + if month > 2 { -3 } else { 9 };
    let doy = (153 * month_adjusted + 2) / 5 + day as i32 - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    Some((era * 146_097 + doe - 719_468) as i64)
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
                "callback",
                "health",
                "call.audio",
                "call.video",
                "live.broadcast",
                "live.audience",
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
            for capability in ["recording", "artifact", "screen-share"] {
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
        assert_eq!(
            artifact.resource.uri.as_deref(),
            Some("drive://spaces/space-rtc-user-1/nodes/node-recording-1")
        );
        assert_eq!(artifact.resource.url, None);
        assert_eq!(artifact.resource.public_url, None);

        let artifact_json =
            serde_json::to_value(&artifact).expect("RTC recording artifact should serialize");
        for forbidden in ["bucket", "objectKey", "storageProvider", "signedUrl"] {
            assert!(
                artifact_json.get(forbidden).is_none(),
                "Drive-backed RTC artifact must not expose object storage field {forbidden}"
            );
        }
    }

    #[test]
    fn rtc_call_record_list_models_multiple_drive_backed_records_for_one_session() {
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
        .into_call_record_artifact(
            "record-transcript-1",
            "user-1",
            RtcCallRecordKind::Transcript,
            RtcCallRecordStatus::Ready,
            "rtc_transcript",
            "2026-06-06T00:00:00.000Z",
            "2026-06-06T00:10:00.000Z",
        );
        let recording = recording.into_call_record_artifact(
            "record-recording-1",
            "user-1",
            RtcCallRecordKind::Recording,
            RtcCallRecordStatus::Ready,
            "rtc_recording",
            "2026-06-06T00:00:00.000Z",
            "2026-06-06T00:10:00.000Z",
        );
        let records =
            RtcCallRecordList::new("tenant-1", "rtc-session-1", vec![recording, transcript]);

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
                .map(|record| record.record_kind.clone())
                .collect::<Vec<_>>(),
            vec![RtcCallRecordKind::Recording, RtcCallRecordKind::Transcript]
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
            RtcCallSession {
                id: "session-1".to_string(),
                room_id: "room-1".to_string(),
                tenant_id: "tenant-1".to_string(),
                organization_id: "org-1".to_string(),
                owner_user_id: "user-1".to_string(),
                call_type: RtcCallType::Video,
                status: RtcCallSessionStatus::Connected,
                provider_profile_id: Some("provider-livekit".to_string()),
                started_at: Some("2026-06-06T00:00:00Z".to_string()),
                ended_at: None,
                participants: vec![
                    RtcCallParticipant {
                        id: "participant-1".to_string(),
                        session_id: "session-1".to_string(),
                        user_id: "user-1".to_string(),
                        display_name: "Host".to_string(),
                        role: RtcParticipantRole::Host,
                        state: RtcParticipantState::Joined,
                        audio_muted: false,
                        video_muted: false,
                    },
                    RtcCallParticipant {
                        id: "participant-2".to_string(),
                        session_id: "session-1".to_string(),
                        user_id: "user-2".to_string(),
                        display_name: "Guest".to_string(),
                        role: RtcParticipantRole::Guest,
                        state: RtcParticipantState::Joined,
                        audio_muted: true,
                        video_muted: false,
                    },
                ],
            },
            RtcCallSession {
                id: "session-2".to_string(),
                room_id: "room-1".to_string(),
                tenant_id: "tenant-1".to_string(),
                organization_id: "org-1".to_string(),
                owner_user_id: "user-1".to_string(),
                call_type: RtcCallType::Audio,
                status: RtcCallSessionStatus::Ended,
                provider_profile_id: None,
                started_at: Some("2026-06-06T01:00:00Z".to_string()),
                ended_at: Some("2026-06-06T01:05:00Z".to_string()),
                participants: Vec::new(),
            },
        ];

        assert_eq!(
            summarize_rtc_workspace(&rooms, &sessions),
            RtcWorkspaceDigest {
                active_sessions: 1,
                connected_sessions: 1,
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
    fn state_record_merge_preserves_accepted_session_over_stale_reject() {
        let accepted = rtc_state_record(
            RtcSessionState::Accepted,
            "2026-05-06T00:00:03.000Z",
            vec![rtc_signal_event(1), rtc_signal_event(2)],
        );
        let stale_reject = rtc_state_record(
            RtcSessionState::Rejected,
            "2026-05-06T00:00:02.000Z",
            vec![rtc_signal_event(1)],
        );

        let merged = accepted.merge_monotonic(stale_reject);

        assert_eq!(merged.session.state, RtcSessionState::Accepted);
        assert_eq!(merged.updated_at, "2026-05-06T00:00:03.000Z");
        assert_eq!(
            merged
                .signals
                .iter()
                .map(|signal| signal.signal_seq)
                .collect::<Vec<_>>(),
            vec![1, 2]
        );
    }

    #[test]
    fn state_record_merge_compares_updated_at_by_rfc3339_instant() {
        let whole_second = rtc_state_record(
            RtcSessionState::Accepted,
            "2026-05-06T00:00:00Z",
            vec![rtc_signal_event(1)],
        );
        let later_fraction = rtc_state_record(
            RtcSessionState::Accepted,
            "2026-05-06T00:00:00.100Z",
            vec![rtc_signal_event(2)],
        );

        let merged = whole_second.merge_monotonic(later_fraction);

        assert_eq!(merged.updated_at, "2026-05-06T00:00:00.100Z");
        assert_eq!(
            merged
                .signals
                .iter()
                .map(|signal| signal.signal_seq)
                .collect::<Vec<_>>(),
            vec![1, 2]
        );
    }

    #[test]
    fn utc_time_helpers_parse_and_format_fractional_rfc3339() {
        assert_eq!(
            max_rfc3339_string(
                "2026-05-06T00:00:00Z".into(),
                "2026-05-06T00:00:00.100Z".into()
            ),
            "2026-05-06T00:00:00.100Z"
        );
        assert_eq!(format_unix_millis(0), "1970-01-01T00:00:00.000Z");
    }

    fn rtc_state_record(
        state: RtcSessionState,
        updated_at: &str,
        signals: Vec<RtcSignalEvent>,
    ) -> RtcStateRecord {
        RtcStateRecord {
            tenant_id: "t_demo".into(),
            rtc_session_id: "rtc_demo".into(),
            session: RtcSession {
                tenant_id: "t_demo".into(),
                rtc_session_id: "rtc_demo".into(),
                conversation_id: Some("c_demo".into()),
                rtc_mode: "voice".into(),
                initiator_id: "u_demo".into(),
                initiator_kind: "user".into(),
                provider_plugin_id: Some("webrtc".into()),
                provider_session_id: Some("ps_demo".into()),
                access_endpoint: Some("wss://rtc.example.test/session/ps_demo".into()),
                provider_region: Some("cn-shanghai".into()),
                state,
                signaling_stream_id: Some("st_demo".into()),
                artifact_message_id: None,
                started_at: "2026-05-06T00:00:00.000Z".into(),
                ended_at: None,
            },
            signals,
            updated_at: updated_at.into(),
        }
    }

    fn rtc_signal_event(signal_seq: u64) -> RtcSignalEvent {
        RtcSignalEvent {
            tenant_id: "t_demo".into(),
            rtc_session_id: "rtc_demo".into(),
            signal_seq,
            conversation_id: Some("c_demo".into()),
            rtc_mode: "voice".into(),
            signal_type: format!("rtc.signal.{signal_seq}"),
            schema_ref: Some("webrtc.signal.v1".into()),
            payload: format!("{{\"seq\":{signal_seq}}}"),
            sender: RtcSignalSender {
                id: "u_demo".into(),
                kind: "user".into(),
                member_id: None,
                device_id: Some("d_demo".into()),
                session_id: Some("s_demo".into()),
                metadata: Default::default(),
            },
            signaling_stream_id: Some("st_demo".into()),
            occurred_at: format!("2026-05-06T00:00:0{signal_seq}.000Z"),
        }
    }
}
