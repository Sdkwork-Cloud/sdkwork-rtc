use sdkwork_communication_rtc_service::{
    RtcDriveReference, RtcDriveSpaceType, RtcMediaArtifact, RtcMediaParticipant, RtcMediaResource,
    RtcMediaSession, RtcMediaSessionCompletionInput, RtcMediaSessionCompletionQualitySummary,
    RtcMediaSessionCompletionRecordingSummary, RtcMediaSessionEndSource, RtcMediaSessionMode,
    RtcMediaSessionStatus, RtcMediaSource, RtcMediaTrack, RtcMediaTrackKind, RtcMediaTrackSource,
    RtcMediaTrackStatus, RtcParticipantRole, RtcParticipantState, RtcQualitySample,
    RtcRecordingArtifactKind, RtcRecordingArtifactStatus, RtcRecordingLifecycleReconcileQuery,
    RtcRoom, RtcRoomStatus, RtcTenantOrganizationScope, rtc_provider_payload_hash,
};
use serde::de::DeserializeOwned;
use sqlx::{
    Executor, PgPool, Postgres, Row, Sqlite, SqlitePool, postgres::PgRow, sqlite::SqliteRow,
};

use crate::{RtcStorageError, RtcStorageResult};

#[derive(Clone, Debug)]
pub struct RtcSqliteMediaSessionRepository {
    pool: SqlitePool,
}

impl RtcSqliteMediaSessionRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn upsert_room(
        &self,
        numeric_id: i64,
        room: &RtcRoom,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_room_with(&self.pool, numeric_id, room, updated_at)
            .await
    }

    pub async fn upsert_room_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        room: &RtcRoom,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_room_sql())
            .bind(numeric_id)
            .bind(&room.id)
            .bind(parse_i64_field("tenant_id", &room.tenant_id)?)
            .bind(parse_i64_field("organization_id", &room.organization_id)?)
            .bind(parse_i64_field("owner_user_id", &room.owner_user_id)?)
            .bind(&room.title)
            .bind(room_status_to_i32(&room.status))
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_session(
        &self,
        numeric_id: i64,
        session: &RtcMediaSession,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_session_with(&self.pool, numeric_id, session, updated_at)
            .await
    }

    pub async fn upsert_media_session_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        session: &RtcMediaSession,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        let quality_summary = serialize_optional_json(&session.quality_summary)?;
        let recording_summary = serialize_optional_json(&session.recording_summary)?;

        sqlx::query(sqlite_upsert_media_session_sql())
            .bind(numeric_id)
            .bind(&session.id)
            .bind(parse_i64_field("tenant_id", &session.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &session.organization_id,
            )?)
            .bind(&session.room_id)
            .bind(parse_i64_field("owner_user_id", &session.owner_user_id)?)
            .bind(media_mode_to_i32(&session.media_mode))
            .bind(media_session_status_to_i32(&session.status))
            .bind(&session.provider_profile_id)
            .bind(&session.provider_session_id)
            .bind(&session.started_at)
            .bind(&session.connected_at)
            .bind(&session.ended_at)
            .bind(option_u64_to_i64(session.duration_ms))
            .bind(&session.end_reason)
            .bind(session.end_source.as_ref().map(end_source_to_str))
            .bind(u32_to_i64(session.participant_count))
            .bind(u32_to_i64(session.max_concurrent_participants))
            .bind(quality_summary)
            .bind(recording_summary)
            .bind(&session.completion_recorded_at)
            .bind(&session.last_provider_webhook_event_id)
            .bind(&session.last_provider_query_job_id)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_participant(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        participant: &RtcMediaParticipant,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_participant_with(
            &self.pool,
            numeric_id,
            tenant_id,
            organization_id,
            participant,
            updated_at,
        )
        .await
    }

    pub async fn upsert_media_participant_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        participant: &RtcMediaParticipant,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_media_participant_sql())
            .bind(numeric_id)
            .bind(&participant.id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&participant.session_id)
            .bind(parse_i64_field("user_id", &participant.user_id)?)
            .bind(&participant.display_name)
            .bind(participant_role_to_i32(&participant.role))
            .bind(participant_state_to_i32(&participant.state))
            .bind(bool_to_i64(participant.audio_muted))
            .bind(bool_to_i64(participant.video_muted))
            .bind(bool_to_i64(participant.screen_share_active))
            .bind(&participant.provider_participant_id)
            .bind(&participant.joined_at)
            .bind(&participant.left_at)
            .bind(option_u64_to_i64(participant.duration_ms))
            .bind(&participant.leave_reason)
            .bind(&participant.last_seen_at)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_track(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        track: &RtcMediaTrack,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_track_with(
            &self.pool,
            numeric_id,
            tenant_id,
            organization_id,
            track,
            updated_at,
        )
        .await
    }

    pub async fn upsert_media_track_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        track: &RtcMediaTrack,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_media_track_sql())
            .bind(numeric_id)
            .bind(&track.id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&track.session_id)
            .bind(&track.participant_id)
            .bind(track_kind_to_i32(&track.track_kind))
            .bind(track_source_to_i32(&track.track_source))
            .bind(&track.provider_track_id)
            .bind(track_status_to_i32(&track.status))
            .bind(&track.started_at)
            .bind(&track.ended_at)
            .bind(option_u64_to_i64(track.duration_ms))
            .bind(option_u64_to_i64(track.muted_duration_ms))
            .bind(&track.end_reason)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_artifact(
        &self,
        numeric_id: i64,
        organization_id: &str,
        artifact: &RtcMediaArtifact,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_artifact_with(
            &self.pool,
            numeric_id,
            organization_id,
            artifact,
            updated_at,
        )
        .await
    }

    pub async fn upsert_media_artifact_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        organization_id: &str,
        artifact: &RtcMediaArtifact,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        validate_rtc_media_artifact_drive_snapshot(artifact)?;
        let media_resource_snapshot = serialize_json(&artifact.resource)?;
        let resource_hash = artifact
            .resource_hash
            .clone()
            .unwrap_or_else(|| rtc_provider_payload_hash(&media_resource_snapshot));

        sqlx::query(sqlite_upsert_media_artifact_sql())
            .bind(numeric_id)
            .bind(&artifact.id)
            .bind(parse_i64_field("tenant_id", &artifact.tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&artifact.rtc_session_id)
            .bind(parse_i64_field("owner_user_id", &artifact.owner_user_id)?)
            .bind(recording_artifact_kind_to_i32(&artifact.artifact_kind))
            .bind(recording_artifact_status_to_i32(&artifact.artifact_status))
            .bind(&artifact.media_role)
            .bind(&artifact.provider_profile_id)
            .bind(&artifact.provider_artifact_id)
            .bind(&artifact.drive.space_id)
            .bind(artifact.drive.space_type.as_str())
            .bind(&artifact.drive.node_id)
            .bind(&artifact.drive.drive_uri)
            .bind(media_resource_snapshot)
            .bind(resource_hash)
            .bind(&artifact.started_at)
            .bind(&artifact.ended_at)
            .bind(option_u64_to_i64(artifact.duration_ms))
            .bind(&artifact.failure_reason)
            .bind(&artifact.source_provider_webhook_event_id)
            .bind(&artifact.source_provider_query_job_id)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn insert_quality_sample(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        sample: &RtcQualitySample,
    ) -> RtcStorageResult<()> {
        self.insert_quality_sample_with(&self.pool, numeric_id, tenant_id, organization_id, sample)
            .await
    }

    pub async fn insert_quality_sample_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        sample: &RtcQualitySample,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_quality_sample_sql())
            .bind(numeric_id)
            .bind(&sample.id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&sample.session_id)
            .bind(&sample.participant_id)
            .bind(sample.latency_ms.map(u32_to_i64))
            .bind(parse_optional_f64_field(
                "packet_loss_rate",
                sample.packet_loss_rate.as_deref(),
            )?)
            .bind(sample.jitter_ms.map(u32_to_i64))
            .bind(sample.bitrate_kbps.map(u32_to_i64))
            .bind(&sample.sampled_at)
            .bind(&sample.sampled_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn get_completion_input_by_session_id(
        &self,
        media_session_id: &str,
        recorded_at: &str,
    ) -> RtcStorageResult<Option<RtcMediaSessionCompletionInput>> {
        let sql = sqlite_media_session_select_sql("WHERE uuid = ?", "");
        let session_row = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_optional(&self.pool)
            .await?;
        let Some(session_row) = session_row else {
            return Ok(None);
        };

        let participants = self.list_media_participants(media_session_id).await?;
        let mut session = sqlite_row_to_media_session(session_row, participants)?;
        let tracks = self.list_media_tracks(media_session_id).await?;
        let artifacts = self.list_media_artifacts(media_session_id).await?;
        let quality_samples = self.list_quality_samples(media_session_id).await?;

        session.participant_count = session
            .participant_count
            .max(session.participants.len() as u32);
        session.max_concurrent_participants = session
            .max_concurrent_participants
            .max(session.participant_count);

        Ok(Some(RtcMediaSessionCompletionInput {
            source_webhook_event_id: session.last_provider_webhook_event_id.clone(),
            source_provider_query_job_id: session.last_provider_query_job_id.clone(),
            session,
            tracks,
            artifacts,
            quality_samples,
            recorded_at: recorded_at.to_string(),
        }))
    }

    async fn list_media_participants(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaParticipant>> {
        let sql = sqlite_media_participant_select_sql(
            "WHERE session_id = ?",
            "ORDER BY joined_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_media_participant)
            .collect()
    }

    pub async fn list_media_tracks(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaTrack>> {
        let sql = sqlite_media_track_select_sql(
            "WHERE session_id = ?",
            "ORDER BY started_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter().map(sqlite_row_to_media_track).collect()
    }

    async fn list_media_artifacts(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaArtifact>> {
        let sql = sqlite_media_artifact_select_sql(
            "WHERE session_id = ?",
            "ORDER BY started_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter().map(sqlite_row_to_media_artifact).collect()
    }

    async fn list_quality_samples(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcQualitySample>> {
        let sql = sqlite_quality_sample_select_sql(
            "WHERE session_id = ?",
            "ORDER BY sampled_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter().map(sqlite_row_to_quality_sample).collect()
    }

    pub async fn list_media_sessions_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaSession>> {
        let sql = sqlite_media_session_select_sql(
            "WHERE tenant_id = ? AND organization_id = ?",
            "ORDER BY started_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;
        let mut sessions = Vec::with_capacity(rows.len());
        for row in rows {
            let session_id: String = row.try_get("uuid")?;
            let participants = self.list_media_participants(session_id.as_str()).await?;
            sessions.push(sqlite_row_to_media_session(row, participants)?);
        }
        Ok(sessions)
    }

    pub async fn list_active_reconcile_scopes(
        &self,
    ) -> RtcStorageResult<Vec<RtcTenantOrganizationScope>> {
        const SQL: &str = r#"
            SELECT DISTINCT tenant_id, organization_id
            FROM rtc_media_session
            WHERE status IN (1, 2, 3, 5)
              AND deleted_at IS NULL
            ORDER BY tenant_id ASC, organization_id ASC
        "#;
        let rows = sqlx::query(SQL).fetch_all(&self.pool).await?;
        rows.into_iter()
            .map(|row| {
                Ok(RtcTenantOrganizationScope {
                    tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
                    organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
                })
            })
            .collect()
    }

    pub async fn list_recording_artifact_lifecycle_candidates(
        &self,
        query: RtcRecordingLifecycleReconcileQuery,
    ) -> RtcStorageResult<Vec<RtcMediaArtifact>> {
        const SQL: &str = r#"
            SELECT
                uuid, tenant_id, session_id, owner_user_id, artifact_kind,
                artifact_status, media_role, provider_profile_id, provider_artifact_id,
                drive_space_id, drive_space_type, drive_node_id, drive_uri, media_resource_snapshot,
                resource_hash, started_at, ended_at, duration_ms, failure_reason,
                source_provider_webhook_event_id, source_provider_query_job_id
            FROM rtc_media_artifact
            WHERE (
                artifact_status IN (3, 4)
                AND COALESCE(ended_at, started_at, created_at) <= ?
            ) OR (
                artifact_status = 5
                AND COALESCE(ended_at, started_at, created_at) <= ?
            )
            ORDER BY created_at ASC
            LIMIT ?
        "#;
        let rows = sqlx::query(SQL)
            .bind(query.soft_delete_cutoff.as_str())
            .bind(query.hard_delete_cutoff.as_str())
            .bind(i64::from(query.batch_size))
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter().map(sqlite_row_to_media_artifact).collect()
    }

    pub async fn get_media_session_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        media_session_id: &str,
    ) -> RtcStorageResult<Option<RtcMediaSession>> {
        let sql = sqlite_media_session_select_sql(
            "WHERE uuid = ? AND tenant_id = ? AND organization_id = ?",
            "",
        );
        let row = sqlx::query(&sql)
            .bind(media_session_id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_optional(&self.pool)
            .await?;
        let Some(row) = row else {
            return Ok(None);
        };
        let participants = self.list_media_participants(media_session_id).await?;
        Ok(Some(sqlite_row_to_media_session(row, participants)?))
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresMediaSessionRepository {
    pool: PgPool,
}

impl RtcPostgresMediaSessionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn upsert_room(
        &self,
        numeric_id: i64,
        room: &RtcRoom,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_room_with(&self.pool, numeric_id, room, updated_at)
            .await
    }

    pub async fn upsert_room_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        room: &RtcRoom,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_room_sql())
            .bind(numeric_id)
            .bind(&room.id)
            .bind(parse_i64_field("tenant_id", &room.tenant_id)?)
            .bind(parse_i64_field("organization_id", &room.organization_id)?)
            .bind(parse_i64_field("owner_user_id", &room.owner_user_id)?)
            .bind(&room.title)
            .bind(room_status_to_i32(&room.status))
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_session(
        &self,
        numeric_id: i64,
        session: &RtcMediaSession,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_session_with(&self.pool, numeric_id, session, updated_at)
            .await
    }

    pub async fn upsert_media_session_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        session: &RtcMediaSession,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        let quality_summary = serialize_optional_json(&session.quality_summary)?;
        let recording_summary = serialize_optional_json(&session.recording_summary)?;

        sqlx::query(postgres_upsert_media_session_sql())
            .bind(numeric_id)
            .bind(&session.id)
            .bind(parse_i64_field("tenant_id", &session.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &session.organization_id,
            )?)
            .bind(&session.room_id)
            .bind(parse_i64_field("owner_user_id", &session.owner_user_id)?)
            .bind(media_mode_to_i32(&session.media_mode))
            .bind(media_session_status_to_i32(&session.status))
            .bind(&session.provider_profile_id)
            .bind(&session.provider_session_id)
            .bind(&session.started_at)
            .bind(&session.connected_at)
            .bind(&session.ended_at)
            .bind(option_u64_to_i64(session.duration_ms))
            .bind(&session.end_reason)
            .bind(session.end_source.as_ref().map(end_source_to_str))
            .bind(u32_to_i32(session.participant_count))
            .bind(u32_to_i32(session.max_concurrent_participants))
            .bind(quality_summary)
            .bind(recording_summary)
            .bind(&session.completion_recorded_at)
            .bind(&session.last_provider_webhook_event_id)
            .bind(&session.last_provider_query_job_id)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_participant(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        participant: &RtcMediaParticipant,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_participant_with(
            &self.pool,
            numeric_id,
            tenant_id,
            organization_id,
            participant,
            updated_at,
        )
        .await
    }

    pub async fn upsert_media_participant_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        participant: &RtcMediaParticipant,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_media_participant_sql())
            .bind(numeric_id)
            .bind(&participant.id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&participant.session_id)
            .bind(parse_i64_field("user_id", &participant.user_id)?)
            .bind(&participant.display_name)
            .bind(participant_role_to_i32(&participant.role))
            .bind(participant_state_to_i32(&participant.state))
            .bind(participant.audio_muted)
            .bind(participant.video_muted)
            .bind(participant.screen_share_active)
            .bind(&participant.provider_participant_id)
            .bind(&participant.joined_at)
            .bind(&participant.left_at)
            .bind(option_u64_to_i64(participant.duration_ms))
            .bind(&participant.leave_reason)
            .bind(&participant.last_seen_at)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_track(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        track: &RtcMediaTrack,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_track_with(
            &self.pool,
            numeric_id,
            tenant_id,
            organization_id,
            track,
            updated_at,
        )
        .await
    }

    pub async fn upsert_media_track_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        track: &RtcMediaTrack,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_media_track_sql())
            .bind(numeric_id)
            .bind(&track.id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&track.session_id)
            .bind(&track.participant_id)
            .bind(track_kind_to_i32(&track.track_kind))
            .bind(track_source_to_i32(&track.track_source))
            .bind(&track.provider_track_id)
            .bind(track_status_to_i32(&track.status))
            .bind(&track.started_at)
            .bind(&track.ended_at)
            .bind(option_u64_to_i64(track.duration_ms))
            .bind(option_u64_to_i64(track.muted_duration_ms))
            .bind(&track.end_reason)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn upsert_media_artifact(
        &self,
        numeric_id: i64,
        organization_id: &str,
        artifact: &RtcMediaArtifact,
        updated_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_media_artifact_with(
            &self.pool,
            numeric_id,
            organization_id,
            artifact,
            updated_at,
        )
        .await
    }

    pub async fn upsert_media_artifact_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        organization_id: &str,
        artifact: &RtcMediaArtifact,
        updated_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        validate_rtc_media_artifact_drive_snapshot(artifact)?;
        let media_resource_snapshot = serialize_json(&artifact.resource)?;
        let resource_hash = artifact
            .resource_hash
            .clone()
            .unwrap_or_else(|| rtc_provider_payload_hash(&media_resource_snapshot));

        sqlx::query(postgres_upsert_media_artifact_sql())
            .bind(numeric_id)
            .bind(&artifact.id)
            .bind(parse_i64_field("tenant_id", &artifact.tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&artifact.rtc_session_id)
            .bind(parse_i64_field("owner_user_id", &artifact.owner_user_id)?)
            .bind(recording_artifact_kind_to_i32(&artifact.artifact_kind))
            .bind(recording_artifact_status_to_i32(&artifact.artifact_status))
            .bind(&artifact.media_role)
            .bind(&artifact.provider_profile_id)
            .bind(&artifact.provider_artifact_id)
            .bind(&artifact.drive.space_id)
            .bind(artifact.drive.space_type.as_str())
            .bind(&artifact.drive.node_id)
            .bind(&artifact.drive.drive_uri)
            .bind(media_resource_snapshot)
            .bind(resource_hash)
            .bind(&artifact.started_at)
            .bind(&artifact.ended_at)
            .bind(option_u64_to_i64(artifact.duration_ms))
            .bind(&artifact.failure_reason)
            .bind(&artifact.source_provider_webhook_event_id)
            .bind(&artifact.source_provider_query_job_id)
            .bind(updated_at)
            .bind(updated_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn insert_quality_sample(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        sample: &RtcQualitySample,
    ) -> RtcStorageResult<()> {
        self.insert_quality_sample_with(&self.pool, numeric_id, tenant_id, organization_id, sample)
            .await
    }

    pub async fn insert_quality_sample_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        sample: &RtcQualitySample,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_quality_sample_sql())
            .bind(numeric_id)
            .bind(&sample.id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&sample.session_id)
            .bind(&sample.participant_id)
            .bind(sample.latency_ms.map(u32_to_i32))
            .bind(&sample.packet_loss_rate)
            .bind(sample.jitter_ms.map(u32_to_i32))
            .bind(sample.bitrate_kbps.map(u32_to_i32))
            .bind(&sample.sampled_at)
            .bind(&sample.sampled_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn get_completion_input_by_session_id(
        &self,
        media_session_id: &str,
        recorded_at: &str,
    ) -> RtcStorageResult<Option<RtcMediaSessionCompletionInput>> {
        let sql = postgres_media_session_select_sql("WHERE uuid = $1", "");
        let session_row = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_optional(&self.pool)
            .await?;
        let Some(session_row) = session_row else {
            return Ok(None);
        };

        let participants = self.list_media_participants(media_session_id).await?;
        let mut session = postgres_row_to_media_session(session_row, participants)?;
        let tracks = self.list_media_tracks(media_session_id).await?;
        let artifacts = self.list_media_artifacts(media_session_id).await?;
        let quality_samples = self.list_quality_samples(media_session_id).await?;

        session.participant_count = session
            .participant_count
            .max(session.participants.len() as u32);
        session.max_concurrent_participants = session
            .max_concurrent_participants
            .max(session.participant_count);

        Ok(Some(RtcMediaSessionCompletionInput {
            source_webhook_event_id: session.last_provider_webhook_event_id.clone(),
            source_provider_query_job_id: session.last_provider_query_job_id.clone(),
            session,
            tracks,
            artifacts,
            quality_samples,
            recorded_at: recorded_at.to_string(),
        }))
    }

    async fn list_media_participants(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaParticipant>> {
        let sql = postgres_media_participant_select_sql(
            "WHERE session_id = $1",
            "ORDER BY joined_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_media_participant)
            .collect()
    }

    pub async fn list_media_tracks(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaTrack>> {
        let sql = postgres_media_track_select_sql(
            "WHERE session_id = $1",
            "ORDER BY started_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter().map(postgres_row_to_media_track).collect()
    }

    async fn list_media_artifacts(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaArtifact>> {
        let sql = postgres_media_artifact_select_sql(
            "WHERE session_id = $1",
            "ORDER BY started_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_media_artifact)
            .collect()
    }

    async fn list_quality_samples(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Vec<RtcQualitySample>> {
        let sql = postgres_quality_sample_select_sql(
            "WHERE session_id = $1",
            "ORDER BY sampled_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(media_session_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_quality_sample)
            .collect()
    }

    pub async fn list_media_sessions_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaSession>> {
        let sql = postgres_media_session_select_sql(
            "WHERE tenant_id = $1 AND organization_id = $2",
            "ORDER BY started_at ASC, id ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;
        let mut sessions = Vec::with_capacity(rows.len());
        for row in rows {
            let session_id: String = row.try_get("uuid")?;
            let participants = self.list_media_participants(session_id.as_str()).await?;
            sessions.push(postgres_row_to_media_session(row, participants)?);
        }
        Ok(sessions)
    }

    pub async fn list_active_reconcile_scopes(
        &self,
    ) -> RtcStorageResult<Vec<RtcTenantOrganizationScope>> {
        const SQL: &str = r#"
            SELECT DISTINCT tenant_id, organization_id
            FROM rtc_media_session
            WHERE status IN (1, 2, 3, 5)
              AND deleted_at IS NULL
            ORDER BY tenant_id ASC, organization_id ASC
        "#;
        let rows = sqlx::query(SQL).fetch_all(&self.pool).await?;
        rows.into_iter()
            .map(|row| {
                Ok(RtcTenantOrganizationScope {
                    tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
                    organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
                })
            })
            .collect()
    }

    pub async fn list_recording_artifact_lifecycle_candidates(
        &self,
        query: RtcRecordingLifecycleReconcileQuery,
    ) -> RtcStorageResult<Vec<RtcMediaArtifact>> {
        const SQL: &str = r#"
            SELECT
                uuid,
                tenant_id,
                session_id,
                owner_user_id,
                artifact_kind,
                artifact_status,
                media_role,
                provider_profile_id,
                provider_artifact_id,
                drive_space_id,
                drive_space_type,
                drive_node_id,
                drive_uri,
                media_resource_snapshot,
                resource_hash,
                to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS started_at,
                to_char(ended_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS ended_at,
                duration_ms,
                failure_reason,
                source_provider_webhook_event_id,
                source_provider_query_job_id
            FROM rtc_media_artifact
            WHERE (
                artifact_status IN (3, 4)
                AND COALESCE(ended_at, started_at, created_at) <= $1::timestamptz
            ) OR (
                artifact_status = 5
                AND COALESCE(ended_at, started_at, created_at) <= $2::timestamptz
            )
            ORDER BY created_at ASC
            LIMIT $3
        "#;
        let rows = sqlx::query(SQL)
            .bind(query.soft_delete_cutoff.as_str())
            .bind(query.hard_delete_cutoff.as_str())
            .bind(i64::from(query.batch_size))
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter()
            .map(postgres_row_to_media_artifact)
            .collect()
    }

    pub async fn get_media_session_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        media_session_id: &str,
    ) -> RtcStorageResult<Option<RtcMediaSession>> {
        let sql = postgres_media_session_select_sql(
            "WHERE uuid = $1 AND tenant_id = $2 AND organization_id = $3",
            "",
        );
        let row = sqlx::query(&sql)
            .bind(media_session_id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_optional(&self.pool)
            .await?;
        let Some(row) = row else {
            return Ok(None);
        };
        let participants = self.list_media_participants(media_session_id).await?;
        Ok(Some(postgres_row_to_media_session(row, participants)?))
    }
}

fn sqlite_upsert_room_sql() -> &'static str {
    r#"
    INSERT INTO rtc_room (
        id, uuid, tenant_id, organization_id, owner_user_id, title, status,
        created_at, updated_at, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        owner_user_id = excluded.owner_user_id,
        title = excluded.title,
        status = excluded.status,
        updated_at = excluded.updated_at,
        version = rtc_room.version + 1
    "#
}

fn postgres_upsert_room_sql() -> &'static str {
    r#"
    INSERT INTO rtc_room (
        id, uuid, tenant_id, organization_id, owner_user_id, title, status,
        created_at, updated_at, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text::timestamp, $9::text::timestamp, 0)
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        owner_user_id = excluded.owner_user_id,
        title = excluded.title,
        status = excluded.status,
        updated_at = excluded.updated_at,
        version = rtc_room.version + 1
    "#
}

fn sqlite_upsert_media_session_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_session (
        id, uuid, tenant_id, organization_id, room_id, owner_user_id,
        media_mode, status, provider_profile_id, provider_session_id,
        started_at, connected_at, ended_at, duration_ms, end_reason, end_source,
        participant_count, max_concurrent_participants, quality_summary_snapshot,
        recording_summary_snapshot, completion_recorded_at, last_provider_webhook_event_id,
        last_provider_query_job_id, created_at, updated_at, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        room_id = excluded.room_id,
        owner_user_id = excluded.owner_user_id,
        media_mode = excluded.media_mode,
        status = excluded.status,
        provider_profile_id = excluded.provider_profile_id,
        provider_session_id = excluded.provider_session_id,
        started_at = excluded.started_at,
        connected_at = excluded.connected_at,
        ended_at = excluded.ended_at,
        duration_ms = excluded.duration_ms,
        end_reason = excluded.end_reason,
        end_source = excluded.end_source,
        participant_count = excluded.participant_count,
        max_concurrent_participants = excluded.max_concurrent_participants,
        quality_summary_snapshot = excluded.quality_summary_snapshot,
        recording_summary_snapshot = excluded.recording_summary_snapshot,
        completion_recorded_at = excluded.completion_recorded_at,
        last_provider_webhook_event_id = excluded.last_provider_webhook_event_id,
        last_provider_query_job_id = excluded.last_provider_query_job_id,
        updated_at = excluded.updated_at,
        version = rtc_media_session.version + 1
    "#
}

fn postgres_upsert_media_session_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_session (
        id, uuid, tenant_id, organization_id, room_id, owner_user_id,
        media_mode, status, provider_profile_id, provider_session_id,
        started_at, connected_at, ended_at, duration_ms, end_reason, end_source,
        participant_count, max_concurrent_participants, quality_summary_snapshot,
        recording_summary_snapshot, completion_recorded_at, last_provider_webhook_event_id,
        last_provider_query_job_id, created_at, updated_at, version
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        NULLIF($11::text, '')::timestamp,
        NULLIF($12::text, '')::timestamp,
        NULLIF($13::text, '')::timestamp,
        $14, $15, $16, $17, $18,
        CASE WHEN $19::text IS NULL THEN NULL ELSE $19::text::jsonb END,
        CASE WHEN $20::text IS NULL THEN NULL ELSE $20::text::jsonb END,
        NULLIF($21::text, '')::timestamp,
        $22, $23,
        $24::text::timestamp,
        $25::text::timestamp,
        0
    )
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        room_id = excluded.room_id,
        owner_user_id = excluded.owner_user_id,
        media_mode = excluded.media_mode,
        status = excluded.status,
        provider_profile_id = excluded.provider_profile_id,
        provider_session_id = excluded.provider_session_id,
        started_at = excluded.started_at,
        connected_at = excluded.connected_at,
        ended_at = excluded.ended_at,
        duration_ms = excluded.duration_ms,
        end_reason = excluded.end_reason,
        end_source = excluded.end_source,
        participant_count = excluded.participant_count,
        max_concurrent_participants = excluded.max_concurrent_participants,
        quality_summary_snapshot = excluded.quality_summary_snapshot,
        recording_summary_snapshot = excluded.recording_summary_snapshot,
        completion_recorded_at = excluded.completion_recorded_at,
        last_provider_webhook_event_id = excluded.last_provider_webhook_event_id,
        last_provider_query_job_id = excluded.last_provider_query_job_id,
        updated_at = excluded.updated_at,
        version = rtc_media_session.version + 1
    "#
}

fn sqlite_upsert_media_participant_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_participant (
        id, uuid, tenant_id, organization_id, session_id, user_id,
        display_name_snapshot, role, state, audio_muted, video_muted,
        screen_share_active, provider_participant_id, joined_at, left_at,
        duration_ms, leave_reason, last_seen_at, created_at, updated_at, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(session_id, user_id) DO UPDATE SET
        uuid = excluded.uuid,
        display_name_snapshot = excluded.display_name_snapshot,
        role = excluded.role,
        state = excluded.state,
        audio_muted = excluded.audio_muted,
        video_muted = excluded.video_muted,
        screen_share_active = excluded.screen_share_active,
        provider_participant_id = excluded.provider_participant_id,
        joined_at = excluded.joined_at,
        left_at = excluded.left_at,
        duration_ms = excluded.duration_ms,
        leave_reason = excluded.leave_reason,
        last_seen_at = excluded.last_seen_at,
        updated_at = excluded.updated_at,
        version = rtc_media_participant.version + 1
    "#
}

fn postgres_upsert_media_participant_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_participant (
        id, uuid, tenant_id, organization_id, session_id, user_id,
        display_name_snapshot, role, state, audio_muted, video_muted,
        screen_share_active, provider_participant_id, joined_at, left_at,
        duration_ms, leave_reason, last_seen_at, created_at, updated_at, version
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        NULLIF($14::text, '')::timestamp,
        NULLIF($15::text, '')::timestamp,
        $16, $17,
        NULLIF($18::text, '')::timestamp,
        $19::text::timestamp,
        $20::text::timestamp,
        0
    )
    ON CONFLICT(session_id, user_id) DO UPDATE SET
        uuid = excluded.uuid,
        display_name_snapshot = excluded.display_name_snapshot,
        role = excluded.role,
        state = excluded.state,
        audio_muted = excluded.audio_muted,
        video_muted = excluded.video_muted,
        screen_share_active = excluded.screen_share_active,
        provider_participant_id = excluded.provider_participant_id,
        joined_at = excluded.joined_at,
        left_at = excluded.left_at,
        duration_ms = excluded.duration_ms,
        leave_reason = excluded.leave_reason,
        last_seen_at = excluded.last_seen_at,
        updated_at = excluded.updated_at,
        version = rtc_media_participant.version + 1
    "#
}

fn sqlite_upsert_media_track_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_track (
        id, uuid, tenant_id, organization_id, session_id, participant_id,
        track_kind, track_source, provider_track_id, status, started_at,
        ended_at, duration_ms, muted_duration_ms, end_reason, created_at,
        updated_at, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        session_id = excluded.session_id,
        participant_id = excluded.participant_id,
        track_kind = excluded.track_kind,
        track_source = excluded.track_source,
        provider_track_id = excluded.provider_track_id,
        status = excluded.status,
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        duration_ms = excluded.duration_ms,
        muted_duration_ms = excluded.muted_duration_ms,
        end_reason = excluded.end_reason,
        updated_at = excluded.updated_at,
        version = rtc_media_track.version + 1
    "#
}

fn postgres_upsert_media_track_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_track (
        id, uuid, tenant_id, organization_id, session_id, participant_id,
        track_kind, track_source, provider_track_id, status, started_at,
        ended_at, duration_ms, muted_duration_ms, end_reason, created_at,
        updated_at, version
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        NULLIF($11::text, '')::timestamp,
        NULLIF($12::text, '')::timestamp,
        $13, $14, $15,
        $16::text::timestamp,
        $17::text::timestamp,
        0
    )
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        session_id = excluded.session_id,
        participant_id = excluded.participant_id,
        track_kind = excluded.track_kind,
        track_source = excluded.track_source,
        provider_track_id = excluded.provider_track_id,
        status = excluded.status,
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        duration_ms = excluded.duration_ms,
        muted_duration_ms = excluded.muted_duration_ms,
        end_reason = excluded.end_reason,
        updated_at = excluded.updated_at,
        version = rtc_media_track.version + 1
    "#
}

fn sqlite_upsert_media_artifact_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_artifact (
        id, uuid, tenant_id, organization_id, session_id, owner_user_id,
        artifact_kind, artifact_status, media_role, provider_profile_id,
        provider_artifact_id, drive_space_id, drive_space_type, drive_node_id, drive_uri,
        media_resource_snapshot, resource_hash, started_at, ended_at,
        duration_ms, failure_reason, source_provider_webhook_event_id,
        source_provider_query_job_id, created_at, updated_at, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        session_id = excluded.session_id,
        owner_user_id = excluded.owner_user_id,
        artifact_kind = excluded.artifact_kind,
        artifact_status = excluded.artifact_status,
        media_role = excluded.media_role,
        provider_profile_id = excluded.provider_profile_id,
        provider_artifact_id = excluded.provider_artifact_id,
        drive_space_id = excluded.drive_space_id,
        drive_space_type = excluded.drive_space_type,
        drive_node_id = excluded.drive_node_id,
        drive_uri = excluded.drive_uri,
        media_resource_snapshot = excluded.media_resource_snapshot,
        resource_hash = excluded.resource_hash,
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        duration_ms = excluded.duration_ms,
        failure_reason = excluded.failure_reason,
        source_provider_webhook_event_id = excluded.source_provider_webhook_event_id,
        source_provider_query_job_id = excluded.source_provider_query_job_id,
        updated_at = excluded.updated_at,
        version = rtc_media_artifact.version + 1
    "#
}

fn postgres_upsert_media_artifact_sql() -> &'static str {
    r#"
    INSERT INTO rtc_media_artifact (
        id, uuid, tenant_id, organization_id, session_id, owner_user_id,
        artifact_kind, artifact_status, media_role, provider_profile_id,
        provider_artifact_id, drive_space_id, drive_space_type, drive_node_id, drive_uri,
        media_resource_snapshot, resource_hash, started_at, ended_at,
        duration_ms, failure_reason, source_provider_webhook_event_id,
        source_provider_query_job_id, created_at, updated_at, version
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16::text::jsonb, $17,
        NULLIF($18::text, '')::timestamp,
        NULLIF($19::text, '')::timestamp,
        $20, $21, $22, $23,
        $24::text::timestamp,
        $25::text::timestamp,
        0
    )
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        session_id = excluded.session_id,
        owner_user_id = excluded.owner_user_id,
        artifact_kind = excluded.artifact_kind,
        artifact_status = excluded.artifact_status,
        media_role = excluded.media_role,
        provider_profile_id = excluded.provider_profile_id,
        provider_artifact_id = excluded.provider_artifact_id,
        drive_space_id = excluded.drive_space_id,
        drive_space_type = excluded.drive_space_type,
        drive_node_id = excluded.drive_node_id,
        drive_uri = excluded.drive_uri,
        media_resource_snapshot = excluded.media_resource_snapshot,
        resource_hash = excluded.resource_hash,
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        duration_ms = excluded.duration_ms,
        failure_reason = excluded.failure_reason,
        source_provider_webhook_event_id = excluded.source_provider_webhook_event_id,
        source_provider_query_job_id = excluded.source_provider_query_job_id,
        updated_at = excluded.updated_at,
        version = rtc_media_artifact.version + 1
    "#
}

fn sqlite_upsert_quality_sample_sql() -> &'static str {
    r#"
    INSERT INTO rtc_quality_sample (
        id, uuid, tenant_id, organization_id, session_id, participant_id,
        latency_ms, packet_loss_rate, jitter_ms, bitrate_kbps, sampled_at, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uuid) DO UPDATE SET
        participant_id = excluded.participant_id,
        latency_ms = excluded.latency_ms,
        packet_loss_rate = excluded.packet_loss_rate,
        jitter_ms = excluded.jitter_ms,
        bitrate_kbps = excluded.bitrate_kbps,
        sampled_at = excluded.sampled_at
    "#
}

fn postgres_upsert_quality_sample_sql() -> &'static str {
    r#"
    INSERT INTO rtc_quality_sample (
        id, uuid, tenant_id, organization_id, session_id, participant_id,
        latency_ms, packet_loss_rate, jitter_ms, bitrate_kbps, sampled_at, created_at
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        CASE WHEN $8::text IS NULL THEN NULL ELSE $8::text::numeric END,
        $9, $10, $11::text::timestamp, $12::text::timestamp
    )
    ON CONFLICT(uuid) DO UPDATE SET
        participant_id = excluded.participant_id,
        latency_ms = excluded.latency_ms,
        packet_loss_rate = excluded.packet_loss_rate,
        jitter_ms = excluded.jitter_ms,
        bitrate_kbps = excluded.bitrate_kbps,
        sampled_at = excluded.sampled_at
    "#
}

fn sqlite_media_session_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid, tenant_id, organization_id, room_id, owner_user_id, media_mode,
            status, provider_profile_id, provider_session_id, started_at, connected_at,
            ended_at, duration_ms, end_reason, end_source, participant_count,
            max_concurrent_participants, quality_summary_snapshot,
            recording_summary_snapshot, completion_recorded_at,
            last_provider_webhook_event_id, last_provider_query_job_id
        FROM rtc_media_session
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_media_session_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            room_id,
            owner_user_id,
            media_mode,
            status,
            provider_profile_id,
            provider_session_id,
            to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS started_at,
            to_char(connected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS connected_at,
            to_char(ended_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS ended_at,
            duration_ms,
            end_reason,
            end_source,
            participant_count,
            max_concurrent_participants,
            quality_summary_snapshot,
            recording_summary_snapshot,
            to_char(completion_recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS completion_recorded_at,
            last_provider_webhook_event_id,
            last_provider_query_job_id
        FROM rtc_media_session
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_media_participant_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid, session_id, user_id, display_name_snapshot, role, state,
            audio_muted, video_muted, screen_share_active, provider_participant_id,
            joined_at, left_at, duration_ms, leave_reason, last_seen_at
        FROM rtc_media_participant
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_media_participant_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            session_id,
            user_id,
            display_name_snapshot,
            role,
            state,
            audio_muted,
            video_muted,
            screen_share_active,
            provider_participant_id,
            to_char(joined_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS joined_at,
            to_char(left_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS left_at,
            duration_ms,
            leave_reason,
            to_char(last_seen_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_seen_at
        FROM rtc_media_participant
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_media_track_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid, session_id, participant_id, track_kind, track_source,
            provider_track_id, status, started_at, ended_at, duration_ms,
            muted_duration_ms, end_reason
        FROM rtc_media_track
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_media_track_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            session_id,
            participant_id,
            track_kind,
            track_source,
            provider_track_id,
            status,
            to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS started_at,
            to_char(ended_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS ended_at,
            duration_ms,
            muted_duration_ms,
            end_reason
        FROM rtc_media_track
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_media_artifact_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid, tenant_id, session_id, owner_user_id, artifact_kind,
            artifact_status, media_role, provider_profile_id, provider_artifact_id,
            drive_space_id, drive_space_type, drive_node_id, drive_uri, media_resource_snapshot,
            resource_hash, started_at, ended_at, duration_ms, failure_reason,
            source_provider_webhook_event_id, source_provider_query_job_id
        FROM rtc_media_artifact
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_media_artifact_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            session_id,
            owner_user_id,
            artifact_kind,
            artifact_status,
            media_role,
            provider_profile_id,
            provider_artifact_id,
            drive_space_id,
            drive_space_type,
            drive_node_id,
            drive_uri,
            media_resource_snapshot,
            resource_hash,
            to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS started_at,
            to_char(ended_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS ended_at,
            duration_ms,
            failure_reason,
            source_provider_webhook_event_id,
            source_provider_query_job_id
        FROM rtc_media_artifact
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_quality_sample_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid, session_id, participant_id, latency_ms,
            CASE
                WHEN packet_loss_rate IS NULL THEN NULL
                ELSE printf('%.6f', packet_loss_rate)
            END AS packet_loss_rate,
            jitter_ms, bitrate_kbps, sampled_at
        FROM rtc_quality_sample
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_quality_sample_select_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            session_id,
            participant_id,
            latency_ms,
            packet_loss_rate::text AS packet_loss_rate,
            jitter_ms,
            bitrate_kbps,
            to_char(sampled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS sampled_at
        FROM rtc_quality_sample
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_row_to_media_session(
    row: SqliteRow,
    participants: Vec<RtcMediaParticipant>,
) -> RtcStorageResult<RtcMediaSession> {
    let media_mode: i32 = row.try_get("media_mode")?;
    let status: i32 = row.try_get("status")?;
    let end_source: Option<String> = row.try_get("end_source")?;
    let quality_summary: Option<String> = row.try_get("quality_summary_snapshot")?;
    let recording_summary: Option<String> = row.try_get("recording_summary_snapshot")?;

    Ok(RtcMediaSession {
        id: row.try_get("uuid")?,
        room_id: row.try_get("room_id")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        owner_user_id: sqlite_i64_column_to_string(&row, "owner_user_id")?,
        media_mode: i32_to_media_mode(media_mode)?,
        status: i32_to_media_session_status(status)?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        started_at: row.try_get("started_at")?,
        connected_at: row.try_get("connected_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        end_reason: row.try_get("end_reason")?,
        end_source: end_source.as_deref().map(str_to_end_source).transpose()?,
        participant_count: i64_column_to_u32(&row, "participant_count")?,
        max_concurrent_participants: i64_column_to_u32(&row, "max_concurrent_participants")?,
        quality_summary: quality_summary.map(deserialize_json_text).transpose()?,
        recording_summary: recording_summary.map(deserialize_json_text).transpose()?,
        completion_recorded_at: row.try_get("completion_recorded_at")?,
        last_provider_webhook_event_id: row.try_get("last_provider_webhook_event_id")?,
        last_provider_query_job_id: row.try_get("last_provider_query_job_id")?,
        participants,
    })
}

fn postgres_row_to_media_session(
    row: PgRow,
    participants: Vec<RtcMediaParticipant>,
) -> RtcStorageResult<RtcMediaSession> {
    let media_mode: i32 = row.try_get("media_mode")?;
    let status: i32 = row.try_get("status")?;
    let end_source: Option<String> = row.try_get("end_source")?;
    let quality_summary: Option<sqlx::types::Json<RtcMediaSessionCompletionQualitySummary>> =
        row.try_get("quality_summary_snapshot")?;
    let recording_summary: Option<sqlx::types::Json<RtcMediaSessionCompletionRecordingSummary>> =
        row.try_get("recording_summary_snapshot")?;

    Ok(RtcMediaSession {
        id: row.try_get("uuid")?,
        room_id: row.try_get("room_id")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        owner_user_id: postgres_i64_column_to_string(&row, "owner_user_id")?,
        media_mode: i32_to_media_mode(media_mode)?,
        status: i32_to_media_session_status(status)?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        started_at: row.try_get("started_at")?,
        connected_at: row.try_get("connected_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        end_reason: row.try_get("end_reason")?,
        end_source: end_source.as_deref().map(str_to_end_source).transpose()?,
        participant_count: i32_column_to_u32(&row, "participant_count")?,
        max_concurrent_participants: i32_column_to_u32(&row, "max_concurrent_participants")?,
        quality_summary: quality_summary.map(|summary| summary.0),
        recording_summary: recording_summary.map(|summary| summary.0),
        completion_recorded_at: row.try_get("completion_recorded_at")?,
        last_provider_webhook_event_id: row.try_get("last_provider_webhook_event_id")?,
        last_provider_query_job_id: row.try_get("last_provider_query_job_id")?,
        participants,
    })
}

fn sqlite_row_to_media_participant(row: SqliteRow) -> RtcStorageResult<RtcMediaParticipant> {
    let role: i32 = row.try_get("role")?;
    let state: i32 = row.try_get("state")?;
    let audio_muted: i64 = row.try_get("audio_muted")?;
    let video_muted: i64 = row.try_get("video_muted")?;
    let screen_share_active: i64 = row.try_get("screen_share_active")?;

    Ok(RtcMediaParticipant {
        id: row.try_get("uuid")?,
        session_id: row.try_get("session_id")?,
        user_id: sqlite_i64_column_to_string(&row, "user_id")?,
        display_name: row.try_get("display_name_snapshot")?,
        role: i32_to_participant_role(role)?,
        state: i32_to_participant_state(state)?,
        audio_muted: audio_muted != 0,
        video_muted: video_muted != 0,
        screen_share_active: screen_share_active != 0,
        provider_participant_id: row.try_get("provider_participant_id")?,
        joined_at: row.try_get("joined_at")?,
        left_at: row.try_get("left_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        leave_reason: row.try_get("leave_reason")?,
        last_seen_at: row.try_get("last_seen_at")?,
    })
}

fn postgres_row_to_media_participant(row: PgRow) -> RtcStorageResult<RtcMediaParticipant> {
    let role: i32 = row.try_get("role")?;
    let state: i32 = row.try_get("state")?;

    Ok(RtcMediaParticipant {
        id: row.try_get("uuid")?,
        session_id: row.try_get("session_id")?,
        user_id: postgres_i64_column_to_string(&row, "user_id")?,
        display_name: row.try_get("display_name_snapshot")?,
        role: i32_to_participant_role(role)?,
        state: i32_to_participant_state(state)?,
        audio_muted: row.try_get("audio_muted")?,
        video_muted: row.try_get("video_muted")?,
        screen_share_active: row.try_get("screen_share_active")?,
        provider_participant_id: row.try_get("provider_participant_id")?,
        joined_at: row.try_get("joined_at")?,
        left_at: row.try_get("left_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        leave_reason: row.try_get("leave_reason")?,
        last_seen_at: row.try_get("last_seen_at")?,
    })
}

fn sqlite_row_to_media_track(row: SqliteRow) -> RtcStorageResult<RtcMediaTrack> {
    Ok(RtcMediaTrack {
        id: row.try_get("uuid")?,
        session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        track_kind: i32_to_track_kind(row.try_get("track_kind")?)?,
        track_source: i32_to_track_source(row.try_get("track_source")?)?,
        provider_track_id: row.try_get("provider_track_id")?,
        status: i32_to_track_status(row.try_get("status")?)?,
        started_at: row.try_get("started_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        muted_duration_ms: option_i64_to_u64(row.try_get("muted_duration_ms")?),
        end_reason: row.try_get("end_reason")?,
    })
}

fn postgres_row_to_media_track(row: PgRow) -> RtcStorageResult<RtcMediaTrack> {
    Ok(RtcMediaTrack {
        id: row.try_get("uuid")?,
        session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        track_kind: i32_to_track_kind(row.try_get("track_kind")?)?,
        track_source: i32_to_track_source(row.try_get("track_source")?)?,
        provider_track_id: row.try_get("provider_track_id")?,
        status: i32_to_track_status(row.try_get("status")?)?,
        started_at: row.try_get("started_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        muted_duration_ms: option_i64_to_u64(row.try_get("muted_duration_ms")?),
        end_reason: row.try_get("end_reason")?,
    })
}

fn sqlite_row_to_media_artifact(row: SqliteRow) -> RtcStorageResult<RtcMediaArtifact> {
    Ok(RtcMediaArtifact {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        rtc_session_id: row.try_get("session_id")?,
        owner_user_id: sqlite_i64_column_to_string(&row, "owner_user_id")?,
        artifact_kind: i32_to_recording_artifact_kind(row.try_get("artifact_kind")?)?,
        artifact_status: i32_to_recording_artifact_status(row.try_get("artifact_status")?)?,
        media_role: row.try_get("media_role")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        provider_artifact_id: row.try_get("provider_artifact_id")?,
        drive: RtcDriveReference {
            drive_uri: row.try_get("drive_uri")?,
            space_id: row.try_get("drive_space_id")?,
            space_type: str_to_drive_space_type(row.try_get("drive_space_type")?)?,
            node_id: row.try_get("drive_node_id")?,
            node_version: None,
        },
        resource: deserialize_json_text(row.try_get("media_resource_snapshot")?)?,
        resource_hash: row.try_get("resource_hash")?,
        started_at: row.try_get("started_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        failure_reason: row.try_get("failure_reason")?,
        source_provider_webhook_event_id: row.try_get("source_provider_webhook_event_id")?,
        source_provider_query_job_id: row.try_get("source_provider_query_job_id")?,
    })
}

fn postgres_row_to_media_artifact(row: PgRow) -> RtcStorageResult<RtcMediaArtifact> {
    let resource: sqlx::types::Json<RtcMediaResource> = row.try_get("media_resource_snapshot")?;

    Ok(RtcMediaArtifact {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        rtc_session_id: row.try_get("session_id")?,
        owner_user_id: postgres_i64_column_to_string(&row, "owner_user_id")?,
        artifact_kind: i32_to_recording_artifact_kind(row.try_get("artifact_kind")?)?,
        artifact_status: i32_to_recording_artifact_status(row.try_get("artifact_status")?)?,
        media_role: row.try_get("media_role")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        provider_artifact_id: row.try_get("provider_artifact_id")?,
        drive: RtcDriveReference {
            drive_uri: row.try_get("drive_uri")?,
            space_id: row.try_get("drive_space_id")?,
            space_type: str_to_drive_space_type(row.try_get("drive_space_type")?)?,
            node_id: row.try_get("drive_node_id")?,
            node_version: None,
        },
        resource: resource.0,
        resource_hash: row.try_get("resource_hash")?,
        started_at: row.try_get("started_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(row.try_get("duration_ms")?),
        failure_reason: row.try_get("failure_reason")?,
        source_provider_webhook_event_id: row.try_get("source_provider_webhook_event_id")?,
        source_provider_query_job_id: row.try_get("source_provider_query_job_id")?,
    })
}

fn sqlite_row_to_quality_sample(row: SqliteRow) -> RtcStorageResult<RtcQualitySample> {
    Ok(RtcQualitySample {
        id: row.try_get("uuid")?,
        session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        latency_ms: optional_i64_column_to_u32(&row, "latency_ms")?,
        packet_loss_rate: row.try_get("packet_loss_rate")?,
        jitter_ms: optional_i64_column_to_u32(&row, "jitter_ms")?,
        bitrate_kbps: optional_i64_column_to_u32(&row, "bitrate_kbps")?,
        sampled_at: row.try_get("sampled_at")?,
    })
}

fn postgres_row_to_quality_sample(row: PgRow) -> RtcStorageResult<RtcQualitySample> {
    Ok(RtcQualitySample {
        id: row.try_get("uuid")?,
        session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        latency_ms: optional_i32_column_to_u32(&row, "latency_ms")?,
        packet_loss_rate: row.try_get("packet_loss_rate")?,
        jitter_ms: optional_i32_column_to_u32(&row, "jitter_ms")?,
        bitrate_kbps: optional_i32_column_to_u32(&row, "bitrate_kbps")?,
        sampled_at: row.try_get("sampled_at")?,
    })
}

fn serialize_json<T>(value: &T) -> RtcStorageResult<String>
where
    T: serde::Serialize,
{
    Ok(serde_json::to_string(value)?)
}

fn serialize_optional_json<T>(value: &Option<T>) -> RtcStorageResult<Option<String>>
where
    T: serde::Serialize,
{
    value.as_ref().map(serialize_json).transpose()
}

fn deserialize_json_text<T>(value: String) -> RtcStorageResult<T>
where
    T: DeserializeOwned,
{
    Ok(serde_json::from_str(&value)?)
}

fn validate_rtc_drive_reference(drive: &RtcDriveReference) -> RtcStorageResult<()> {
    debug_assert_eq!(drive.space_type, RtcDriveSpaceType::Rtc);
    if drive.space_type != RtcDriveSpaceType::Rtc {
        return Err(RtcStorageError::InvalidEnumValue {
            field: "drive_space_type",
            value: drive.space_type.as_str().to_string(),
        });
    }
    if !drive.is_canonical() {
        return Err(RtcStorageError::InvalidEnumValue {
            field: "drive_uri",
            value: drive.drive_uri.clone(),
        });
    }
    Ok(())
}

fn validate_rtc_media_artifact_drive_snapshot(artifact: &RtcMediaArtifact) -> RtcStorageResult<()> {
    validate_rtc_drive_reference(&artifact.drive)?;

    if artifact.resource.source != RtcMediaSource::Drive {
        return Err(RtcStorageError::InvalidEnumValue {
            field: "media_resource_source",
            value: format!("{:?}", artifact.resource.source),
        });
    }

    match artifact.resource.id.as_deref() {
        Some(resource_id) if resource_id == artifact.drive.node_id => {}
        Some(resource_id) => {
            return Err(RtcStorageError::InvalidEnumValue {
                field: "media_resource_id",
                value: resource_id.to_string(),
            });
        }
        None => {
            return Err(RtcStorageError::InvalidEnumValue {
                field: "media_resource_id",
                value: "<missing>".to_string(),
            });
        }
    }

    match artifact.resource.uri.as_deref() {
        Some(resource_uri) if resource_uri == artifact.drive.drive_uri => {}
        Some(resource_uri) => {
            return Err(RtcStorageError::InvalidEnumValue {
                field: "media_resource_uri",
                value: resource_uri.to_string(),
            });
        }
        None => {
            return Err(RtcStorageError::InvalidEnumValue {
                field: "media_resource_uri",
                value: "<missing>".to_string(),
            });
        }
    }

    let Some(metadata) = artifact.resource.metadata.as_ref() else {
        return Err(RtcStorageError::InvalidEnumValue {
            field: "media_resource_metadata.drive",
            value: "<missing>".to_string(),
        });
    };
    let Some(drive_metadata) = metadata.get("drive").and_then(|value| value.as_object()) else {
        return Err(RtcStorageError::InvalidEnumValue {
            field: "media_resource_metadata.drive",
            value: "<missing>".to_string(),
        });
    };

    validate_drive_metadata_string(
        drive_metadata.get("spaceId"),
        "media_resource_metadata.drive.space_id",
        artifact.drive.space_id.as_str(),
    )?;
    validate_drive_metadata_string(
        drive_metadata.get("spaceType"),
        "media_resource_metadata.drive.space_type",
        artifact.drive.space_type.as_str(),
    )?;
    validate_drive_metadata_string(
        drive_metadata.get("nodeId"),
        "media_resource_metadata.drive.node_id",
        artifact.drive.node_id.as_str(),
    )?;

    if let Some(node_version) = artifact.drive.node_version.as_deref() {
        validate_drive_metadata_string(
            drive_metadata.get("nodeVersion"),
            "media_resource_metadata.drive.node_version",
            node_version,
        )?;
    }

    Ok(())
}

fn validate_drive_metadata_string(
    value: Option<&serde_json::Value>,
    field: &'static str,
    expected: &str,
) -> RtcStorageResult<()> {
    match value.and_then(|inner| inner.as_str()) {
        Some(actual) if actual == expected => Ok(()),
        Some(actual) => Err(RtcStorageError::InvalidEnumValue {
            field,
            value: actual.to_string(),
        }),
        None => Err(RtcStorageError::InvalidEnumValue {
            field,
            value: "<missing>".to_string(),
        }),
    }
}

fn str_to_drive_space_type(value: String) -> RtcStorageResult<RtcDriveSpaceType> {
    match value.as_str() {
        "rtc" => Ok(RtcDriveSpaceType::Rtc),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "drive_space_type",
            value,
        }),
    }
}

fn parse_i64_field(field: &'static str, value: &str) -> RtcStorageResult<i64> {
    value
        .parse::<i64>()
        .map_err(|_| RtcStorageError::InvalidEnumValue {
            field,
            value: value.to_string(),
        })
}

fn parse_optional_f64_field(
    field: &'static str,
    value: Option<&str>,
) -> RtcStorageResult<Option<f64>> {
    value
        .map(|inner| {
            inner
                .parse::<f64>()
                .map_err(|_| RtcStorageError::InvalidEnumValue {
                    field,
                    value: inner.to_string(),
                })
        })
        .transpose()
}

fn bool_to_i64(value: bool) -> i64 {
    if value { 1 } else { 0 }
}

fn u32_to_i32(value: u32) -> i32 {
    i32::try_from(value).unwrap_or(i32::MAX)
}

fn u32_to_i64(value: u32) -> i64 {
    i64::from(value)
}

fn option_u64_to_i64(value: Option<u64>) -> Option<i64> {
    value.map(|inner| i64::try_from(inner).unwrap_or(i64::MAX))
}

fn option_i64_to_u64(value: Option<i64>) -> Option<u64> {
    value.and_then(|inner| u64::try_from(inner).ok())
}

fn sqlite_i64_column_to_string(row: &SqliteRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn postgres_i64_column_to_string(row: &PgRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn i64_column_to_u32(row: &SqliteRow, column: &'static str) -> RtcStorageResult<u32> {
    let value: i64 = row.try_get(column)?;
    Ok(u32::try_from(value).unwrap_or(u32::MAX))
}

fn i32_column_to_u32(row: &PgRow, column: &'static str) -> RtcStorageResult<u32> {
    let value: i32 = row.try_get(column)?;
    Ok(u32::try_from(value).unwrap_or(u32::MAX))
}

fn optional_i64_column_to_u32(
    row: &SqliteRow,
    column: &'static str,
) -> RtcStorageResult<Option<u32>> {
    let value: Option<i64> = row.try_get(column)?;
    Ok(value.and_then(|inner| u32::try_from(inner).ok()))
}

fn optional_i32_column_to_u32(row: &PgRow, column: &'static str) -> RtcStorageResult<Option<u32>> {
    let value: Option<i32> = row.try_get(column)?;
    Ok(value.and_then(|inner| u32::try_from(inner).ok()))
}

fn room_status_to_i32(value: &RtcRoomStatus) -> i32 {
    match value {
        RtcRoomStatus::Active => 1,
        RtcRoomStatus::Archived => 2,
        RtcRoomStatus::Disabled => 3,
    }
}

fn media_mode_to_i32(value: &RtcMediaSessionMode) -> i32 {
    match value {
        RtcMediaSessionMode::Audio => 1,
        RtcMediaSessionMode::Video => 2,
        RtcMediaSessionMode::Live => 3,
    }
}

fn i32_to_media_mode(value: i32) -> RtcStorageResult<RtcMediaSessionMode> {
    match value {
        1 => Ok(RtcMediaSessionMode::Audio),
        2 => Ok(RtcMediaSessionMode::Video),
        3 => Ok(RtcMediaSessionMode::Live),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "media_mode",
            value: value.to_string(),
        }),
    }
}

fn media_session_status_to_i32(value: &RtcMediaSessionStatus) -> i32 {
    match value {
        RtcMediaSessionStatus::Preparing => 1,
        RtcMediaSessionStatus::Active => 2,
        RtcMediaSessionStatus::Closing => 3,
        RtcMediaSessionStatus::Ended => 4,
        RtcMediaSessionStatus::Failed => 5,
    }
}

fn i32_to_media_session_status(value: i32) -> RtcStorageResult<RtcMediaSessionStatus> {
    match value {
        1 => Ok(RtcMediaSessionStatus::Preparing),
        2 => Ok(RtcMediaSessionStatus::Active),
        3 => Ok(RtcMediaSessionStatus::Closing),
        4 => Ok(RtcMediaSessionStatus::Ended),
        5 => Ok(RtcMediaSessionStatus::Failed),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "status",
            value: value.to_string(),
        }),
    }
}

fn participant_role_to_i32(value: &RtcParticipantRole) -> i32 {
    match value {
        RtcParticipantRole::Host => 1,
        RtcParticipantRole::Guest => 2,
        RtcParticipantRole::Listener => 3,
    }
}

fn i32_to_participant_role(value: i32) -> RtcStorageResult<RtcParticipantRole> {
    match value {
        1 => Ok(RtcParticipantRole::Host),
        2 => Ok(RtcParticipantRole::Guest),
        3 => Ok(RtcParticipantRole::Listener),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "role",
            value: value.to_string(),
        }),
    }
}

fn participant_state_to_i32(value: &RtcParticipantState) -> i32 {
    match value {
        RtcParticipantState::Joining => 1,
        RtcParticipantState::Joined => 2,
        RtcParticipantState::Left => 3,
        RtcParticipantState::Kicked => 4,
        RtcParticipantState::Timeout => 5,
    }
}

fn i32_to_participant_state(value: i32) -> RtcStorageResult<RtcParticipantState> {
    match value {
        1 => Ok(RtcParticipantState::Joining),
        2 => Ok(RtcParticipantState::Joined),
        3 => Ok(RtcParticipantState::Left),
        4 => Ok(RtcParticipantState::Kicked),
        5 => Ok(RtcParticipantState::Timeout),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "state",
            value: value.to_string(),
        }),
    }
}

fn track_kind_to_i32(value: &RtcMediaTrackKind) -> i32 {
    match value {
        RtcMediaTrackKind::Audio => 1,
        RtcMediaTrackKind::Video => 2,
        RtcMediaTrackKind::ScreenShare => 3,
        RtcMediaTrackKind::Data => 4,
    }
}

fn i32_to_track_kind(value: i32) -> RtcStorageResult<RtcMediaTrackKind> {
    match value {
        1 => Ok(RtcMediaTrackKind::Audio),
        2 => Ok(RtcMediaTrackKind::Video),
        3 => Ok(RtcMediaTrackKind::ScreenShare),
        4 => Ok(RtcMediaTrackKind::Data),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "track_kind",
            value: value.to_string(),
        }),
    }
}

fn track_source_to_i32(value: &RtcMediaTrackSource) -> i32 {
    match value {
        RtcMediaTrackSource::Microphone => 1,
        RtcMediaTrackSource::Camera => 2,
        RtcMediaTrackSource::Screen => 3,
        RtcMediaTrackSource::System => 4,
        RtcMediaTrackSource::Custom => 5,
    }
}

fn i32_to_track_source(value: i32) -> RtcStorageResult<RtcMediaTrackSource> {
    match value {
        1 => Ok(RtcMediaTrackSource::Microphone),
        2 => Ok(RtcMediaTrackSource::Camera),
        3 => Ok(RtcMediaTrackSource::Screen),
        4 => Ok(RtcMediaTrackSource::System),
        5 => Ok(RtcMediaTrackSource::Custom),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "track_source",
            value: value.to_string(),
        }),
    }
}

fn track_status_to_i32(value: &RtcMediaTrackStatus) -> i32 {
    match value {
        RtcMediaTrackStatus::Publishing => 1,
        RtcMediaTrackStatus::Muted => 2,
        RtcMediaTrackStatus::Stopped => 3,
        RtcMediaTrackStatus::Failed => 4,
    }
}

fn i32_to_track_status(value: i32) -> RtcStorageResult<RtcMediaTrackStatus> {
    match value {
        1 => Ok(RtcMediaTrackStatus::Publishing),
        2 => Ok(RtcMediaTrackStatus::Muted),
        3 => Ok(RtcMediaTrackStatus::Stopped),
        4 => Ok(RtcMediaTrackStatus::Failed),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "track_status",
            value: value.to_string(),
        }),
    }
}

fn recording_artifact_kind_to_i32(value: &RtcRecordingArtifactKind) -> i32 {
    match value {
        RtcRecordingArtifactKind::Recording => 1,
        RtcRecordingArtifactKind::Transcript => 2,
        RtcRecordingArtifactKind::ScreenShare => 3,
        RtcRecordingArtifactKind::Snapshot => 4,
        RtcRecordingArtifactKind::Other => 5,
    }
}

fn i32_to_recording_artifact_kind(value: i32) -> RtcStorageResult<RtcRecordingArtifactKind> {
    match value {
        1 => Ok(RtcRecordingArtifactKind::Recording),
        2 => Ok(RtcRecordingArtifactKind::Transcript),
        3 => Ok(RtcRecordingArtifactKind::ScreenShare),
        4 => Ok(RtcRecordingArtifactKind::Snapshot),
        5 => Ok(RtcRecordingArtifactKind::Other),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "artifact_kind",
            value: value.to_string(),
        }),
    }
}

fn recording_artifact_status_to_i32(value: &RtcRecordingArtifactStatus) -> i32 {
    match value {
        RtcRecordingArtifactStatus::Pending => 1,
        RtcRecordingArtifactStatus::Processing => 2,
        RtcRecordingArtifactStatus::Ready => 3,
        RtcRecordingArtifactStatus::Failed => 4,
        RtcRecordingArtifactStatus::Deleted => 5,
    }
}

fn i32_to_recording_artifact_status(value: i32) -> RtcStorageResult<RtcRecordingArtifactStatus> {
    match value {
        1 => Ok(RtcRecordingArtifactStatus::Pending),
        2 => Ok(RtcRecordingArtifactStatus::Processing),
        3 => Ok(RtcRecordingArtifactStatus::Ready),
        4 => Ok(RtcRecordingArtifactStatus::Failed),
        5 => Ok(RtcRecordingArtifactStatus::Deleted),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "artifact_status",
            value: value.to_string(),
        }),
    }
}

fn end_source_to_str(value: &RtcMediaSessionEndSource) -> &'static str {
    match value {
        RtcMediaSessionEndSource::ManualClose => "manual_close",
        RtcMediaSessionEndSource::ProviderWebhook => "provider_webhook",
        RtcMediaSessionEndSource::ActiveProviderQuery => "active_provider_query",
        RtcMediaSessionEndSource::ProviderStateSync => "provider_state_sync",
        RtcMediaSessionEndSource::Timeout => "timeout",
        RtcMediaSessionEndSource::SystemReconcile => "system_reconcile",
        RtcMediaSessionEndSource::Unknown => "unknown",
    }
}

fn str_to_end_source(value: &str) -> RtcStorageResult<RtcMediaSessionEndSource> {
    match value {
        "manual_close" => Ok(RtcMediaSessionEndSource::ManualClose),
        "provider_webhook" => Ok(RtcMediaSessionEndSource::ProviderWebhook),
        "active_provider_query" => Ok(RtcMediaSessionEndSource::ActiveProviderQuery),
        "provider_state_sync" => Ok(RtcMediaSessionEndSource::ProviderStateSync),
        "timeout" => Ok(RtcMediaSessionEndSource::Timeout),
        "system_reconcile" => Ok(RtcMediaSessionEndSource::SystemReconcile),
        "unknown" => Ok(RtcMediaSessionEndSource::Unknown),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "end_source",
            value: value.to_string(),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{RtcSqliteCompletionRecordRepository, SQLITE_SCHEMA};
    use sdkwork_communication_rtc_service::{
        RtcDriveSpaceType, RtcMediaArtifactDescriptor, RtcMediaKind,
        RtcMediaSessionCompletionRecord, RtcMediaSource, RtcRecordingArtifact,
    };
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn sqlite_repository_builds_completion_input_from_persisted_media_facts() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite should start");
        for statement in SQLITE_SCHEMA
            .split(';')
            .map(str::trim)
            .filter(|statement| !statement.is_empty())
        {
            sqlx::query(statement)
                .execute(&pool)
                .await
                .expect("rtc sqlite schema should apply");
        }

        let repository = RtcSqliteMediaSessionRepository::new(pool.clone());
        let now = "2026-06-10T00:10:05.000Z";
        repository
            .upsert_room(1, &room(), now)
            .await
            .expect("room should persist");
        repository
            .upsert_media_session(2, &session(), now)
            .await
            .expect("media session should persist");
        repository
            .upsert_media_participant(3, "100", "200", &host_participant(), now)
            .await
            .expect("host participant should persist");
        repository
            .upsert_media_participant(4, "100", "200", &guest_participant(), now)
            .await
            .expect("guest participant should persist");
        repository
            .upsert_media_track(5, "100", "200", &video_track(), now)
            .await
            .expect("media track should persist");
        repository
            .upsert_media_artifact(6, "200", &recording_artifact(), now)
            .await
            .expect("recording artifact should persist");
        let stored_drive_space_type: String =
            sqlx::query_scalar("SELECT drive_space_type FROM rtc_media_artifact WHERE uuid = ?")
                .bind("artifact-1")
                .fetch_one(&pool)
                .await
                .expect("recording artifact should persist RTC Drive space type");
        assert_eq!(stored_drive_space_type, "rtc");
        repository
            .insert_quality_sample(
                7,
                "100",
                "200",
                &quality_sample("quality-1", "0.010000", 40, 8, 900),
            )
            .await
            .expect("first quality sample should persist");
        repository
            .insert_quality_sample(
                8,
                "100",
                "200",
                &quality_sample("quality-2", "0.030000", 80, 12, 700),
            )
            .await
            .expect("second quality sample should persist");

        let input = repository
            .get_completion_input_by_session_id("session-1", now)
            .await
            .expect("completion input lookup should work")
            .expect("completion input should exist");
        assert_eq!(input.artifacts[0].drive.space_type, RtcDriveSpaceType::Rtc);
        let completion = RtcMediaSessionCompletionRecord::from_input(input);

        assert_eq!(completion.media_session_id, "session-1");
        assert_eq!(completion.participant_count, 2);
        assert_eq!(completion.participants.len(), 2);
        assert_eq!(completion.tracks.len(), 1);
        assert_eq!(completion.artifacts.len(), 1);
        assert_eq!(completion.quality_summary.sample_count, 2);
        assert_eq!(completion.quality_summary.avg_latency_ms, Some(60));
        assert_eq!(
            completion.quality_summary.max_packet_loss_rate.as_deref(),
            Some("0.030000")
        );
        assert_eq!(completion.recording_summary.drive_resource_count, 1);
        assert_eq!(
            completion.artifacts[0].drive_uri,
            "drive://spaces/space-rtc-user-1/nodes/node-recording-1"
        );
        assert_eq!(
            completion.source_webhook_event_id.as_deref(),
            Some("webhook-1")
        );

        let completion_repository = RtcSqliteCompletionRecordRepository::new(pool.clone());
        completion_repository
            .upsert_completion_record(9, &completion)
            .await
            .expect("completion record should persist from aggregate facts");
        let stored = completion_repository
            .get_completion_record_by_session_id("session-1")
            .await
            .expect("stored completion should be readable")
            .expect("stored completion should exist");

        assert_eq!(stored.participants.len(), 2);
        assert_eq!(stored.tracks.len(), 1);
        assert_eq!(stored.artifacts.len(), 1);
        assert_eq!(stored.recording_summary.drive_resource_count, 1);
        assert_eq!(stored.quality_summary.sample_count, 2);
    }

    #[tokio::test]
    async fn sqlite_repository_rejects_recording_artifact_with_mismatched_drive_resource_snapshot()
    {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite should start");
        for statement in SQLITE_SCHEMA
            .split(';')
            .map(str::trim)
            .filter(|statement| !statement.is_empty())
        {
            sqlx::query(statement)
                .execute(&pool)
                .await
                .expect("rtc sqlite schema should apply");
        }

        let repository = RtcSqliteMediaSessionRepository::new(pool);
        let mut artifact = recording_artifact();
        artifact.resource.uri =
            Some("drive://spaces/app-upload-space/nodes/node-recording-1".to_string());

        let result = repository
            .upsert_media_artifact(10, "200", &artifact, "2026-06-10T00:10:05.000Z")
            .await;

        assert!(
            matches!(
                result,
                Err(RtcStorageError::InvalidEnumValue {
                    field: "media_resource_uri",
                    ..
                })
            ),
            "recording artifact persistence must reject mismatched Drive-backed MediaResource snapshots"
        );
    }

    fn room() -> RtcRoom {
        RtcRoom {
            id: "room-1".to_string(),
            tenant_id: "100".to_string(),
            organization_id: "200".to_string(),
            owner_user_id: "300".to_string(),
            title: "Weekly RTC room".to_string(),
            status: RtcRoomStatus::Active,
        }
    }

    fn session() -> RtcMediaSession {
        RtcMediaSession {
            id: "session-1".to_string(),
            room_id: "room-1".to_string(),
            tenant_id: "100".to_string(),
            organization_id: "200".to_string(),
            owner_user_id: "300".to_string(),
            media_mode: RtcMediaSessionMode::Video,
            status: RtcMediaSessionStatus::Ended,
            provider_profile_id: Some("provider-volcengine-default".to_string()),
            provider_session_id: Some("volc-session-1".to_string()),
            started_at: Some("2026-06-10T00:00:00.000Z".to_string()),
            connected_at: Some("2026-06-10T00:00:02.000Z".to_string()),
            ended_at: Some("2026-06-10T00:10:00.000Z".to_string()),
            duration_ms: Some(600_000),
            end_reason: Some("host_closed".to_string()),
            end_source: Some(RtcMediaSessionEndSource::ProviderWebhook),
            participant_count: 0,
            max_concurrent_participants: 0,
            quality_summary: None,
            recording_summary: None,
            completion_recorded_at: None,
            last_provider_webhook_event_id: Some("webhook-1".to_string()),
            last_provider_query_job_id: Some("query-1".to_string()),
            participants: Vec::new(),
        }
    }

    fn host_participant() -> RtcMediaParticipant {
        RtcMediaParticipant {
            id: "participant-1".to_string(),
            session_id: "session-1".to_string(),
            user_id: "300".to_string(),
            display_name: "Host".to_string(),
            role: RtcParticipantRole::Host,
            state: RtcParticipantState::Left,
            audio_muted: false,
            video_muted: false,
            screen_share_active: false,
            provider_participant_id: Some("volc-user-1".to_string()),
            joined_at: Some("2026-06-10T00:00:02.000Z".to_string()),
            left_at: Some("2026-06-10T00:10:00.000Z".to_string()),
            duration_ms: Some(598_000),
            leave_reason: Some("host_closed".to_string()),
            last_seen_at: Some("2026-06-10T00:10:00.000Z".to_string()),
        }
    }

    fn guest_participant() -> RtcMediaParticipant {
        RtcMediaParticipant {
            id: "participant-2".to_string(),
            session_id: "session-1".to_string(),
            user_id: "301".to_string(),
            display_name: "Guest".to_string(),
            role: RtcParticipantRole::Guest,
            state: RtcParticipantState::Left,
            audio_muted: true,
            video_muted: false,
            screen_share_active: false,
            provider_participant_id: Some("volc-user-2".to_string()),
            joined_at: Some("2026-06-10T00:00:30.000Z".to_string()),
            left_at: Some("2026-06-10T00:09:50.000Z".to_string()),
            duration_ms: Some(560_000),
            leave_reason: Some("user_left".to_string()),
            last_seen_at: Some("2026-06-10T00:09:50.000Z".to_string()),
        }
    }

    fn video_track() -> RtcMediaTrack {
        RtcMediaTrack {
            id: "track-1".to_string(),
            session_id: "session-1".to_string(),
            participant_id: "participant-1".to_string(),
            track_kind: RtcMediaTrackKind::Video,
            track_source: RtcMediaTrackSource::Camera,
            provider_track_id: Some("volc-track-1".to_string()),
            status: RtcMediaTrackStatus::Stopped,
            started_at: Some("2026-06-10T00:00:02.000Z".to_string()),
            ended_at: Some("2026-06-10T00:10:00.000Z".to_string()),
            duration_ms: Some(598_000),
            muted_duration_ms: Some(0),
            end_reason: Some("session_ended".to_string()),
        }
    }

    fn recording_artifact() -> RtcMediaArtifact {
        let mut artifact = RtcRecordingArtifact::drive_backed_recording(
            "100",
            "session-1",
            "space-rtc-user-1",
            "node-recording-1",
            Some("1".to_string()),
        )
        .into_media_artifact(RtcMediaArtifactDescriptor {
            id: "artifact-1".to_string(),
            owner_user_id: "300".to_string(),
            artifact_kind: RtcRecordingArtifactKind::Recording,
            artifact_status: RtcRecordingArtifactStatus::Ready,
            media_role: "rtc_recording".to_string(),
            started_at: "2026-06-10T00:00:00.000Z".to_string(),
            ended_at: "2026-06-10T00:10:00.000Z".to_string(),
        });
        artifact.provider_profile_id = Some("provider-volcengine-default".to_string());
        artifact.provider_artifact_id = Some("volc-recording-1".to_string());
        artifact.duration_ms = Some(600_000);
        artifact.source_provider_webhook_event_id = Some("webhook-1".to_string());
        artifact.source_provider_query_job_id = Some("query-1".to_string());
        artifact
    }

    fn quality_sample(
        id: impl Into<String>,
        packet_loss_rate: impl Into<String>,
        latency_ms: u32,
        jitter_ms: u32,
        bitrate_kbps: u32,
    ) -> RtcQualitySample {
        RtcQualitySample {
            id: id.into(),
            session_id: "session-1".to_string(),
            participant_id: Some("participant-1".to_string()),
            latency_ms: Some(latency_ms),
            packet_loss_rate: Some(packet_loss_rate.into()),
            jitter_ms: Some(jitter_ms),
            bitrate_kbps: Some(bitrate_kbps),
            sampled_at: format!("2026-06-10T00:0{}:00.000Z", latency_ms / 40 + 4),
        }
    }

    #[test]
    fn media_session_repository_file_has_no_signaling_terms() {
        let source = include_str!("media_session.rs");
        for forbidden in [
            concat!("in", "vite"),
            concat!("ring", "ing"),
            concat!("conver", "sation"),
        ] {
            assert!(
                !source.contains(forbidden),
                "media session repository must not contain signaling term {forbidden}"
            );
        }
    }

    #[test]
    fn media_resource_mapper_keeps_drive_as_the_storage_boundary() {
        let resource = RtcMediaResource {
            id: Some("node-recording-1".to_string()),
            kind: RtcMediaKind::Video,
            source: RtcMediaSource::Drive,
            url: None,
            public_url: None,
            uri: Some("drive://spaces/space-rtc-user-1/nodes/node-recording-1".to_string()),
            object_blob_id: None,
            file_name: Some("session-1.mp4".to_string()),
            mime_type: Some("video/mp4".to_string()),
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
        };
        let serialized = serialize_json(&resource).expect("media resource should serialize");

        for forbidden in ["bucket", "objectKey", "signedUrl", "presigned"] {
            assert!(
                !serialized.contains(forbidden),
                "media resource snapshot must not expose provider storage detail {forbidden}"
            );
        }
        assert!(serialized.contains("drive"));
    }
}
