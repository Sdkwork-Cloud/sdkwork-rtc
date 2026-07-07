use std::collections::BTreeMap;

use sdkwork_communication_rtc_service::{
    RtcActiveProviderProfileListPage, RtcMediaArtifact, RtcMediaArtifactListPage, RtcMediaSession, RtcMediaSessionCompletionRecord,
    RtcMediaSessionIdempotencyClaim, RtcMediaSessionIdempotencyRecord, RtcMediaSessionListPage,
    RtcPersistenceChangeSet, RtcPersistenceError, RtcPersistenceFuture, RtcPersistencePort,
    RtcProviderAccountListPage, RtcProviderApplicationListPage, RtcProviderCredentialListPage,
    RtcProviderAccount, RtcProviderApplication, RtcProviderCredential, RtcProviderProfile,
    RtcProviderRoute,
    RtcProviderEventKind, RtcProviderProfileListPage, RtcProviderQueryJobRecord,
    RtcProviderQueryKind, RtcProviderQuerySnapshotListPage, RtcProviderQuerySnapshotRecord,
    RtcProviderRouteListPage, RtcProviderWebhookEventListPage, RtcProviderWebhookEventRecord,
    RtcQualitySampleListPage, RtcRecordingLifecycleReconcileQuery, RtcRoom, RtcRoomListPage,
    RtcRoomScopeQuery, RtcRuntimeLoadRequest, RtcScopedListQuery, RtcTenantOrganizationScope,
    RtcStaleMediaSessionReconcileCandidates, RtcStaleMediaSessionReconcileQuery,
    rtc_hydration_max_idempotency_records,
    rtc_hydration_max_media_sessions, rtc_hydration_max_provider_accounts,
    rtc_hydration_max_provider_applications, rtc_hydration_max_provider_credentials,
    rtc_hydration_max_provider_profiles, rtc_hydration_max_provider_query_jobs,
    rtc_hydration_max_provider_query_snapshots, rtc_hydration_max_provider_routes,
    rtc_hydration_max_rooms, rtc_hydration_max_session_token_grants,
    rtc_hydration_max_webhook_events,
    utc_now_rfc3339_millis,
};
use sqlx::{Executor, PgPool, Postgres, Sqlite, SqlitePool};

use crate::{
    persistence_list_pages::{
        postgres_list_active_provider_profiles_page, postgres_list_media_artifacts_page,
        postgres_list_media_artifacts_scope_page, postgres_list_media_sessions_page,
        postgres_list_provider_accounts_page, postgres_list_provider_applications_page,
        postgres_list_provider_credentials_page, postgres_list_provider_profiles_page,
        postgres_list_provider_query_snapshots_page, postgres_list_provider_routes_page,
        postgres_list_quality_samples_scope_page, postgres_list_rooms_page,
        postgres_list_webhook_events_page,
        sqlite_list_active_provider_profiles_page, sqlite_list_media_artifacts_page,
        sqlite_list_media_artifacts_scope_page, sqlite_list_media_sessions_page,
        sqlite_list_provider_accounts_page, sqlite_list_provider_applications_page,
        sqlite_list_provider_credentials_page, sqlite_list_provider_profiles_page,
        sqlite_list_provider_query_snapshots_page, sqlite_list_provider_routes_page,
        sqlite_list_quality_samples_scope_page, sqlite_list_rooms_page,
        sqlite_list_webhook_events_page,
    },
    RtcPostgresCompletionRecordRepository, RtcPostgresMediaSessionIdempotencyRepository,
    RtcPostgresMediaSessionRepository, RtcPostgresProviderAccountRepository,
    RtcPostgresProviderEventRepository, RtcPostgresProviderProfileRepository,
    RtcPostgresProviderRouteRepository, RtcPostgresSessionTokenGrantRepository,
    RtcSqliteCompletionRecordRepository,
    RtcSqliteMediaSessionIdempotencyRepository, RtcSqliteMediaSessionRepository,
    RtcSqliteProviderAccountRepository, RtcSqliteProviderEventRepository,
    RtcSqliteProviderProfileRepository, RtcSqliteProviderRouteRepository,
    RtcSqliteSessionTokenGrantRepository, RtcStorageError,
    RtcStorageResult,
};

#[derive(Clone, Debug)]
pub struct RtcSqlitePersistencePort {
    pool: SqlitePool,
    media_sessions: RtcSqliteMediaSessionRepository,
    completion_records: RtcSqliteCompletionRecordRepository,
    provider_accounts: RtcSqliteProviderAccountRepository,
    provider_profiles: RtcSqliteProviderProfileRepository,
    provider_routes: RtcSqliteProviderRouteRepository,
    session_token_grants: RtcSqliteSessionTokenGrantRepository,
}

