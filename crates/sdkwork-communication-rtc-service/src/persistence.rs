use std::error::Error;
use std::fmt;
use std::future::Future;
use std::pin::Pin;

use crate::{
    RtcMediaArtifact, RtcMediaParticipant, RtcMediaSession, RtcMediaSessionCompletionRecord,
    RtcMediaSessionIdempotencyRecord, RtcMediaTrack, RtcProviderAccount, RtcProviderApplication,
    RtcProviderCredential, RtcProviderProfile, RtcProviderQueryJobRecord,
    RtcProviderQuerySnapshotRecord, RtcProviderRoute, RtcProviderWebhookEventRecord,
    RtcQualitySample, RtcRoom,
};

pub type RtcPersistenceResult<T> = Result<T, RtcPersistenceError>;

pub type RtcPersistenceFuture<'a, T> =
    Pin<Box<dyn Future<Output = RtcPersistenceResult<T>> + Send + 'a>>;

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcPersistenceChangeSet {
    pub rooms: Vec<RtcRoom>,
    pub media_sessions: Vec<RtcMediaSession>,
    pub media_participants: Vec<RtcMediaParticipant>,
    pub media_tracks: Vec<RtcMediaTrack>,
    pub media_artifacts: Vec<RtcMediaArtifact>,
    pub quality_samples: Vec<RtcQualitySample>,
    pub completion_records: Vec<RtcMediaSessionCompletionRecord>,
    pub provider_accounts: Vec<RtcProviderAccount>,
    pub provider_applications: Vec<RtcProviderApplication>,
    pub provider_credentials: Vec<RtcProviderCredential>,
    pub provider_profiles: Vec<RtcProviderProfile>,
    pub provider_routes: Vec<RtcProviderRoute>,
    pub webhook_events: Vec<RtcProviderWebhookEventRecord>,
    pub provider_query_jobs: Vec<RtcProviderQueryJobRecord>,
    pub provider_query_snapshots: Vec<RtcProviderQuerySnapshotRecord>,
    pub media_session_idempotencies: Vec<RtcMediaSessionIdempotencyRecord>,
}

impl RtcPersistenceChangeSet {
    pub fn is_empty(&self) -> bool {
        self.rooms.is_empty()
            && self.media_sessions.is_empty()
            && self.media_participants.is_empty()
            && self.media_tracks.is_empty()
            && self.media_artifacts.is_empty()
            && self.quality_samples.is_empty()
            && self.completion_records.is_empty()
            && self.provider_accounts.is_empty()
            && self.provider_applications.is_empty()
            && self.provider_credentials.is_empty()
            && self.provider_profiles.is_empty()
            && self.provider_routes.is_empty()
            && self.webhook_events.is_empty()
            && self.provider_query_jobs.is_empty()
            && self.provider_query_snapshots.is_empty()
            && self.media_session_idempotencies.is_empty()
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RtcPersistenceError {
    Conflict(String),
    Unavailable(String),
}

impl fmt::Display for RtcPersistenceError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Conflict(message) => write!(formatter, "{message}"),
            Self::Unavailable(message) => write!(formatter, "{message}"),
        }
    }
}

impl Error for RtcPersistenceError {}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcRuntimeLoadRequest {
    pub tenant_id: String,
    pub organization_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcTenantOrganizationScope {
    pub tenant_id: String,
    pub organization_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RtcMediaSessionIdempotencyClaim {
    Claimed,
    Existing(RtcMediaSessionIdempotencyRecord),
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcRecordingArtifactLifecycleReconcileResult {
    pub scanned: usize,
    pub soft_deleted: usize,
    pub hard_deleted: usize,
    pub skipped: usize,
    pub failures: Vec<String>,
}

pub struct RtcRecordingLifecycleReconcileQuery {
    pub batch_size: u32,
    pub soft_delete_cutoff: String,
    pub hard_delete_cutoff: String,
}

pub trait RtcPersistencePort: Send + Sync {
    fn persist_changes<'a>(
        &'a self,
        changes: RtcPersistenceChangeSet,
    ) -> RtcPersistenceFuture<'a, ()>;

    fn load_runtime_snapshot<'a>(
        &'a self,
        request: RtcRuntimeLoadRequest,
    ) -> RtcPersistenceFuture<'a, RtcPersistenceChangeSet>;

    fn resolve_media_session_idempotency_record<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        idempotency_key: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSessionIdempotencyRecord>>;

    fn claim_media_session_create_idempotency<'a>(
        &'a self,
        record: RtcMediaSessionIdempotencyRecord,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim>;

    fn load_media_session<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSession>>;

    /// Returns `true` when the event row was inserted, `false` when it was a duplicate.
    fn try_insert_webhook_event<'a>(
        &'a self,
        event: &'a RtcProviderWebhookEventRecord,
    ) -> RtcPersistenceFuture<'a, bool>;

    /// Distinct tenant scopes with media sessions that may require reconciliation.
    fn list_active_reconcile_scopes<'a>(
        &'a self,
    ) -> RtcPersistenceFuture<'a, Vec<RtcTenantOrganizationScope>>;

    /// Returns lifecycle candidates older than the supplied day thresholds.
    fn list_recording_artifact_lifecycle_candidates<'a>(
        &'a self,
        query: RtcRecordingLifecycleReconcileQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcMediaArtifact>>;
}

#[derive(Clone, Debug, Default)]
pub struct NoopRtcPersistencePort;

impl RtcPersistencePort for NoopRtcPersistencePort {
    fn persist_changes<'a>(
        &'a self,
        _changes: RtcPersistenceChangeSet,
    ) -> RtcPersistenceFuture<'a, ()> {
        Box::pin(async { Ok(()) })
    }

    fn load_runtime_snapshot<'a>(
        &'a self,
        _request: RtcRuntimeLoadRequest,
    ) -> RtcPersistenceFuture<'a, RtcPersistenceChangeSet> {
        Box::pin(async { Ok(RtcPersistenceChangeSet::default()) })
    }

    fn resolve_media_session_idempotency_record<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _idempotency_key: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSessionIdempotencyRecord>> {
        Box::pin(async { Ok(None) })
    }

    fn claim_media_session_create_idempotency<'a>(
        &'a self,
        _record: RtcMediaSessionIdempotencyRecord,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim> {
        Box::pin(async { Ok(RtcMediaSessionIdempotencyClaim::Claimed) })
    }

    fn load_media_session<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSession>> {
        Box::pin(async { Ok(None) })
    }

    fn try_insert_webhook_event<'a>(
        &'a self,
        _event: &'a RtcProviderWebhookEventRecord,
    ) -> RtcPersistenceFuture<'a, bool> {
        Box::pin(async { Ok(true) })
    }

    fn list_active_reconcile_scopes<'a>(
        &'a self,
    ) -> RtcPersistenceFuture<'a, Vec<RtcTenantOrganizationScope>> {
        Box::pin(async { Ok(Vec::new()) })
    }

    fn list_recording_artifact_lifecycle_candidates<'a>(
        &'a self,
        _query: RtcRecordingLifecycleReconcileQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcMediaArtifact>> {
        Box::pin(async { Ok(Vec::new()) })
    }
}
