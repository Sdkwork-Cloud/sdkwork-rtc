use serde::{Deserialize, Serialize};
use sdkwork_utils_rust::sha256_hash;

use super::session::RtcParticipantCredential;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcSessionTokenGrantStatus {
    Active,
    Revoked,
    Expired,
}

impl RtcSessionTokenGrantStatus {
    pub fn as_i32(&self) -> i32 {
        match self {
            Self::Active => 1,
            Self::Revoked => 2,
            Self::Expired => 3,
        }
    }

    pub fn from_i32(value: i32) -> Option<Self> {
        match value {
            1 => Some(Self::Active),
            2 => Some(Self::Revoked),
            3 => Some(Self::Expired),
            _ => None,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcSessionTokenGrant {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub session_id: String,
    pub participant_id: String,
    pub provider_profile_id: Option<String>,
    pub token_hash: String,
    pub scope: String,
    pub expire_at: String,
    pub revoked_at: Option<String>,
    pub created_at: String,
    pub status: RtcSessionTokenGrantStatus,
}

pub fn session_token_grant_record_id(
    tenant_id: &str,
    organization_id: &str,
    session_id: &str,
    participant_id: &str,
    created_at: &str,
    nonce: &str,
) -> String {
    format!(
        "session-token-grant-{tenant_id}-{organization_id}-{session_id}-{participant_id}-{created_at}-{nonce}"
    )
}

pub fn hash_participant_credential_token(credential: &str) -> String {
    sha256_hash(credential.as_bytes())
}

pub fn session_token_grant_is_active(grant: &RtcSessionTokenGrant, now: &str) -> bool {
    if grant.status != RtcSessionTokenGrantStatus::Active {
        return false;
    }
    let (Some(observed_at), Some(expire_at)) = (
        sdkwork_utils_rust::parse_datetime(now, None),
        sdkwork_utils_rust::parse_datetime(grant.expire_at.as_str(), None),
    ) else {
        return false;
    };
    observed_at <= expire_at
}

pub fn assert_session_token_grant_matches_credential(
    grant: &RtcSessionTokenGrant,
    credential_token: &str,
    session_id: &str,
    participant_id: &str,
) -> Result<(), String> {
    if grant.session_id != session_id {
        return Err("RTC session token grant does not match media session".to_string());
    }
    if grant.participant_id != participant_id {
        return Err("RTC session token grant does not match participant".to_string());
    }
    if hash_participant_credential_token(credential_token) != grant.token_hash {
        return Err("RTC session token grant hash mismatch".to_string());
    }
    Ok(())
}

pub fn validate_session_token_grant_for_credential(
    grant: &RtcSessionTokenGrant,
    credential_token: &str,
    session_id: &str,
    participant_id: &str,
    now: &str,
) -> Result<(), String> {
    assert_session_token_grant_matches_credential(
        grant,
        credential_token,
        session_id,
        participant_id,
    )?;
    if !session_token_grant_is_active(grant, now) {
        return Err("RTC session token grant is not active".to_string());
    }
    Ok(())
}

pub fn build_session_token_grant_from_credential(
    credential: &RtcParticipantCredential,
    organization_id: impl Into<String>,
    provider_profile_id: Option<String>,
    scope: impl Into<String>,
    created_at: impl Into<String>,
) -> RtcSessionTokenGrant {
    let created_at = created_at.into();
    let organization_id = organization_id.into();
    let nonce = credential
        .credential
        .chars()
        .take(12)
        .collect::<String>();
    RtcSessionTokenGrant {
        id: session_token_grant_record_id(
            credential.tenant_id.as_str(),
            organization_id.as_str(),
            credential.rtc_session_id.as_str(),
            credential.participant_id.as_str(),
            created_at.as_str(),
            nonce.as_str(),
        ),
        tenant_id: credential.tenant_id.clone(),
        organization_id,
        session_id: credential.rtc_session_id.clone(),
        participant_id: credential.participant_id.clone(),
        provider_profile_id,
        token_hash: hash_participant_credential_token(credential.credential.as_str()),
        scope: scope.into(),
        expire_at: credential.expires_at.clone(),
        revoked_at: None,
        created_at,
        status: RtcSessionTokenGrantStatus::Active,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hashes_credential_without_storing_plaintext() {
        let hash = hash_participant_credential_token("secret-token");
        assert_eq!(hash.len(), 64);
        assert_ne!(hash, "secret-token");
    }

    #[test]
    fn validates_active_matching_grant() {
        let grant = RtcSessionTokenGrant {
            id: "grant-1".to_string(),
            tenant_id: "1".to_string(),
            organization_id: "0".to_string(),
            session_id: "session-1".to_string(),
            participant_id: "participant-1".to_string(),
            provider_profile_id: None,
            token_hash: hash_participant_credential_token("token-abc"),
            scope: "rtc.join".to_string(),
            expire_at: "2099-12-31T23:59:59.999Z".to_string(),
            revoked_at: None,
            created_at: "2026-01-01T00:00:00.000Z".to_string(),
            status: RtcSessionTokenGrantStatus::Active,
        };
        assert!(session_token_grant_is_active(
            &grant,
            "2026-01-01T00:00:00.000Z"
        ));
        assert!(validate_session_token_grant_for_credential(
            &grant,
            "token-abc",
            "session-1",
            "participant-1",
            "2026-01-01T00:00:00.000Z"
        )
        .is_ok());
    }

    #[test]
    fn rejects_revoked_grant() {
        let grant = RtcSessionTokenGrant {
            id: "grant-2".to_string(),
            tenant_id: "1".to_string(),
            organization_id: "0".to_string(),
            session_id: "session-1".to_string(),
            participant_id: "participant-1".to_string(),
            provider_profile_id: None,
            token_hash: hash_participant_credential_token("token-abc"),
            scope: "rtc.join".to_string(),
            expire_at: "2099-12-31T23:59:59.999Z".to_string(),
            revoked_at: Some("2026-01-02T00:00:00.000Z".to_string()),
            created_at: "2026-01-01T00:00:00.000Z".to_string(),
            status: RtcSessionTokenGrantStatus::Revoked,
        };
        assert!(!session_token_grant_is_active(
            &grant,
            "2026-01-01T00:00:00.000Z"
        ));
    }
}