impl RtcSqlitePersistencePort {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool: pool.clone(),
            media_sessions: RtcSqliteMediaSessionRepository::new(pool.clone()),
            completion_records: RtcSqliteCompletionRecordRepository::new(pool.clone()),
            provider_accounts: RtcSqliteProviderAccountRepository::new(pool.clone()),
            provider_profiles: RtcSqliteProviderProfileRepository::new(pool.clone()),
            provider_routes: RtcSqliteProviderRouteRepository::new(pool.clone()),
            session_token_grants: RtcSqliteSessionTokenGrantRepository::new(pool),
        }
    }

    async fn persist_changes_inner(
        &self,
        changes: RtcPersistenceChangeSet,
    ) -> RtcStorageResult<()> {
        let mut tx = self.pool.begin().await?;
        match self.apply_sqlite_changes(&mut tx, &changes).await {
            Ok(()) => tx.commit().await.map_err(Into::into),
            Err(error) => {
                let _ = tx.rollback().await;
                Err(error)
            }
        }
    }

    async fn apply_sqlite_changes(
        &self,
        tx: &mut sqlx::Transaction<'_, Sqlite>,
        changes: &RtcPersistenceChangeSet,
    ) -> RtcStorageResult<()> {
        let updated_at = change_timestamp(changes);
        let session_scope = session_scope_index(changes);

        for account in &changes.provider_accounts {
            self.provider_accounts
                .upsert_provider_account_with(
                    &mut **tx,
                    stable_numeric_id("provider_account", &account.id),
                    account,
                )
                .await?;
        }
        for application in &changes.provider_applications {
            self.provider_accounts
                .upsert_provider_application_with(
                    &mut **tx,
                    stable_numeric_id("provider_application", &application.id),
                    application,
                )
                .await?;
        }
        for credential in &changes.provider_credentials {
            self.provider_accounts
                .upsert_provider_credential_with(
                    &mut **tx,
                    stable_numeric_id("provider_credential", &credential.id),
                    credential,
                )
                .await?;
        }
        for profile in &changes.provider_profiles {
            self.provider_profiles
                .upsert_provider_profile_with(
                    &mut **tx,
                    stable_numeric_id("provider_profile", &profile.id),
                    profile,
                )
                .await?;
        }
        for route in &changes.provider_routes {
            self.provider_routes
                .upsert_provider_route_with(
                    &mut **tx,
                    stable_numeric_id("provider_route", &route.id),
                    route,
                    &updated_at,
                )
                .await?;
        }
        for room in &changes.rooms {
            self.media_sessions
                .upsert_room_with(
                    &mut **tx,
                    stable_numeric_id("room", &room.id),
                    room,
                    &updated_at,
                )
                .await?;
        }
        for session in &changes.media_sessions {
            let expected_version = changes
                .media_session_persist_versions
                .get(&session.id)
                .copied()
                .unwrap_or(0);
            self.media_sessions
                .upsert_media_session_with(
                    &mut **tx,
                    stable_numeric_id("media_session", &session.id),
                    session,
                    &updated_at,
                    expected_version,
                )
                .await?;
        }
        for participant in &changes.media_participants {
            let (tenant_id, organization_id) =
                scoped_session(&session_scope, &participant.session_id)?;
            self.media_sessions
                .upsert_media_participant_with(
                    &mut **tx,
                    stable_numeric_id("media_participant", &participant.id),
                    tenant_id,
                    organization_id,
                    participant,
                    &updated_at,
                )
                .await?;
        }
        for track in &changes.media_tracks {
            let (tenant_id, organization_id) = scoped_session(&session_scope, &track.session_id)?;
            self.media_sessions
                .upsert_media_track_with(
                    &mut **tx,
                    stable_numeric_id("media_track", &track.id),
                    tenant_id,
                    organization_id,
                    track,
                    &updated_at,
                )
                .await?;
        }
        for artifact in &changes.media_artifacts {
            let (_, organization_id) = scoped_session(&session_scope, &artifact.rtc_session_id)?;
            self.media_sessions
                .upsert_media_artifact_with(
                    &mut **tx,
                    stable_numeric_id("media_artifact", &artifact.id),
                    organization_id,
                    artifact,
                    &updated_at,
                )
                .await?;
        }
        for sample in &changes.quality_samples {
            let (tenant_id, organization_id) = scoped_session(&session_scope, &sample.session_id)?;
            self.media_sessions
                .insert_quality_sample_with(
                    &mut **tx,
                    stable_numeric_id("quality_sample", &sample.id),
                    tenant_id,
                    organization_id,
                    sample,
                )
                .await?;
        }
        for event in &changes.webhook_events {
            upsert_sqlite_provider_webhook_event(&mut **tx, event).await?;
        }
        for job in &changes.provider_query_jobs {
            upsert_sqlite_provider_query_job(&mut **tx, job).await?;
        }
        for snapshot in &changes.provider_query_snapshots {
            upsert_sqlite_provider_query_snapshot(&mut **tx, snapshot).await?;
        }
        for completion in &changes.completion_records {
            self.completion_records
                .upsert_completion_record_with(
                    tx,
                    stable_numeric_id("completion_record", &completion.id),
                    completion,
                )
                .await?;
        }
        for record in &changes.media_session_idempotencies {
            RtcSqliteMediaSessionIdempotencyRepository::new(self.pool.clone())
                .upsert_idempotency_record_with(
                    tx,
                    stable_numeric_id("media_session_idempotency", &record.id),
                    record,
                )
                .await?;
        }
        for grant in &changes.session_token_grants {
            self.session_token_grants
                .upsert_session_token_grant_with(
                    &mut **tx,
                    stable_numeric_id("session_token_grant", &grant.id),
                    grant,
                )
                .await?;
        }
        for revocation in &changes.session_token_grant_revocations {
            self.session_token_grants
                .revoke_active_grants_with(
                    &mut **tx,
                    revocation.tenant_id.as_str(),
                    revocation.organization_id.as_str(),
                    revocation.session_id.as_str(),
                    revocation.participant_id.as_deref(),
                    revocation.revoked_at.as_str(),
                )
                .await?;
        }

        Ok(())
    }

    async fn load_runtime_snapshot_inner(
        &self,
        request: RtcRuntimeLoadRequest,
    ) -> RtcStorageResult<RtcPersistenceChangeSet> {
        let tenant_id = request.tenant_id.as_str();
        let organization_id = request.organization_id.as_str();
        let provider_accounts = self
            .provider_accounts
            .list_hydration_provider_accounts_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_accounts()).unwrap_or(200),
            )
            .await?;
        let provider_applications = self
            .provider_accounts
            .list_hydration_provider_applications_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_applications()).unwrap_or(500),
            )
            .await?;
        let provider_credentials = self
            .provider_accounts
            .list_hydration_provider_credentials_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_credentials()).unwrap_or(500),
            )
            .await?;
        let provider_profiles = self
            .provider_profiles
            .list_hydration_provider_profiles_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_profiles()).unwrap_or(200),
            )
            .await?;
        let provider_routes = self
            .provider_routes
            .list_hydration_provider_routes_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_routes()).unwrap_or(500),
            )
            .await?;
        let rooms = self
            .media_sessions
            .list_hydration_rooms_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_rooms()).unwrap_or(500),
            )
            .await?;
        let media_sessions = self
            .media_sessions
            .list_hydration_media_sessions_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_media_sessions()).unwrap_or(200),
            )
            .await?;
        let media_participants = media_sessions
            .iter()
            .flat_map(|session| session.participants.clone())
            .collect::<Vec<_>>();
        let session_ids = media_sessions
            .iter()
            .map(|session| session.id.clone())
            .collect::<Vec<_>>();
        let media_tracks = self
            .media_sessions
            .list_media_tracks_for_sessions(session_ids.as_slice())
            .await?;
        let media_artifacts = self
            .media_sessions
            .list_media_artifacts_for_sessions(session_ids.as_slice())
            .await?;
        let quality_samples = self
            .media_sessions
            .list_quality_samples_for_sessions(session_ids.as_slice())
            .await?;
        let completion_records = self
            .completion_records
            .list_completion_records_for_sessions(session_ids.as_slice())
            .await?;
        let provider_events = RtcSqliteProviderEventRepository::new(self.pool.clone());
        let webhook_events = provider_events
            .list_hydration_webhook_events_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_webhook_events()).unwrap_or(500),
            )
            .await?;
        let provider_query_jobs = provider_events
            .list_hydration_provider_query_jobs_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_query_jobs()).unwrap_or(200),
            )
            .await?;
        let provider_query_snapshots = provider_events
            .list_hydration_provider_query_snapshots_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_query_snapshots()).unwrap_or(200),
            )
            .await?;
        let media_session_idempotencies =
            RtcSqliteMediaSessionIdempotencyRepository::new(self.pool.clone())
                .list_hydration_idempotency_records_for_scope(
                    tenant_id,
                    organization_id,
                    i64::try_from(rtc_hydration_max_idempotency_records()).unwrap_or(500),
                )
                .await?;
        let session_token_grants = self
            .session_token_grants
            .list_hydration_session_token_grants_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_session_token_grants()).unwrap_or(500),
            )
            .await?;
        let media_session_persist_versions = self
            .media_sessions
            .list_media_session_versions_for_scope(tenant_id, organization_id)
            .await?;
        Ok(RtcPersistenceChangeSet {
            provider_accounts,
            provider_applications,
            provider_credentials,
            provider_profiles,
            provider_routes,
            rooms,
            media_sessions,
            media_participants,
            media_tracks,
            media_artifacts,
            quality_samples,
            completion_records,
            webhook_events,
            provider_query_jobs,
            provider_query_snapshots,
            media_session_idempotencies,
            session_token_grants,
            session_token_grant_revocations: Vec::new(),
            media_session_persist_versions,
        })
    }

    async fn prepare_media_session_create_with_idempotency_inner(
        &self,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: RtcMediaSession,
        updated_at: String,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        let mut tx = self.pool.begin().await?;
        let claim = self
            .prepare_media_session_create_on_sqlite_transaction(
                &mut tx,
                idempotency_record,
                session,
                updated_at,
            )
            .await?;
        tx.commit().await?;
        Ok(claim)
    }

    async fn prepare_media_session_create_on_sqlite_transaction(
        &self,
        tx: &mut sqlx::Transaction<'_, Sqlite>,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: RtcMediaSession,
        updated_at: String,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        let idempotency_repo = RtcSqliteMediaSessionIdempotencyRepository::new(self.pool.clone());
        match idempotency_repo
            .claim_idempotency_record_on_transaction(
                tx,
                stable_numeric_id("media_session_idempotency", &idempotency_record.id),
                &idempotency_record,
            )
            .await?
        {
            RtcMediaSessionIdempotencyClaim::Claimed => {
                self.media_sessions
                    .upsert_media_session_with(
                        &mut **tx,
                        stable_numeric_id("media_session", &session.id),
                        &session,
                        &updated_at,
                        0,
                    )
                    .await?;
                Ok(RtcMediaSessionIdempotencyClaim::Claimed)
            }
            existing @ RtcMediaSessionIdempotencyClaim::Existing(_) => Ok(existing),
        }
    }
}

