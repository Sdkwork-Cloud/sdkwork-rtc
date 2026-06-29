use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

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
