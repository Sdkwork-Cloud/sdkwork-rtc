use serde::{Deserialize, Serialize};

use crate::rtc_provider_payload_hash;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcMediaSessionIdempotencyRecord {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub idempotency_key: String,
    pub media_session_id: String,
    pub payload_hash: String,
    #[serde(default)]
    pub response_json: String,
    pub created_at: String,
}

pub fn media_session_idempotency_record_id(
    tenant_id: &str,
    organization_id: &str,
    idempotency_key: &str,
) -> String {
    format!("media-session-idempotency-{tenant_id}-{organization_id}-{idempotency_key}")
}

pub fn participant_credential_issue_idempotency_key(
    tenant_id: &str,
    organization_id: &str,
    idempotency_key: &str,
) -> String {
    format!("rtc.participantCredentials.issue:{tenant_id}:{organization_id}:{idempotency_key}")
}

pub fn participant_credential_issue_idempotency_payload_hash(
    media_session_id: &str,
    participant_id: &str,
) -> String {
    let canonical = serde_json::json!({
        "mediaSessionId": media_session_id,
        "participantId": participant_id,
    });
    rtc_provider_payload_hash(
        &serde_json::to_string(&canonical).unwrap_or_else(|_| canonical.to_string()),
    )
}

pub fn media_session_create_idempotency_payload_hash(
    room_id: &str,
    media_mode: &str,
    provider_profile_id: Option<&str>,
    provider: Option<&str>,
    region: Option<&str>,
    recording_requested: bool,
    metadata_json: &str,
) -> String {
    let canonical = serde_json::json!({
        "roomId": room_id,
        "mediaMode": media_mode,
        "providerProfileId": provider_profile_id,
        "provider": provider,
        "region": region,
        "recordingRequested": recording_requested,
        "metadata": serde_json::from_str::<serde_json::Value>(metadata_json)
            .unwrap_or(serde_json::Value::Object(Default::default())),
    });
    rtc_provider_payload_hash(
        &serde_json::to_string(&canonical).unwrap_or_else(|_| canonical.to_string()),
    )
}