impl RtcPersistencePort for RtcSqlitePersistencePort {
    fn persist_changes<'a>(
        &'a self,
        changes: RtcPersistenceChangeSet,
    ) -> RtcPersistenceFuture<'a, ()> {
        Box::pin(async move {
            self.persist_changes_inner(changes)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn load_runtime_snapshot<'a>(
        &'a self,
        request: RtcRuntimeLoadRequest,
    ) -> RtcPersistenceFuture<'a, RtcPersistenceChangeSet> {
        Box::pin(async move {
            self.load_runtime_snapshot_inner(request)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn resolve_media_session_idempotency_record<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        idempotency_key: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSessionIdempotencyRecord>> {
        Box::pin(async move {
            RtcSqliteMediaSessionIdempotencyRepository::new(self.pool.clone())
                .resolve_idempotency_record_by_key(tenant_id, organization_id, idempotency_key)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn claim_media_session_create_idempotency<'a>(
        &'a self,
        record: RtcMediaSessionIdempotencyRecord,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim> {
        Box::pin(async move {
            RtcSqliteMediaSessionIdempotencyRepository::new(self.pool.clone())
                .claim_idempotency_record(
                    stable_numeric_id("media_session_idempotency", &record.id),
                    &record,
                )
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn prepare_media_session_create_with_idempotency<'a>(
        &'a self,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: RtcMediaSession,
        updated_at: String,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim> {
        Box::pin(async move {
            self.prepare_media_session_create_with_idempotency_inner(
                idempotency_record,
                session,
                updated_at,
            )
            .await
            .map_err(storage_to_persistence_error)
        })
    }

    fn load_media_session<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSession>> {
        Box::pin(async move {
            self.media_sessions
                .get_media_session_for_scope(tenant_id, organization_id, media_session_id)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn get_media_session_persist_version<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<i64>> {
        Box::pin(async move {
            self.media_sessions
                .get_media_session_version_for_scope(tenant_id, organization_id, media_session_id)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn try_insert_webhook_event<'a>(
        &'a self,
        event: &'a RtcProviderWebhookEventRecord,
    ) -> RtcPersistenceFuture<'a, bool> {
        Box::pin(async move {
            try_insert_sqlite_provider_webhook_event(&self.pool, event)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_active_reconcile_scopes<'a>(
        &'a self,
    ) -> RtcPersistenceFuture<'a, Vec<RtcTenantOrganizationScope>> {
        Box::pin(async move {
            self.media_sessions
                .list_active_reconcile_scopes()
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_recording_artifact_lifecycle_candidates<'a>(
        &'a self,
        query: RtcRecordingLifecycleReconcileQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcMediaArtifact>> {
        Box::pin(async move {
            self.media_sessions
                .list_recording_artifact_lifecycle_candidates(query)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_stale_media_sessions_for_reconcile<'a>(
        &'a self,
        query: RtcStaleMediaSessionReconcileQuery,
    ) -> RtcPersistenceFuture<'a, RtcStaleMediaSessionReconcileCandidates> {
        Box::pin(async move {
            self.media_sessions
                .list_stale_media_sessions_for_reconcile(query)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn get_room<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        room_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcRoom>> {
        Box::pin(async move {
            self.media_sessions
                .get_room_for_scope(tenant_id, organization_id, room_id)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn get_provider_account<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_account_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderAccount>> {
        Box::pin(async move {
            let account = self
                .provider_accounts
                .get_provider_account_by_id(provider_account_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_account(account, tenant_id, organization_id))
        })
    }

    fn get_provider_application<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_application_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderApplication>> {
        Box::pin(async move {
            let application = self
                .provider_accounts
                .get_provider_application_by_id(provider_application_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_application(
                application,
                tenant_id,
                organization_id,
            ))
        })
    }

    fn get_provider_credential<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_credential_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderCredential>> {
        Box::pin(async move {
            let credential = self
                .provider_accounts
                .get_provider_credential_by_id(provider_credential_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_credential(
                credential,
                tenant_id,
                organization_id,
            ))
        })
    }

    fn get_provider_profile<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_profile_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderProfile>> {
        Box::pin(async move {
            let profile = self
                .provider_profiles
                .get_provider_profile_by_id(provider_profile_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_profile(profile, tenant_id, organization_id))
        })
    }

    fn get_provider_route<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_route_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderRoute>> {
        Box::pin(async move {
            let route = self
                .provider_routes
                .get_provider_route_by_id(provider_route_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_route(route, tenant_id, organization_id))
        })
    }

    fn get_provider_query_job<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_query_job_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderQueryJobRecord>> {
        Box::pin(async move {
            let job = RtcSqliteProviderEventRepository::new(self.pool.clone())
                .get_provider_query_job_by_id(provider_query_job_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_query_job(job, tenant_id, organization_id))
        })
    }

    fn list_rooms_for_scope<'a>(
        &'a self,
        query: RtcRoomScopeQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcRoom>> {
        Box::pin(async move {
            self.media_sessions
                .list_hydration_rooms_for_scope(
                    query.tenant_id.as_str(),
                    query.organization_id.as_str(),
                    i64::try_from(rtc_hydration_max_rooms()).unwrap_or(500),
                )
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_rooms_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcRoomListPage> {
        Box::pin(async move { sqlite_list_rooms_page(&self.media_sessions, query).await })
    }

    fn list_media_sessions_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionListPage> {
        Box::pin(async move {
            sqlite_list_media_sessions_page(&self.media_sessions, query).await
        })
    }

    fn list_active_provider_profiles_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcActiveProviderProfileListPage> {
        Box::pin(async move {
            sqlite_list_active_provider_profiles_page(&self.provider_profiles, query).await
        })
    }

    fn list_media_artifacts_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaArtifactListPage> {
        Box::pin(async move {
            if query.media_session_id.is_some() {
                sqlite_list_media_artifacts_page(&self.media_sessions, query).await
            } else {
                sqlite_list_media_artifacts_scope_page(&self.media_sessions, query).await
            }
        })
    }

    fn list_provider_profiles_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderProfileListPage> {
        Box::pin(async move {
            sqlite_list_provider_profiles_page(&self.provider_profiles, query).await
        })
    }

    fn list_provider_accounts_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderAccountListPage> {
        Box::pin(async move {
            sqlite_list_provider_accounts_page(&self.provider_accounts, query).await
        })
    }

    fn list_provider_applications_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderApplicationListPage> {
        Box::pin(async move {
            sqlite_list_provider_applications_page(&self.provider_accounts, query).await
        })
    }

    fn list_provider_credentials_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderCredentialListPage> {
        Box::pin(async move {
            sqlite_list_provider_credentials_page(&self.provider_accounts, query).await
        })
    }

    fn list_provider_routes_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderRouteListPage> {
        Box::pin(async move {
            sqlite_list_provider_routes_page(&self.provider_routes, query).await
        })
    }

    fn list_webhook_events_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderWebhookEventListPage> {
        let pool = self.pool.clone();
        Box::pin(async move {
            sqlite_list_webhook_events_page(&RtcSqliteProviderEventRepository::new(pool), query)
                .await
        })
    }

    fn list_provider_query_snapshots_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderQuerySnapshotListPage> {
        let pool = self.pool.clone();
        Box::pin(async move {
            sqlite_list_provider_query_snapshots_page(
                &RtcSqliteProviderEventRepository::new(pool),
                query,
            )
            .await
        })
    }

    fn list_quality_samples_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcQualitySampleListPage> {
        Box::pin(async move {
            sqlite_list_quality_samples_scope_page(&self.media_sessions, query).await
        })
    }

    fn revoke_session_token_grants_for_session<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        session_id: &'a str,
        revoked_at: &'a str,
    ) -> RtcPersistenceFuture<'a, ()> {
        let repository = self.session_token_grants.clone();
        Box::pin(async move {
            repository
                .revoke_active_grants_for_session(
                    tenant_id,
                    organization_id,
                    session_id,
                    revoked_at,
                )
                .await
                .map_err(storage_to_persistence_error)
        })
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresPersistencePort {
    pool: PgPool,
    media_sessions: RtcPostgresMediaSessionRepository,
    completion_records: RtcPostgresCompletionRecordRepository,
    provider_accounts: RtcPostgresProviderAccountRepository,
    provider_profiles: RtcPostgresProviderProfileRepository,
    provider_routes: RtcPostgresProviderRouteRepository,
    session_token_grants: RtcPostgresSessionTokenGrantRepository,
}

impl RtcPostgresPersistencePort {
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool: pool.clone(),
            media_sessions: RtcPostgresMediaSessionRepository::new(pool.clone()),
            completion_records: RtcPostgresCompletionRecordRepository::new(pool.clone()),
            provider_accounts: RtcPostgresProviderAccountRepository::new(pool.clone()),
            provider_profiles: RtcPostgresProviderProfileRepository::new(pool.clone()),
            provider_routes: RtcPostgresProviderRouteRepository::new(pool.clone()),
            session_token_grants: RtcPostgresSessionTokenGrantRepository::new(pool),
        }
    }

    async fn persist_changes_inner(
        &self,
        changes: RtcPersistenceChangeSet,
    ) -> RtcStorageResult<()> {
        let mut tx = self.pool.begin().await?;
        match self.apply_postgres_changes(&mut tx, &changes).await {
            Ok(()) => tx.commit().await.map_err(Into::into),
            Err(error) => {
                let _ = tx.rollback().await;
                Err(error)
            }
        }
    }

    async fn apply_postgres_changes(
        &self,
        tx: &mut sqlx::Transaction<'_, Postgres>,
        changes: &RtcPersistenceChangeSet,
    ) -> RtcStorageResult<()> {
        let updated_at = change_timestamp(changes);
        let session_scope = session_scope_index(changes);

        for account in &changes.provider_accounts {
            self.provider_accounts
                .upsert_provider_account_with(
                    &mut **tx,
                    stable_numeric_id("provider_account", &account.id),
                    account,
                )
                .await?;
        }
        for application in &changes.provider_applications {
            self.provider_accounts
                .upsert_provider_application_with(
                    &mut **tx,
                    stable_numeric_id("provider_application", &application.id),
                    application,
                )
                .await?;
        }
        for credential in &changes.provider_credentials {
            self.provider_accounts
                .upsert_provider_credential_with(
                    &mut **tx,
                    stable_numeric_id("provider_credential", &credential.id),
                    credential,
                )
                .await?;
        }
        for profile in &changes.provider_profiles {
            self.provider_profiles
                .upsert_provider_profile_with(
                    &mut **tx,
                    stable_numeric_id("provider_profile", &profile.id),
                    profile,
                )
                .await?;
        }
        for route in &changes.provider_routes {
            self.provider_routes
                .upsert_provider_route_with(
                    &mut **tx,
                    stable_numeric_id("provider_route", &route.id),
                    route,
                    &updated_at,
                )
                .await?;
        }
        for room in &changes.rooms {
            self.media_sessions
                .upsert_room_with(
                    &mut **tx,
                    stable_numeric_id("room", &room.id),
                    room,
                    &updated_at,
                )
                .await?;
        }
        for session in &changes.media_sessions {
            let expected_version = changes
                .media_session_persist_versions
                .get(&session.id)
                .copied()
                .unwrap_or(0);
            self.media_sessions
                .upsert_media_session_with(
                    &mut **tx,
                    stable_numeric_id("media_session", &session.id),
                    session,
                    &updated_at,
                    expected_version,
                )
                .await?;
        }
        for participant in &changes.media_participants {
            let (tenant_id, organization_id) =
                scoped_session(&session_scope, &participant.session_id)?;
            self.media_sessions
                .upsert_media_participant_with(
                    &mut **tx,
                    stable_numeric_id("media_participant", &participant.id),
                    tenant_id,
                    organization_id,
                    participant,
                    &updated_at,
                )
                .await?;
        }
        for track in &changes.media_tracks {
            let (tenant_id, organization_id) = scoped_session(&session_scope, &track.session_id)?;
            self.media_sessions
                .upsert_media_track_with(
                    &mut **tx,
                    stable_numeric_id("media_track", &track.id),
                    tenant_id,
                    organization_id,
                    track,
                    &updated_at,
                )
                .await?;
        }
        for artifact in &changes.media_artifacts {
            let (_, organization_id) = scoped_session(&session_scope, &artifact.rtc_session_id)?;
            self.media_sessions
                .upsert_media_artifact_with(
                    &mut **tx,
                    stable_numeric_id("media_artifact", &artifact.id),
                    organization_id,
                    artifact,
                    &updated_at,
                )
                .await?;
        }
        for sample in &changes.quality_samples {
            let (tenant_id, organization_id) = scoped_session(&session_scope, &sample.session_id)?;
            self.media_sessions
                .insert_quality_sample_with(
                    &mut **tx,
                    stable_numeric_id("quality_sample", &sample.id),
                    tenant_id,
                    organization_id,
                    sample,
                )
                .await?;
        }
        for event in &changes.webhook_events {
            upsert_postgres_provider_webhook_event(&mut **tx, event).await?;
        }
        for job in &changes.provider_query_jobs {
            upsert_postgres_provider_query_job(&mut **tx, job).await?;
        }
        for snapshot in &changes.provider_query_snapshots {
            upsert_postgres_provider_query_snapshot(&mut **tx, snapshot).await?;
        }
        for completion in &changes.completion_records {
            self.completion_records
                .upsert_completion_record_with(
                    tx,
                    stable_numeric_id("completion_record", &completion.id),
                    completion,
                )
                .await?;
        }
        for record in &changes.media_session_idempotencies {
            RtcPostgresMediaSessionIdempotencyRepository::new(self.pool.clone())
                .upsert_idempotency_record_with(
                    tx,
                    stable_numeric_id("media_session_idempotency", &record.id),
                    record,
                )
                .await?;
        }
        for grant in &changes.session_token_grants {
            self.session_token_grants
                .upsert_session_token_grant_with(
                    &mut **tx,
                    stable_numeric_id("session_token_grant", &grant.id),
                    grant,
                )
                .await?;
        }
        for revocation in &changes.session_token_grant_revocations {
            self.session_token_grants
                .revoke_active_grants_with(
                    &mut **tx,
                    revocation.tenant_id.as_str(),
                    revocation.organization_id.as_str(),
                    revocation.session_id.as_str(),
                    revocation.participant_id.as_deref(),
                    revocation.revoked_at.as_str(),
                )
                .await?;
        }

        Ok(())
    }

    async fn load_runtime_snapshot_inner(
        &self,
        request: RtcRuntimeLoadRequest,
    ) -> RtcStorageResult<RtcPersistenceChangeSet> {
        let tenant_id = request.tenant_id.as_str();
        let organization_id = request.organization_id.as_str();
        let provider_accounts = self
            .provider_accounts
            .list_hydration_provider_accounts_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_accounts()).unwrap_or(200),
            )
            .await?;
        let provider_applications = self
            .provider_accounts
            .list_hydration_provider_applications_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_applications()).unwrap_or(500),
            )
            .await?;
        let provider_credentials = self
            .provider_accounts
            .list_hydration_provider_credentials_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_credentials()).unwrap_or(500),
            )
            .await?;
        let provider_profiles = self
            .provider_profiles
            .list_hydration_provider_profiles_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_profiles()).unwrap_or(200),
            )
            .await?;
        let provider_routes = self
            .provider_routes
            .list_hydration_provider_routes_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_routes()).unwrap_or(500),
            )
            .await?;
        let rooms = self
            .media_sessions
            .list_hydration_rooms_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_rooms()).unwrap_or(500),
            )
            .await?;
        let media_sessions = self
            .media_sessions
            .list_hydration_media_sessions_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_media_sessions()).unwrap_or(200),
            )
            .await?;
        let media_participants = media_sessions
            .iter()
            .flat_map(|session| session.participants.clone())
            .collect::<Vec<_>>();
        let session_ids = media_sessions
            .iter()
            .map(|session| session.id.clone())
            .collect::<Vec<_>>();
        let media_tracks = self
            .media_sessions
            .list_media_tracks_for_sessions(session_ids.as_slice())
            .await?;
        let media_artifacts = self
            .media_sessions
            .list_media_artifacts_for_sessions(session_ids.as_slice())
            .await?;
        let quality_samples = self
            .media_sessions
            .list_quality_samples_for_sessions(session_ids.as_slice())
            .await?;
        let completion_records = self
            .completion_records
            .list_completion_records_for_sessions(session_ids.as_slice())
            .await?;
        let provider_events = RtcPostgresProviderEventRepository::new(self.pool.clone());
        let webhook_events = provider_events
            .list_hydration_webhook_events_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_webhook_events()).unwrap_or(500),
            )
            .await?;
        let provider_query_jobs = provider_events
            .list_hydration_provider_query_jobs_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_query_jobs()).unwrap_or(200),
            )
            .await?;
        let provider_query_snapshots = provider_events
            .list_hydration_provider_query_snapshots_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_provider_query_snapshots()).unwrap_or(200),
            )
            .await?;
        let media_session_idempotencies =
            RtcPostgresMediaSessionIdempotencyRepository::new(self.pool.clone())
                .list_hydration_idempotency_records_for_scope(
                    tenant_id,
                    organization_id,
                    i64::try_from(rtc_hydration_max_idempotency_records()).unwrap_or(500),
                )
                .await?;
        let session_token_grants = self
            .session_token_grants
            .list_hydration_session_token_grants_for_scope(
                tenant_id,
                organization_id,
                i64::try_from(rtc_hydration_max_session_token_grants()).unwrap_or(500),
            )
            .await?;
        let media_session_persist_versions = self
            .media_sessions
            .list_media_session_versions_for_scope(tenant_id, organization_id)
            .await?;
        Ok(RtcPersistenceChangeSet {
            provider_accounts,
            provider_applications,
            provider_credentials,
            provider_profiles,
            provider_routes,
            rooms,
            media_sessions,
            media_participants,
            media_tracks,
            media_artifacts,
            quality_samples,
            completion_records,
            webhook_events,
            provider_query_jobs,
            provider_query_snapshots,
            media_session_idempotencies,
            session_token_grants,
            session_token_grant_revocations: Vec::new(),
            media_session_persist_versions,
        })
    }

    async fn prepare_media_session_create_with_idempotency_inner(
        &self,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: RtcMediaSession,
        updated_at: String,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        let mut tx = self.pool.begin().await?;
        let claim = self
            .prepare_media_session_create_on_postgres_transaction(
                &mut tx,
                idempotency_record,
                session,
                updated_at,
            )
            .await?;
        tx.commit().await?;
        Ok(claim)
    }

    async fn prepare_media_session_create_on_postgres_transaction(
        &self,
        tx: &mut sqlx::Transaction<'_, Postgres>,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: RtcMediaSession,
        updated_at: String,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        let idempotency_repo =
            RtcPostgresMediaSessionIdempotencyRepository::new(self.pool.clone());
        match idempotency_repo
            .claim_idempotency_record_on_transaction(
                tx,
                stable_numeric_id("media_session_idempotency", &idempotency_record.id),
                &idempotency_record,
            )
            .await?
        {
            RtcMediaSessionIdempotencyClaim::Claimed => {
                self.media_sessions
                    .upsert_media_session_with(
                        &mut **tx,
                        stable_numeric_id("media_session", &session.id),
                        &session,
                        &updated_at,
                        0,
                    )
                    .await?;
                Ok(RtcMediaSessionIdempotencyClaim::Claimed)
            }
            existing @ RtcMediaSessionIdempotencyClaim::Existing(_) => Ok(existing),
        }
    }
}

impl RtcPersistencePort for RtcPostgresPersistencePort {
    fn persist_changes<'a>(
        &'a self,
        changes: RtcPersistenceChangeSet,
    ) -> RtcPersistenceFuture<'a, ()> {
        Box::pin(async move {
            self.persist_changes_inner(changes)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn load_runtime_snapshot<'a>(
        &'a self,
        request: RtcRuntimeLoadRequest,
    ) -> RtcPersistenceFuture<'a, RtcPersistenceChangeSet> {
        Box::pin(async move {
            self.load_runtime_snapshot_inner(request)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn resolve_media_session_idempotency_record<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        idempotency_key: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSessionIdempotencyRecord>> {
        Box::pin(async move {
            RtcPostgresMediaSessionIdempotencyRepository::new(self.pool.clone())
                .resolve_idempotency_record_by_key(tenant_id, organization_id, idempotency_key)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn claim_media_session_create_idempotency<'a>(
        &'a self,
        record: RtcMediaSessionIdempotencyRecord,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim> {
        Box::pin(async move {
            RtcPostgresMediaSessionIdempotencyRepository::new(self.pool.clone())
                .claim_idempotency_record(
                    stable_numeric_id("media_session_idempotency", &record.id),
                    &record,
                )
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn prepare_media_session_create_with_idempotency<'a>(
        &'a self,
        idempotency_record: RtcMediaSessionIdempotencyRecord,
        session: RtcMediaSession,
        updated_at: String,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionIdempotencyClaim> {
        Box::pin(async move {
            self.prepare_media_session_create_with_idempotency_inner(
                idempotency_record,
                session,
                updated_at,
            )
            .await
            .map_err(storage_to_persistence_error)
        })
    }

    fn load_media_session<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcMediaSession>> {
        Box::pin(async move {
            self.media_sessions
                .get_media_session_for_scope(tenant_id, organization_id, media_session_id)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn get_media_session_persist_version<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        media_session_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<i64>> {
        Box::pin(async move {
            self.media_sessions
                .get_media_session_version_for_scope(tenant_id, organization_id, media_session_id)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn try_insert_webhook_event<'a>(
        &'a self,
        event: &'a RtcProviderWebhookEventRecord,
    ) -> RtcPersistenceFuture<'a, bool> {
        Box::pin(async move {
            try_insert_postgres_provider_webhook_event(&self.pool, event)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_active_reconcile_scopes<'a>(
        &'a self,
    ) -> RtcPersistenceFuture<'a, Vec<RtcTenantOrganizationScope>> {
        Box::pin(async move {
            self.media_sessions
                .list_active_reconcile_scopes()
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_recording_artifact_lifecycle_candidates<'a>(
        &'a self,
        query: RtcRecordingLifecycleReconcileQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcMediaArtifact>> {
        Box::pin(async move {
            self.media_sessions
                .list_recording_artifact_lifecycle_candidates(query)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_stale_media_sessions_for_reconcile<'a>(
        &'a self,
        query: RtcStaleMediaSessionReconcileQuery,
    ) -> RtcPersistenceFuture<'a, RtcStaleMediaSessionReconcileCandidates> {
        Box::pin(async move {
            self.media_sessions
                .list_stale_media_sessions_for_reconcile(query)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn get_room<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        room_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcRoom>> {
        Box::pin(async move {
            self.media_sessions
                .get_room_for_scope(tenant_id, organization_id, room_id)
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn get_provider_account<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_account_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderAccount>> {
        Box::pin(async move {
            let account = self
                .provider_accounts
                .get_provider_account_by_id(provider_account_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_account(account, tenant_id, organization_id))
        })
    }

    fn get_provider_application<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_application_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderApplication>> {
        Box::pin(async move {
            let application = self
                .provider_accounts
                .get_provider_application_by_id(provider_application_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_application(
                application,
                tenant_id,
                organization_id,
            ))
        })
    }

    fn get_provider_credential<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_credential_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderCredential>> {
        Box::pin(async move {
            let credential = self
                .provider_accounts
                .get_provider_credential_by_id(provider_credential_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_credential(
                credential,
                tenant_id,
                organization_id,
            ))
        })
    }

    fn get_provider_profile<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_profile_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderProfile>> {
        Box::pin(async move {
            let profile = self
                .provider_profiles
                .get_provider_profile_by_id(provider_profile_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_profile(profile, tenant_id, organization_id))
        })
    }

    fn get_provider_route<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_route_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderRoute>> {
        Box::pin(async move {
            let route = self
                .provider_routes
                .get_provider_route_by_id(provider_route_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_route(route, tenant_id, organization_id))
        })
    }

    fn get_provider_query_job<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        provider_query_job_id: &'a str,
    ) -> RtcPersistenceFuture<'a, Option<RtcProviderQueryJobRecord>> {
        Box::pin(async move {
            let job = RtcPostgresProviderEventRepository::new(self.pool.clone())
                .get_provider_query_job_by_id(provider_query_job_id)
                .await
                .map_err(storage_to_persistence_error)?;
            Ok(scoped_provider_query_job(job, tenant_id, organization_id))
        })
    }

    fn list_rooms_for_scope<'a>(
        &'a self,
        query: RtcRoomScopeQuery,
    ) -> RtcPersistenceFuture<'a, Vec<RtcRoom>> {
        Box::pin(async move {
            self.media_sessions
                .list_hydration_rooms_for_scope(
                    query.tenant_id.as_str(),
                    query.organization_id.as_str(),
                    i64::try_from(rtc_hydration_max_rooms()).unwrap_or(500),
                )
                .await
                .map_err(storage_to_persistence_error)
        })
    }

    fn list_rooms_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcRoomListPage> {
        Box::pin(async move { postgres_list_rooms_page(&self.media_sessions, query).await })
    }

    fn list_media_sessions_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaSessionListPage> {
        Box::pin(async move {
            postgres_list_media_sessions_page(&self.media_sessions, query).await
        })
    }

    fn list_active_provider_profiles_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcActiveProviderProfileListPage> {
        Box::pin(async move {
            postgres_list_active_provider_profiles_page(&self.provider_profiles, query).await
        })
    }

    fn list_media_artifacts_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcMediaArtifactListPage> {
        Box::pin(async move {
            if query.media_session_id.is_some() {
                postgres_list_media_artifacts_page(&self.media_sessions, query).await
            } else {
                postgres_list_media_artifacts_scope_page(&self.media_sessions, query).await
            }
        })
    }

    fn list_provider_profiles_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderProfileListPage> {
        Box::pin(async move {
            postgres_list_provider_profiles_page(&self.provider_profiles, query).await
        })
    }

    fn list_provider_accounts_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderAccountListPage> {
        Box::pin(async move {
            postgres_list_provider_accounts_page(&self.provider_accounts, query).await
        })
    }

    fn list_provider_applications_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderApplicationListPage> {
        Box::pin(async move {
            postgres_list_provider_applications_page(&self.provider_accounts, query).await
        })
    }

    fn list_provider_credentials_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderCredentialListPage> {
        Box::pin(async move {
            postgres_list_provider_credentials_page(&self.provider_accounts, query).await
        })
    }

    fn list_provider_routes_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderRouteListPage> {
        Box::pin(async move {
            postgres_list_provider_routes_page(&self.provider_routes, query).await
        })
    }

    fn list_webhook_events_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderWebhookEventListPage> {
        let pool = self.pool.clone();
        Box::pin(async move {
            postgres_list_webhook_events_page(&RtcPostgresProviderEventRepository::new(pool), query)
                .await
        })
    }

    fn list_provider_query_snapshots_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcProviderQuerySnapshotListPage> {
        let pool = self.pool.clone();
        Box::pin(async move {
            postgres_list_provider_query_snapshots_page(
                &RtcPostgresProviderEventRepository::new(pool),
                query,
            )
            .await
        })
    }

    fn list_quality_samples_page<'a>(
        &'a self,
        query: RtcScopedListQuery,
    ) -> RtcPersistenceFuture<'a, RtcQualitySampleListPage> {
        Box::pin(async move {
            postgres_list_quality_samples_scope_page(&self.media_sessions, query).await
        })
    }

    fn revoke_session_token_grants_for_session<'a>(
        &'a self,
        tenant_id: &'a str,
        organization_id: &'a str,
        session_id: &'a str,
        revoked_at: &'a str,
    ) -> RtcPersistenceFuture<'a, ()> {
        let repository = self.session_token_grants.clone();
        Box::pin(async move {
            repository
                .revoke_active_grants_for_session(
                    tenant_id,
                    organization_id,
                    session_id,
                    revoked_at,
                )
                .await
                .map_err(storage_to_persistence_error)
        })
    }
}

async fn try_insert_sqlite_provider_webhook_event(
    pool: &SqlitePool,
    event: &RtcProviderWebhookEventRecord,
) -> RtcStorageResult<bool> {
    let result = sqlx::query(
        r#"
        INSERT INTO rtc_provider_webhook_event (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            provider_profile_dedupe_key,
            external_event_id,
            external_event_dedupe_key,
            event_type,
            event_kind,
            room_id,
            session_id,
            participant_id,
            recording_id,
            payload_hash,
            raw_payload,
            normalized_event,
            signature_header,
            received_at,
            processed_at,
            status,
            created_at,
            updated_at,
            version
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ON CONFLICT(
            tenant_id,
            organization_id,
            provider,
            provider_profile_dedupe_key,
            external_event_dedupe_key,
            payload_hash
        ) DO NOTHING
        "#,
    )
    .bind(stable_numeric_id("provider_webhook_event", &event.id))
    .bind(&event.id)
    .bind(parse_i64_field("tenant_id", &event.tenant_id)?)
    .bind(parse_i64_field("organization_id", &event.organization_id)?)
    .bind(&event.provider)
    .bind(&event.provider_profile_id)
    .bind(optional_dedupe_key(
        event.provider_profile_id.as_deref(),
        "__default_provider_profile__",
    ))
    .bind(&event.external_event_id)
    .bind(optional_dedupe_key(
        event.external_event_id.as_deref(),
        event.payload_hash.as_str(),
    ))
    .bind(&event.event_type)
    .bind(event_kind_to_str(&event.event_kind))
    .bind(&event.room_id)
    .bind(&event.media_session_id)
    .bind(&event.participant_id)
    .bind(&event.recording_id)
    .bind(&event.payload_hash)
    .bind(serde_json::to_string(&event.raw_payload)?)
    .bind(serde_json::to_string(&event.normalized_event)?)
    .bind(&event.signature_header)
    .bind(&event.received_at)
    .bind(&event.processed_at)
    .bind(webhook_status_to_i32(&event.status)?)
    .bind(&event.received_at)
    .bind(
        event
            .processed_at
            .as_deref()
            .unwrap_or(event.received_at.as_str()),
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

async fn upsert_sqlite_provider_webhook_event<'e, E>(
    executor: E,
    event: &RtcProviderWebhookEventRecord,
) -> RtcStorageResult<()>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query(
        r#"
        INSERT INTO rtc_provider_webhook_event (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            provider_profile_dedupe_key,
            external_event_id,
            external_event_dedupe_key,
            event_type,
            event_kind,
            room_id,
            session_id,
            participant_id,
            recording_id,
            payload_hash,
            raw_payload,
            normalized_event,
            signature_header,
            received_at,
            processed_at,
            status,
            created_at,
            updated_at,
            version
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ON CONFLICT(
            tenant_id,
            organization_id,
            provider,
            provider_profile_dedupe_key,
            external_event_dedupe_key,
            payload_hash
        ) DO UPDATE SET
            uuid = excluded.uuid,
            room_id = excluded.room_id,
            session_id = excluded.session_id,
            participant_id = excluded.participant_id,
            recording_id = excluded.recording_id,
            normalized_event = excluded.normalized_event,
            processed_at = excluded.processed_at,
            status = excluded.status,
            updated_at = excluded.updated_at,
            version = rtc_provider_webhook_event.version + 1
        "#,
    )
    .bind(stable_numeric_id("provider_webhook_event", &event.id))
    .bind(&event.id)
    .bind(parse_i64_field("tenant_id", &event.tenant_id)?)
    .bind(parse_i64_field("organization_id", &event.organization_id)?)
    .bind(&event.provider)
    .bind(&event.provider_profile_id)
    .bind(optional_dedupe_key(
        event.provider_profile_id.as_deref(),
        "__default_provider_profile__",
    ))
    .bind(&event.external_event_id)
    .bind(optional_dedupe_key(
        event.external_event_id.as_deref(),
        event.payload_hash.as_str(),
    ))
    .bind(&event.event_type)
    .bind(event_kind_to_str(&event.event_kind))
    .bind(&event.room_id)
    .bind(&event.media_session_id)
    .bind(&event.participant_id)
    .bind(&event.recording_id)
    .bind(&event.payload_hash)
    .bind(serde_json::to_string(&event.raw_payload)?)
    .bind(serde_json::to_string(&event.normalized_event)?)
    .bind(&event.signature_header)
    .bind(&event.received_at)
    .bind(&event.processed_at)
    .bind(webhook_status_to_i32(&event.status)?)
    .bind(&event.received_at)
    .bind(
        event
            .processed_at
            .as_deref()
            .unwrap_or(event.received_at.as_str()),
    )
    .execute(executor)
    .await?;

    Ok(())
}

async fn try_insert_postgres_provider_webhook_event(
    pool: &PgPool,
    event: &RtcProviderWebhookEventRecord,
) -> RtcStorageResult<bool> {
    let result = sqlx::query(
        r#"
        INSERT INTO rtc_provider_webhook_event (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            provider_profile_dedupe_key,
            external_event_id,
            external_event_dedupe_key,
            event_type,
            event_kind,
            room_id,
            session_id,
            participant_id,
            recording_id,
            payload_hash,
            raw_payload,
            normalized_event,
            signature_header,
            received_at,
            processed_at,
            status,
            created_at,
            updated_at,
            version
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18,
            $19,
            $20::text::timestamp,
            NULLIF($21::text, '')::timestamp,
            $22,
            $23::text::timestamp,
            $24::text::timestamp,
            0
        )
        ON CONFLICT(
            tenant_id,
            organization_id,
            provider,
            provider_profile_dedupe_key,
            external_event_dedupe_key,
            payload_hash
        ) DO NOTHING
        "#,
    )
    .bind(stable_numeric_id("provider_webhook_event", &event.id))
    .bind(&event.id)
    .bind(parse_i64_field("tenant_id", &event.tenant_id)?)
    .bind(parse_i64_field("organization_id", &event.organization_id)?)
    .bind(&event.provider)
    .bind(&event.provider_profile_id)
    .bind(optional_dedupe_key(
        event.provider_profile_id.as_deref(),
        "__default_provider_profile__",
    ))
    .bind(&event.external_event_id)
    .bind(optional_dedupe_key(
        event.external_event_id.as_deref(),
        event.payload_hash.as_str(),
    ))
    .bind(&event.event_type)
    .bind(event_kind_to_str(&event.event_kind))
    .bind(&event.room_id)
    .bind(&event.media_session_id)
    .bind(&event.participant_id)
    .bind(&event.recording_id)
    .bind(&event.payload_hash)
    .bind(serde_json::to_string(&event.raw_payload)?)
    .bind(serde_json::to_string(&event.normalized_event)?)
    .bind(&event.signature_header)
    .bind(&event.received_at)
    .bind(event.processed_at.as_deref().unwrap_or(""))
    .bind(webhook_status_to_i32(&event.status)?)
    .bind(&event.received_at)
    .bind(
        event
            .processed_at
            .as_deref()
            .unwrap_or(event.received_at.as_str()),
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

async fn upsert_postgres_provider_webhook_event<'e, E>(
    executor: E,
    event: &RtcProviderWebhookEventRecord,
) -> RtcStorageResult<()>
where
    E: Executor<'e, Database = Postgres>,
{
    sqlx::query(
        r#"
        INSERT INTO rtc_provider_webhook_event (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            provider_profile_dedupe_key,
            external_event_id,
            external_event_dedupe_key,
            event_type,
            event_kind,
            room_id,
            session_id,
            participant_id,
            recording_id,
            payload_hash,
            raw_payload,
            normalized_event,
            signature_header,
            received_at,
            processed_at,
            status,
            created_at,
            updated_at,
            version
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18,
            $19,
            $20::text::timestamp,
            NULLIF($21::text, '')::timestamp,
            $22,
            $23::text::timestamp,
            $24::text::timestamp,
            0
        )
        ON CONFLICT(
            tenant_id,
            organization_id,
            provider,
            provider_profile_dedupe_key,
            external_event_dedupe_key,
            payload_hash
        ) DO UPDATE SET
            uuid = excluded.uuid,
            room_id = excluded.room_id,
            session_id = excluded.session_id,
            participant_id = excluded.participant_id,
            recording_id = excluded.recording_id,
            normalized_event = excluded.normalized_event,
            processed_at = excluded.processed_at,
            status = excluded.status,
            updated_at = excluded.updated_at,
            version = rtc_provider_webhook_event.version + 1
        "#,
    )
    .bind(stable_numeric_id("provider_webhook_event", &event.id))
    .bind(&event.id)
    .bind(parse_i64_field("tenant_id", &event.tenant_id)?)
    .bind(parse_i64_field("organization_id", &event.organization_id)?)
    .bind(&event.provider)
    .bind(&event.provider_profile_id)
    .bind(optional_dedupe_key(
        event.provider_profile_id.as_deref(),
        "__default_provider_profile__",
    ))
    .bind(&event.external_event_id)
    .bind(optional_dedupe_key(
        event.external_event_id.as_deref(),
        event.payload_hash.as_str(),
    ))
    .bind(&event.event_type)
    .bind(event_kind_to_str(&event.event_kind))
    .bind(&event.room_id)
    .bind(&event.media_session_id)
    .bind(&event.participant_id)
    .bind(&event.recording_id)
    .bind(&event.payload_hash)
    .bind(sqlx::types::Json(event.raw_payload.clone()))
    .bind(sqlx::types::Json(event.normalized_event.clone()))
    .bind(&event.signature_header)
    .bind(&event.received_at)
    .bind(event.processed_at.as_deref().unwrap_or(""))
    .bind(webhook_status_to_i32(&event.status)?)
    .bind(&event.received_at)
    .bind(
        event
            .processed_at
            .as_deref()
            .unwrap_or(event.received_at.as_str()),
    )
    .execute(executor)
    .await?;

    Ok(())
}

async fn upsert_sqlite_provider_query_job<'e, E>(
    executor: E,
    job: &RtcProviderQueryJobRecord,
) -> RtcStorageResult<()>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query(
        r#"
        INSERT INTO rtc_provider_query_job (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            query_kind,
            target_kind,
            target_id,
            room_id,
            session_id,
            provider_session_id,
            provider_request_id,
            status,
            requested_at,
            completed_at,
            result_snapshot,
            created_at,
            updated_at,
            version
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ON CONFLICT(uuid) DO UPDATE SET
            provider_profile_id = excluded.provider_profile_id,
            query_kind = excluded.query_kind,
            target_kind = excluded.target_kind,
            target_id = excluded.target_id,
            room_id = excluded.room_id,
            session_id = excluded.session_id,
            provider_session_id = excluded.provider_session_id,
            provider_request_id = excluded.provider_request_id,
            status = excluded.status,
            completed_at = excluded.completed_at,
            result_snapshot = excluded.result_snapshot,
            updated_at = excluded.updated_at,
            version = rtc_provider_query_job.version + 1
        "#,
    )
    .bind(stable_numeric_id("provider_query_job", &job.id))
    .bind(&job.id)
    .bind(parse_i64_field("tenant_id", &job.tenant_id)?)
    .bind(parse_i64_field("organization_id", &job.organization_id)?)
    .bind(&job.provider)
    .bind(&job.provider_profile_id)
    .bind(query_kind_to_str(&job.query_kind))
    .bind(&job.target_kind)
    .bind(&job.target_id)
    .bind(&job.room_id)
    .bind(&job.media_session_id)
    .bind(&job.provider_session_id)
    .bind(&job.provider_request_id)
    .bind(provider_query_status_to_i32(&job.status)?)
    .bind(&job.requested_at)
    .bind(&job.completed_at)
    .bind(serde_json::to_string(&job.result_snapshot)?)
    .bind(&job.requested_at)
    .bind(
        job.completed_at
            .as_deref()
            .unwrap_or(job.requested_at.as_str()),
    )
    .execute(executor)
    .await?;

    Ok(())
}

async fn upsert_sqlite_provider_query_snapshot<'e, E>(
    executor: E,
    snapshot: &RtcProviderQuerySnapshotRecord,
) -> RtcStorageResult<()>
where
    E: Executor<'e, Database = Sqlite>,
{
    sqlx::query(
        r#"
        INSERT INTO rtc_provider_query_snapshot (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider_query_job_id,
            provider,
            query_kind,
            target_kind,
            target_id,
            provider_session_id,
            snapshot_kind,
            snapshot_payload,
            captured_at,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(uuid) DO UPDATE SET
            provider_query_job_id = excluded.provider_query_job_id,
            provider = excluded.provider,
            query_kind = excluded.query_kind,
            target_kind = excluded.target_kind,
            target_id = excluded.target_id,
            provider_session_id = excluded.provider_session_id,
            snapshot_kind = excluded.snapshot_kind,
            snapshot_payload = excluded.snapshot_payload,
            captured_at = excluded.captured_at
        "#,
    )
    .bind(stable_numeric_id("provider_query_snapshot", &snapshot.id))
    .bind(&snapshot.id)
    .bind(parse_i64_field("tenant_id", &snapshot.tenant_id)?)
    .bind(parse_i64_field(
        "organization_id",
        &snapshot.organization_id,
    )?)
    .bind(&snapshot.provider_query_job_id)
    .bind(&snapshot.provider)
    .bind(query_kind_to_str(&snapshot.query_kind))
    .bind(&snapshot.target_kind)
    .bind(&snapshot.target_id)
    .bind(&snapshot.provider_session_id)
    .bind(&snapshot.snapshot_kind)
    .bind(serde_json::to_string(&snapshot.snapshot_payload)?)
    .bind(&snapshot.captured_at)
    .bind(&snapshot.captured_at)
    .execute(executor)
    .await?;

    Ok(())
}

async fn upsert_postgres_provider_query_job<'e, E>(
    executor: E,
    job: &RtcProviderQueryJobRecord,
) -> RtcStorageResult<()>
where
    E: Executor<'e, Database = Postgres>,
{
    sqlx::query(
        r#"
        INSERT INTO rtc_provider_query_job (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            query_kind,
            target_kind,
            target_id,
            room_id,
            session_id,
            provider_session_id,
            provider_request_id,
            status,
            requested_at,
            completed_at,
            result_snapshot,
            created_at,
            updated_at,
            version
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15::text::timestamp,
            NULLIF($16::text, '')::timestamp,
            $17,
            $18::text::timestamp,
            $19::text::timestamp,
            0
        )
        ON CONFLICT(uuid) DO UPDATE SET
            provider_profile_id = excluded.provider_profile_id,
            query_kind = excluded.query_kind,
            target_kind = excluded.target_kind,
            target_id = excluded.target_id,
            room_id = excluded.room_id,
            session_id = excluded.session_id,
            provider_session_id = excluded.provider_session_id,
            provider_request_id = excluded.provider_request_id,
            status = excluded.status,
            completed_at = excluded.completed_at,
            result_snapshot = excluded.result_snapshot,
            updated_at = excluded.updated_at,
            version = rtc_provider_query_job.version + 1
        "#,
    )
    .bind(stable_numeric_id("provider_query_job", &job.id))
    .bind(&job.id)
    .bind(parse_i64_field("tenant_id", &job.tenant_id)?)
    .bind(parse_i64_field("organization_id", &job.organization_id)?)
    .bind(&job.provider)
    .bind(&job.provider_profile_id)
    .bind(query_kind_to_str(&job.query_kind))
    .bind(&job.target_kind)
    .bind(&job.target_id)
    .bind(&job.room_id)
    .bind(&job.media_session_id)
    .bind(&job.provider_session_id)
    .bind(&job.provider_request_id)
    .bind(provider_query_status_to_i32(&job.status)?)
    .bind(&job.requested_at)
    .bind(job.completed_at.as_deref().unwrap_or(""))
    .bind(sqlx::types::Json(job.result_snapshot.clone()))
    .bind(&job.requested_at)
    .bind(
        job.completed_at
            .as_deref()
            .unwrap_or(job.requested_at.as_str()),
    )
    .execute(executor)
    .await?;

    Ok(())
}

async fn upsert_postgres_provider_query_snapshot<'e, E>(
    executor: E,
    snapshot: &RtcProviderQuerySnapshotRecord,
) -> RtcStorageResult<()>
where
    E: Executor<'e, Database = Postgres>,
{
    sqlx::query(
        r#"
        INSERT INTO rtc_provider_query_snapshot (
            id,
            uuid,
            tenant_id,
            organization_id,
            provider_query_job_id,
            provider,
            query_kind,
            target_kind,
            target_id,
            provider_session_id,
            snapshot_kind,
            snapshot_payload,
            captured_at,
            created_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13::text::timestamp,
            $14::text::timestamp
        )
        ON CONFLICT(uuid) DO UPDATE SET
            provider_query_job_id = excluded.provider_query_job_id,
            provider = excluded.provider,
            query_kind = excluded.query_kind,
            target_kind = excluded.target_kind,
            target_id = excluded.target_id,
            provider_session_id = excluded.provider_session_id,
            snapshot_kind = excluded.snapshot_kind,
            snapshot_payload = excluded.snapshot_payload,
            captured_at = excluded.captured_at
        "#,
    )
    .bind(stable_numeric_id("provider_query_snapshot", &snapshot.id))
    .bind(&snapshot.id)
    .bind(parse_i64_field("tenant_id", &snapshot.tenant_id)?)
    .bind(parse_i64_field(
        "organization_id",
        &snapshot.organization_id,
    )?)
    .bind(&snapshot.provider_query_job_id)
    .bind(&snapshot.provider)
    .bind(query_kind_to_str(&snapshot.query_kind))
    .bind(&snapshot.target_kind)
    .bind(&snapshot.target_id)
    .bind(&snapshot.provider_session_id)
    .bind(&snapshot.snapshot_kind)
    .bind(sqlx::types::Json(snapshot.snapshot_payload.clone()))
    .bind(&snapshot.captured_at)
    .bind(&snapshot.captured_at)
    .execute(executor)
    .await?;

    Ok(())
}

fn session_scope_index(changes: &RtcPersistenceChangeSet) -> BTreeMap<String, (String, String)> {
    let mut scope = BTreeMap::new();
    for session in &changes.media_sessions {
        scope.insert(
            session.id.clone(),
            (session.tenant_id.clone(), session.organization_id.clone()),
        );
    }
    for completion in &changes.completion_records {
        scope
            .entry(completion.media_session_id.clone())
            .or_insert_with(|| {
                (
                    completion.tenant_id.clone(),
                    completion.organization_id.clone(),
                )
            });
    }
    scope
}

fn scoped_session<'a>(
    scope: &'a BTreeMap<String, (String, String)>,
    media_session_id: &str,
) -> RtcStorageResult<(&'a str, &'a str)> {
    scope
        .get(media_session_id)
        .map(|(tenant_id, organization_id)| (tenant_id.as_str(), organization_id.as_str()))
        .ok_or_else(|| RtcStorageError::MissingMediaSessionSummary {
            media_session_id: media_session_id.to_string(),
        })
}

fn change_timestamp(changes: &RtcPersistenceChangeSet) -> String {
    changes
        .completion_records
        .iter()
        .map(|record| record.recorded_at.as_str())
        .chain(
            changes
                .media_sessions
                .iter()
                .filter_map(|session| session.completion_recorded_at.as_deref()),
        )
        .chain(
            changes
                .media_sessions
                .iter()
                .filter_map(|session| session.ended_at.as_deref()),
        )
        .next()
        .map(str::to_owned)
        .unwrap_or_else(utc_now_rfc3339_millis)
}

fn stable_numeric_id(namespace: &str, public_id: &str) -> i64 {
    let mut hash = 0xcbf2_9ce4_8422_2325_u64;
    for byte in namespace
        .as_bytes()
        .iter()
        .copied()
        .chain(std::iter::once(b':'))
        .chain(public_id.as_bytes().iter().copied())
    {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    let value = (hash & 0x7fff_ffff_ffff_ffff) as i64;
    if value == 0 { 1 } else { value }
}

fn parse_i64_field(field: &'static str, value: &str) -> RtcStorageResult<i64> {
    value
        .parse::<i64>()
        .map_err(|_| RtcStorageError::InvalidEnumValue {
            field,
            value: value.to_string(),
        })
}

fn query_kind_to_str(value: &RtcProviderQueryKind) -> &'static str {
    match value {
        RtcProviderQueryKind::RoomOnlineUsers => "room_online_users",
        RtcProviderQueryKind::RoomState => "room_state",
        RtcProviderQueryKind::MediaSessionState => "media_session_state",
        RtcProviderQueryKind::RecordingArtifacts => "recording_artifacts",
        RtcProviderQueryKind::QualitySamples => "quality_samples",
    }
}

fn provider_query_status_to_i32(value: &str) -> RtcStorageResult<i32> {
    match value {
        "requested" => Ok(1),
        "running" => Ok(2),
        "completed" => Ok(3),
        "failed" => Ok(4),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "provider_query_status",
            value: value.to_string(),
        }),
    }
}

fn event_kind_to_str(value: &RtcProviderEventKind) -> &'static str {
    match value {
        RtcProviderEventKind::ParticipantJoined => "participant_joined",
        RtcProviderEventKind::ParticipantLeft => "participant_left",
        RtcProviderEventKind::RoomStarted => "room_started",
        RtcProviderEventKind::RoomEnded => "room_ended",
        RtcProviderEventKind::RecordingStarted => "recording_started",
        RtcProviderEventKind::RecordingCompleted => "recording_completed",
        RtcProviderEventKind::RecordingFailed => "recording_failed",
        RtcProviderEventKind::MediaTrackStarted => "media_track_started",
        RtcProviderEventKind::MediaTrackStopped => "media_track_stopped",
        RtcProviderEventKind::QualitySample => "quality_sample",
        RtcProviderEventKind::Unknown => "unknown",
    }
}

fn webhook_status_to_i32(value: &str) -> RtcStorageResult<i32> {
    match value {
        "received" => Ok(1),
        "processed" => Ok(2),
        "failed" => Ok(3),
        "ignored" => Ok(4),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "webhook_status",
            value: value.to_string(),
        }),
    }
}

fn optional_dedupe_key(value: Option<&str>, fallback: &str) -> String {
    value
        .filter(|inner| !inner.is_empty())
        .unwrap_or(fallback)
        .to_string()
}

fn scoped_provider_account(
    account: Option<RtcProviderAccount>,
    tenant_id: &str,
    organization_id: &str,
) -> Option<RtcProviderAccount> {
    account.filter(|account| {
        account.tenant_id == tenant_id
            && account.organization_id == organization_id
            && account.deleted_at.is_none()
    })
}

fn scoped_provider_application(
    application: Option<RtcProviderApplication>,
    tenant_id: &str,
    organization_id: &str,
) -> Option<RtcProviderApplication> {
    application.filter(|application| {
        application.tenant_id == tenant_id
            && application.organization_id == organization_id
            && application.deleted_at.is_none()
    })
}

fn scoped_provider_credential(
    credential: Option<RtcProviderCredential>,
    tenant_id: &str,
    organization_id: &str,
) -> Option<RtcProviderCredential> {
    credential.filter(|credential| {
        credential.tenant_id == tenant_id && credential.organization_id == organization_id
    })
}

fn scoped_provider_profile(
    profile: Option<RtcProviderProfile>,
    tenant_id: &str,
    organization_id: &str,
) -> Option<RtcProviderProfile> {
    profile.filter(|profile| {
        profile.tenant_id == tenant_id
            && profile.organization_id == organization_id
            && profile.deleted_at.is_none()
    })
}

fn scoped_provider_route(
    route: Option<RtcProviderRoute>,
    tenant_id: &str,
    organization_id: &str,
) -> Option<RtcProviderRoute> {
    route.filter(|route| {
        route.tenant_id == tenant_id && route.organization_id == organization_id
    })
}

fn scoped_provider_query_job(
    job: Option<RtcProviderQueryJobRecord>,
    tenant_id: &str,
    organization_id: &str,
) -> Option<RtcProviderQueryJobRecord> {
    job.filter(|job| job.tenant_id == tenant_id && job.organization_id == organization_id)
}

fn storage_to_persistence_error(error: RtcStorageError) -> RtcPersistenceError {
    match error {
        RtcStorageError::Conflict(message) => RtcPersistenceError::Conflict(message),
        RtcStorageError::InvalidEnumValue { field, value } => {
            RtcPersistenceError::BadRequest(format!("{field}: {value}"))
        }
        RtcStorageError::Sqlx(sqlx::Error::Database(database_error))
            if database_error.is_unique_violation() =>
        {
            RtcPersistenceError::Conflict(database_error.to_string())
        }
        other => RtcPersistenceError::Unavailable(other.to_string()),
    }
}

#[allow(dead_code)]
fn assert_completion_type_is_part_of_public_port(_: &RtcMediaSessionCompletionRecord) {}
