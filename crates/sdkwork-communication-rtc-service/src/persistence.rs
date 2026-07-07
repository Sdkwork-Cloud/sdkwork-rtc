use std::collections::BTreeMap;
use std::error::Error;
use std::fmt;
use std::future::Future;
use std::pin::Pin;

use crate::{
    list_page::RtcListPage, scoped_list_query::RtcScopedListQuery, RtcMediaArtifact, RtcMediaParticipant, RtcMediaSession, RtcMediaSessionCompletionRecord,
    RtcMediaSessionIdempotencyRecord, RtcMediaTrack, RtcProviderAccount, RtcProviderApplication,
    RtcProviderCredential, RtcProviderProfile, RtcProviderQueryJobRecord,
    RtcProviderQuerySnapshotRecord, RtcProviderRoute, RtcProviderWebhookEventRecord,
    RtcQualitySample, RtcRoom, RtcActiveProviderProfile, RtcSessionTokenGrant,
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
    pub session_token_grants: Vec<RtcSessionTokenGrant>,
    pub session_token_grant_revocations: Vec<RtcSessionTokenGrantRevocation>,
    pub media_session_persist_versions: BTreeMap<String, i64>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcSessionTokenGrantRevocation {
    pub tenant_id: String,
    pub organization_id: String,
    pub session_id: String,
    pub participant_id: Option<String>,
    pub revoked_at: String,
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
            && self.session_token_grants.is_empty()
            && self.session_token_grant_revocations.is_empty()
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RtcPersistenceError {
    BadRequest(String),
    Conflict(String),
    Unavailable(String),
}

impl fmt::Display for RtcPersistenceError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BadRequest(message) => write!(formatter, "{message}"),
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

pub struct RtcStaleMediaSessionReconcileQuery {
    pub preparing_cutoff: String,
    pub active_default_cutoff: String,
    pub batch_size: u32,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcStaleMediaSessionReconcileCandidates {
    pub stale_candidates: Vec<RtcMediaSession>,
    pub provider_drift_candidates: Vec<RtcMediaSession>,
    pub failed_compensation_candidates: Vec<RtcMediaSession>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcRoomScopeQuery {
    pub tenant_id: String,
    pub organization_id: String,
}

pub type RtcRoomListPage = RtcListPage<RtcRoom>;
pub type RtcMediaSessionListPage = RtcListPage<RtcMediaSession>;
pub type RtcActiveProviderProfileListPage = RtcListPage<RtcActiveProviderProfile>;
pub type RtcMediaArtifactListPage = RtcListPage<RtcMediaArtifact>;
pub type RtcProviderProfileListPage = RtcListPage<RtcProviderProfile>;
pub type RtcProviderAccountListPage = RtcListPage<RtcProviderAccount>;
pub type RtcProviderApplicationListPage = RtcListPage<RtcProviderApplication>;
pub type RtcProviderCredentialListPage = RtcListPage<RtcProviderCredential>;
pub type RtcProviderRouteListPage = RtcListPage<RtcProviderRoute>;
pub type RtcProviderWebhookEventListPage = RtcListPage<RtcProviderWebhookEventRecord>;
pub type RtcProviderQuerySnapshotListPage = RtcListPage<RtcProviderQuerySnapshotRecord>;
pub type RtcQualitySampleListPage = RtcListPage<RtcQualitySample>;

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

    fn prepare_media_session_create_with_idempotency<'a>(
        &'a self,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: RtcMediaSession,
        updated_at: String,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim>;

    fn load_media_session<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSession>>;

    fn get_media_session_persist_version<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<i64>>;

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

    /// Returns preparing, active, and failed media sessions that may require reconciliation.
    fn list_stale_media_sessions_for_reconcile<'a>(
        &'a self,
        query: RtcStaleMediaSessionReconcileQuery,
    ) -> RtcPersistenceFuture<'a, RtcStaleMediaSessionReconcileCandidates>;

    fn get_room<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        room_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcRoom>>;

    fn get_provider_account<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_account_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderAccount>>;

    fn get_provider_application<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_application_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderApplication>>;

    fn get_provider_credential<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_credential_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderCredential>>;

    fn get_provider_profile<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_profile_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderProfile>>;

    fn get_provider_route<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_route_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderRoute>>;

    fn get_provider_query_job<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_query_job_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderQueryJobRecord>>;

    fn list_rooms_for_scope<'a>(
        &'a self,
        query: RtcRoomScopeQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcRoom>>;

    fn list_rooms_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcRoomListPage>;

    fn list_media_sessions_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionListPage>;

    fn list_active_provider_profiles_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcActiveProviderProfileListPage>;

    fn list_media_artifacts_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaArtifactListPage>;

    fn list_provider_profiles_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderProfileListPage>;

    fn list_provider_accounts_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderAccountListPage>;

    fn list_provider_applications_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderApplicationListPage>;

    fn list_provider_credentials_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderCredentialListPage>;

    fn list_provider_routes_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderRouteListPage>;

    fn list_webhook_events_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderWebhookEventListPage>;

    fn list_provider_query_snapshots_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderQuerySnapshotListPage>;

    fn list_quality_samples_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcQualitySampleListPage>;

    fn revoke_session_token_grants_for_session<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        session_id: &'a str,
        revoked_at: &'a str,
    ) -> RtcPersistenceFuture<'a, ()>;
}

fn empty_list_page<T>() -> RtcListPage<T> {
    RtcListPage::empty()
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

    fn prepare_media_session_create_with_idempotency<'a>(
        &'a self,
        _idempotency_record: RtcMediaSessionIdempotencyRecord,
        _session: RtcMediaSession,
        _updated_at: String,
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

    fn get_media_session_persist_version<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<i64>> {
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

    fn list_stale_media_sessions_for_reconcile<'a>(
        &'a self,
        _query: RtcStaleMediaSessionReconcileQuery,
    ) -> RtcPersistenceFuture<'a, RtcStaleMediaSessionReconcileCandidates> {
        Box::pin(async { Ok(RtcStaleMediaSessionReconcileCandidates::default()) })
    }

    fn get_room<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _room_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcRoom>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_account<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_account_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderAccount>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_application<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_application_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderApplication>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_credential<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_credential_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderCredential>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_profile<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_profile_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderProfile>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_route<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_route_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderRoute>> {
        Box::pin(async { Ok(None) })
    }

    fn get_provider_query_job<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _provider_query_job_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderQueryJobRecord>> {
        Box::pin(async { Ok(None) })
    }

    fn list_rooms_for_scope<'a>(
        &'a self,
        _query: RtcRoomScopeQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcRoom>> {
        Box::pin(async { Ok(Vec::new()) })
    }

    fn list_rooms_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcRoomListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_media_sessions_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_active_provider_profiles_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcActiveProviderProfileListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_media_artifacts_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaArtifactListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_provider_profiles_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderProfileListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_provider_accounts_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderAccountListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_provider_applications_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderApplicationListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_provider_credentials_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderCredentialListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_provider_routes_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderRouteListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_webhook_events_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderWebhookEventListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_provider_query_snapshots_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderQuerySnapshotListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn list_quality_samples_page<'a>(
        &'a self,
        _query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcQualitySampleListPage> {
        Box::pin(async { Ok(empty_list_page()) })
    }

    fn revoke_session_token_grants_for_session<'a>(
        &'a self,
        _tenant_id: &'a str,
        _organization_id: &'a str,
        _session_id: &'a str,
        _revoked_at: &'a str,
    ) -> RtcPersistenceFuture<'a, ()> {
        Box::pin(async { Ok(()) })
    }
}
