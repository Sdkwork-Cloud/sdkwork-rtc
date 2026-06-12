use std::fmt;

use sdkwork_communication_rtc_service::{
    RtcMediaSessionCompletionArtifactSummary, RtcMediaSessionCompletionParticipantSummary,
    RtcMediaSessionCompletionQualitySummary, RtcMediaSessionCompletionRecord,
    RtcMediaSessionCompletionRecordingSummary, RtcMediaSessionCompletionTrackSummary,
    RtcMediaSessionEndSource, RtcMediaSessionMode, RtcMediaSessionStatus,
};
use serde::de::DeserializeOwned;
use serde_json::Value as JsonValue;
use sqlx::{PgPool, Postgres, Row, Sqlite, SqlitePool, postgres::PgRow, sqlite::SqliteRow};

#[derive(Debug)]
pub enum RtcStorageError {
    Sqlx(sqlx::Error),
    Json(serde_json::Error),
    InvalidEnumValue { field: &'static str, value: String },
    MissingMediaSessionSummary { media_session_id: String },
    MissingProviderAccount { provider_account_id: String },
    MissingProviderApplication { provider_application_id: String },
    MissingProviderCredential { provider_credential_id: String },
    MissingProviderProfile { provider_profile_id: String },
    MissingProviderRoute { provider_route_id: String },
    MissingProviderWebhookEvent { webhook_event_id: String },
    MissingProviderQueryJob { provider_query_job_id: String },
    MissingProviderQuerySnapshot { provider_query_snapshot_id: String },
}

impl fmt::Display for RtcStorageError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Sqlx(error) => write!(formatter, "rtc storage sqlx error: {error}"),
            Self::Json(error) => write!(formatter, "rtc storage json error: {error}"),
            Self::InvalidEnumValue { field, value } => {
                write!(
                    formatter,
                    "invalid rtc storage enum value for {field}: {value}"
                )
            }
            Self::MissingMediaSessionSummary { media_session_id } => {
                write!(
                    formatter,
                    "rtc media session summary row is missing for completion record: {media_session_id}"
                )
            }
            Self::MissingProviderAccount {
                provider_account_id,
            } => {
                write!(
                    formatter,
                    "rtc provider account row is missing: {provider_account_id}"
                )
            }
            Self::MissingProviderApplication {
                provider_application_id,
            } => {
                write!(
                    formatter,
                    "rtc provider application row is missing: {provider_application_id}"
                )
            }
            Self::MissingProviderCredential {
                provider_credential_id,
            } => {
                write!(
                    formatter,
                    "rtc provider credential row is missing: {provider_credential_id}"
                )
            }
            Self::MissingProviderProfile {
                provider_profile_id,
            } => {
                write!(
                    formatter,
                    "rtc provider profile row is missing: {provider_profile_id}"
                )
            }
            Self::MissingProviderRoute { provider_route_id } => {
                write!(
                    formatter,
                    "rtc provider route row is missing: {provider_route_id}"
                )
            }
            Self::MissingProviderWebhookEvent { webhook_event_id } => {
                write!(
                    formatter,
                    "rtc provider webhook event row is missing: {webhook_event_id}"
                )
            }
            Self::MissingProviderQueryJob {
                provider_query_job_id,
            } => {
                write!(
                    formatter,
                    "rtc provider query job row is missing: {provider_query_job_id}"
                )
            }
            Self::MissingProviderQuerySnapshot {
                provider_query_snapshot_id,
            } => {
                write!(
                    formatter,
                    "rtc provider query snapshot row is missing: {provider_query_snapshot_id}"
                )
            }
        }
    }
}

impl std::error::Error for RtcStorageError {}

impl From<sqlx::Error> for RtcStorageError {
    fn from(error: sqlx::Error) -> Self {
        Self::Sqlx(error)
    }
}

impl From<serde_json::Error> for RtcStorageError {
    fn from(error: serde_json::Error) -> Self {
        Self::Json(error)
    }
}

pub type RtcStorageResult<T> = Result<T, RtcStorageError>;

#[derive(Clone, Debug)]
pub struct RtcSqliteCompletionRecordRepository {
    pool: SqlitePool,
}

impl RtcSqliteCompletionRecordRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn upsert_completion_record(
        &self,
        numeric_id: i64,
        record: &RtcMediaSessionCompletionRecord,
    ) -> RtcStorageResult<()> {
        let quality_summary = serialize_json(&record.quality_summary)?;
        let recording_summary = serialize_json(&record.recording_summary)?;
        let participants = serialize_json(&record.participants)?;
        let tracks = serialize_json(&record.tracks)?;
        let artifacts = serialize_json(&record.artifacts)?;
        let completion_snapshot = serialize_json(&record.completion_snapshot)?;
        let mut transaction = self.pool.begin().await?;

        sqlx::query(
            r#"
            INSERT INTO rtc_media_session_completion_record (
                id,
                uuid,
                tenant_id,
                organization_id,
                session_id,
                room_id,
                owner_user_id,
                provider_profile_id,
                provider_session_id,
                media_mode,
                session_status,
                started_at,
                connected_at,
                ended_at,
                duration_ms,
                end_reason,
                end_source,
                participant_count,
                max_concurrent_participants,
                artifact_count,
                recording_artifact_count,
                failed_artifact_count,
                quality_summary_snapshot,
                recording_summary_snapshot,
                participant_summary_snapshot,
                track_summary_snapshot,
                artifact_summary_snapshot,
                provider_webhook_event_id,
                provider_query_job_id,
                completion_snapshot,
                completion_snapshot_hash,
                recorded_at,
                created_at,
                updated_at,
                version
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            ON CONFLICT(session_id) DO UPDATE SET
                uuid = excluded.uuid,
                tenant_id = excluded.tenant_id,
                organization_id = excluded.organization_id,
                room_id = excluded.room_id,
                owner_user_id = excluded.owner_user_id,
                provider_profile_id = excluded.provider_profile_id,
                provider_session_id = excluded.provider_session_id,
                media_mode = excluded.media_mode,
                session_status = excluded.session_status,
                started_at = excluded.started_at,
                connected_at = excluded.connected_at,
                ended_at = excluded.ended_at,
                duration_ms = excluded.duration_ms,
                end_reason = excluded.end_reason,
                end_source = excluded.end_source,
                participant_count = excluded.participant_count,
                max_concurrent_participants = excluded.max_concurrent_participants,
                artifact_count = excluded.artifact_count,
                recording_artifact_count = excluded.recording_artifact_count,
                failed_artifact_count = excluded.failed_artifact_count,
                quality_summary_snapshot = excluded.quality_summary_snapshot,
                recording_summary_snapshot = excluded.recording_summary_snapshot,
                participant_summary_snapshot = excluded.participant_summary_snapshot,
                track_summary_snapshot = excluded.track_summary_snapshot,
                artifact_summary_snapshot = excluded.artifact_summary_snapshot,
                provider_webhook_event_id = excluded.provider_webhook_event_id,
                provider_query_job_id = excluded.provider_query_job_id,
                completion_snapshot = excluded.completion_snapshot,
                completion_snapshot_hash = excluded.completion_snapshot_hash,
                recorded_at = excluded.recorded_at,
                updated_at = excluded.updated_at,
                version = rtc_media_session_completion_record.version + 1
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.media_session_id)
        .bind(&record.room_id)
        .bind(parse_i64_field("owner_user_id", &record.owner_user_id)?)
        .bind(&record.provider_profile_id)
        .bind(&record.provider_session_id)
        .bind(media_mode_to_i32(&record.media_mode))
        .bind(media_session_status_to_i32(&record.session_status))
        .bind(&record.started_at)
        .bind(&record.connected_at)
        .bind(&record.ended_at)
        .bind(option_u64_to_i64(record.duration_ms))
        .bind(&record.end_reason)
        .bind(record.end_source.as_ref().map(end_source_to_str))
        .bind(u32_to_i64(record.participant_count))
        .bind(u32_to_i64(record.max_concurrent_participants))
        .bind(u32_to_i64(record.recording_summary.artifact_count))
        .bind(u32_to_i64(
            record.recording_summary.recording_artifact_count,
        ))
        .bind(u32_to_i64(record.recording_summary.failed_artifact_count))
        .bind(quality_summary)
        .bind(recording_summary)
        .bind(participants)
        .bind(tracks)
        .bind(artifacts)
        .bind(&record.source_webhook_event_id)
        .bind(&record.source_provider_query_job_id)
        .bind(completion_snapshot)
        .bind(&record.completion_snapshot_hash)
        .bind(&record.recorded_at)
        .bind(&record.recorded_at)
        .bind(&record.recorded_at)
        .execute(&mut *transaction)
        .await?;

        self.update_media_session_summary(&mut transaction, record)
            .await?;
        transaction.commit().await?;

        Ok(())
    }

    pub async fn get_completion_record_by_session_id(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Option<RtcMediaSessionCompletionRecord>> {
        let row = sqlx::query(
            r#"
            SELECT
                uuid,
                tenant_id,
                organization_id,
                session_id,
                room_id,
                owner_user_id,
                provider_profile_id,
                provider_session_id,
                media_mode,
                session_status,
                started_at,
                connected_at,
                ended_at,
                duration_ms,
                end_reason,
                end_source,
                participant_count,
                max_concurrent_participants,
                quality_summary_snapshot,
                recording_summary_snapshot,
                participant_summary_snapshot,
                track_summary_snapshot,
                artifact_summary_snapshot,
                provider_webhook_event_id,
                provider_query_job_id,
                completion_snapshot,
                completion_snapshot_hash,
                recorded_at
            FROM rtc_media_session_completion_record
            WHERE session_id = ?
            "#,
        )
        .bind(media_session_id)
        .fetch_optional(&self.pool)
        .await?;

        row.map(sqlite_row_to_completion_record).transpose()
    }

    async fn update_media_session_summary(
        &self,
        transaction: &mut sqlx::Transaction<'_, Sqlite>,
        record: &RtcMediaSessionCompletionRecord,
    ) -> RtcStorageResult<()> {
        let quality_summary = serialize_json(&record.quality_summary)?;
        let recording_summary = serialize_json(&record.recording_summary)?;

        let result = sqlx::query(
            r#"
            UPDATE rtc_media_session
            SET
                provider_session_id = ?,
                connected_at = ?,
                ended_at = ?,
                duration_ms = ?,
                end_reason = ?,
                end_source = ?,
                participant_count = ?,
                max_concurrent_participants = ?,
                quality_summary_snapshot = ?,
                recording_summary_snapshot = ?,
                completion_recorded_at = ?,
                last_provider_webhook_event_id = ?,
                last_provider_query_job_id = ?,
                updated_at = ?,
                version = version + 1
            WHERE uuid = ?
            "#,
        )
        .bind(&record.provider_session_id)
        .bind(&record.connected_at)
        .bind(&record.ended_at)
        .bind(option_u64_to_i64(record.duration_ms))
        .bind(&record.end_reason)
        .bind(record.end_source.as_ref().map(end_source_to_str))
        .bind(u32_to_i64(record.participant_count))
        .bind(u32_to_i64(record.max_concurrent_participants))
        .bind(quality_summary)
        .bind(recording_summary)
        .bind(&record.recorded_at)
        .bind(&record.source_webhook_event_id)
        .bind(&record.source_provider_query_job_id)
        .bind(&record.recorded_at)
        .bind(&record.media_session_id)
        .execute(&mut **transaction)
        .await?;

        ensure_session_summary_updated(result.rows_affected(), &record.media_session_id)?;

        Ok(())
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresCompletionRecordRepository {
    pool: PgPool,
}

impl RtcPostgresCompletionRecordRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn upsert_completion_record(
        &self,
        numeric_id: i64,
        record: &RtcMediaSessionCompletionRecord,
    ) -> RtcStorageResult<()> {
        let mut transaction = self.pool.begin().await?;

        sqlx::query(
            r#"
            INSERT INTO rtc_media_session_completion_record (
                id,
                uuid,
                tenant_id,
                organization_id,
                session_id,
                room_id,
                owner_user_id,
                provider_profile_id,
                provider_session_id,
                media_mode,
                session_status,
                started_at,
                connected_at,
                ended_at,
                duration_ms,
                end_reason,
                end_source,
                participant_count,
                max_concurrent_participants,
                artifact_count,
                recording_artifact_count,
                failed_artifact_count,
                quality_summary_snapshot,
                recording_summary_snapshot,
                participant_summary_snapshot,
                track_summary_snapshot,
                artifact_summary_snapshot,
                provider_webhook_event_id,
                provider_query_job_id,
                completion_snapshot,
                completion_snapshot_hash,
                recorded_at,
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
                NULLIF($12::text, '')::timestamp,
                NULLIF($13::text, '')::timestamp,
                NULLIF($14::text, '')::timestamp,
                $15,
                $16,
                $17,
                $18,
                $19,
                $20,
                $21,
                $22,
                $23,
                $24,
                $25,
                $26,
                $27,
                $28,
                $29,
                $30,
                $31,
                $32::text::timestamp,
                $33::text::timestamp,
                $34::text::timestamp,
                0
            )
            ON CONFLICT(session_id) DO UPDATE SET
                uuid = excluded.uuid,
                tenant_id = excluded.tenant_id,
                organization_id = excluded.organization_id,
                room_id = excluded.room_id,
                owner_user_id = excluded.owner_user_id,
                provider_profile_id = excluded.provider_profile_id,
                provider_session_id = excluded.provider_session_id,
                media_mode = excluded.media_mode,
                session_status = excluded.session_status,
                started_at = excluded.started_at,
                connected_at = excluded.connected_at,
                ended_at = excluded.ended_at,
                duration_ms = excluded.duration_ms,
                end_reason = excluded.end_reason,
                end_source = excluded.end_source,
                participant_count = excluded.participant_count,
                max_concurrent_participants = excluded.max_concurrent_participants,
                artifact_count = excluded.artifact_count,
                recording_artifact_count = excluded.recording_artifact_count,
                failed_artifact_count = excluded.failed_artifact_count,
                quality_summary_snapshot = excluded.quality_summary_snapshot,
                recording_summary_snapshot = excluded.recording_summary_snapshot,
                participant_summary_snapshot = excluded.participant_summary_snapshot,
                track_summary_snapshot = excluded.track_summary_snapshot,
                artifact_summary_snapshot = excluded.artifact_summary_snapshot,
                provider_webhook_event_id = excluded.provider_webhook_event_id,
                provider_query_job_id = excluded.provider_query_job_id,
                completion_snapshot = excluded.completion_snapshot,
                completion_snapshot_hash = excluded.completion_snapshot_hash,
                recorded_at = excluded.recorded_at,
                updated_at = excluded.updated_at,
                version = rtc_media_session_completion_record.version + 1
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.media_session_id)
        .bind(&record.room_id)
        .bind(parse_i64_field("owner_user_id", &record.owner_user_id)?)
        .bind(&record.provider_profile_id)
        .bind(&record.provider_session_id)
        .bind(media_mode_to_i32(&record.media_mode))
        .bind(media_session_status_to_i32(&record.session_status))
        .bind(&record.started_at)
        .bind(&record.connected_at)
        .bind(&record.ended_at)
        .bind(option_u64_to_i64(record.duration_ms))
        .bind(&record.end_reason)
        .bind(record.end_source.as_ref().map(end_source_to_str))
        .bind(u32_to_i32(record.participant_count))
        .bind(u32_to_i32(record.max_concurrent_participants))
        .bind(u32_to_i32(record.recording_summary.artifact_count))
        .bind(u32_to_i32(
            record.recording_summary.recording_artifact_count,
        ))
        .bind(u32_to_i32(record.recording_summary.failed_artifact_count))
        .bind(sqlx::types::Json(record.quality_summary.clone()))
        .bind(sqlx::types::Json(record.recording_summary.clone()))
        .bind(sqlx::types::Json(record.participants.clone()))
        .bind(sqlx::types::Json(record.tracks.clone()))
        .bind(sqlx::types::Json(record.artifacts.clone()))
        .bind(&record.source_webhook_event_id)
        .bind(&record.source_provider_query_job_id)
        .bind(sqlx::types::Json(record.completion_snapshot.clone()))
        .bind(&record.completion_snapshot_hash)
        .bind(&record.recorded_at)
        .bind(&record.recorded_at)
        .bind(&record.recorded_at)
        .execute(&mut *transaction)
        .await?;

        self.update_media_session_summary(&mut transaction, record)
            .await?;
        transaction.commit().await?;

        Ok(())
    }

    pub async fn get_completion_record_by_session_id(
        &self,
        media_session_id: &str,
    ) -> RtcStorageResult<Option<RtcMediaSessionCompletionRecord>> {
        let row = sqlx::query(
            r#"
            SELECT
                uuid,
                tenant_id,
                organization_id,
                session_id,
                room_id,
                owner_user_id,
                provider_profile_id,
                provider_session_id,
                media_mode,
                session_status,
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
                participant_summary_snapshot,
                track_summary_snapshot,
                artifact_summary_snapshot,
                provider_webhook_event_id,
                provider_query_job_id,
                completion_snapshot,
                completion_snapshot_hash,
                to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS recorded_at
            FROM rtc_media_session_completion_record
            WHERE session_id = $1
            "#,
        )
        .bind(media_session_id)
        .fetch_optional(&self.pool)
        .await?;

        row.map(postgres_row_to_completion_record).transpose()
    }

    async fn update_media_session_summary(
        &self,
        transaction: &mut sqlx::Transaction<'_, Postgres>,
        record: &RtcMediaSessionCompletionRecord,
    ) -> RtcStorageResult<()> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_media_session
            SET
                provider_session_id = $1,
                connected_at = NULLIF($2::text, '')::timestamp,
                ended_at = NULLIF($3::text, '')::timestamp,
                duration_ms = $4,
                end_reason = $5,
                end_source = $6,
                participant_count = $7,
                max_concurrent_participants = $8,
                quality_summary_snapshot = $9,
                recording_summary_snapshot = $10,
                completion_recorded_at = $11::text::timestamp,
                last_provider_webhook_event_id = $12,
                last_provider_query_job_id = $13,
                updated_at = $14::text::timestamp,
                version = version + 1
            WHERE uuid = $15
            "#,
        )
        .bind(&record.provider_session_id)
        .bind(&record.connected_at)
        .bind(&record.ended_at)
        .bind(option_u64_to_i64(record.duration_ms))
        .bind(&record.end_reason)
        .bind(record.end_source.as_ref().map(end_source_to_str))
        .bind(u32_to_i32(record.participant_count))
        .bind(u32_to_i32(record.max_concurrent_participants))
        .bind(sqlx::types::Json(record.quality_summary.clone()))
        .bind(sqlx::types::Json(record.recording_summary.clone()))
        .bind(&record.recorded_at)
        .bind(&record.source_webhook_event_id)
        .bind(&record.source_provider_query_job_id)
        .bind(&record.recorded_at)
        .bind(&record.media_session_id)
        .execute(&mut **transaction)
        .await?;

        ensure_session_summary_updated(result.rows_affected(), &record.media_session_id)?;

        Ok(())
    }
}

fn sqlite_row_to_completion_record(
    row: SqliteRow,
) -> RtcStorageResult<RtcMediaSessionCompletionRecord> {
    let media_mode: i32 = row.try_get("media_mode")?;
    let session_status: i32 = row.try_get("session_status")?;
    let end_source: Option<String> = row.try_get("end_source")?;
    let duration_ms: Option<i64> = row.try_get("duration_ms")?;

    Ok(RtcMediaSessionCompletionRecord {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        media_session_id: row.try_get("session_id")?,
        room_id: row.try_get("room_id")?,
        owner_user_id: sqlite_i64_column_to_string(&row, "owner_user_id")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        media_mode: i32_to_media_mode(media_mode)?,
        session_status: i32_to_media_session_status(session_status)?,
        started_at: row.try_get("started_at")?,
        connected_at: row.try_get("connected_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(duration_ms),
        end_reason: row.try_get("end_reason")?,
        end_source: end_source.as_deref().map(str_to_end_source).transpose()?,
        participant_count: i64_column_to_u32(&row, "participant_count")?,
        max_concurrent_participants: i64_column_to_u32(&row, "max_concurrent_participants")?,
        quality_summary: deserialize_json_text(row.try_get("quality_summary_snapshot")?)?,
        recording_summary: deserialize_json_text(row.try_get("recording_summary_snapshot")?)?,
        participants: deserialize_json_text(row.try_get("participant_summary_snapshot")?)?,
        tracks: deserialize_json_text(row.try_get("track_summary_snapshot")?)?,
        artifacts: deserialize_json_text(row.try_get("artifact_summary_snapshot")?)?,
        source_webhook_event_id: row.try_get("provider_webhook_event_id")?,
        source_provider_query_job_id: row.try_get("provider_query_job_id")?,
        completion_snapshot: deserialize_json_text(row.try_get("completion_snapshot")?)?,
        completion_snapshot_hash: row.try_get("completion_snapshot_hash")?,
        recorded_at: row.try_get("recorded_at")?,
    })
}

fn postgres_row_to_completion_record(
    row: PgRow,
) -> RtcStorageResult<RtcMediaSessionCompletionRecord> {
    let media_mode: i32 = row.try_get("media_mode")?;
    let session_status: i32 = row.try_get("session_status")?;
    let end_source: Option<String> = row.try_get("end_source")?;
    let duration_ms: Option<i64> = row.try_get("duration_ms")?;
    let quality_summary: sqlx::types::Json<RtcMediaSessionCompletionQualitySummary> =
        row.try_get("quality_summary_snapshot")?;
    let recording_summary: sqlx::types::Json<RtcMediaSessionCompletionRecordingSummary> =
        row.try_get("recording_summary_snapshot")?;
    let participants: sqlx::types::Json<Vec<RtcMediaSessionCompletionParticipantSummary>> =
        row.try_get("participant_summary_snapshot")?;
    let tracks: sqlx::types::Json<Vec<RtcMediaSessionCompletionTrackSummary>> =
        row.try_get("track_summary_snapshot")?;
    let artifacts: sqlx::types::Json<Vec<RtcMediaSessionCompletionArtifactSummary>> =
        row.try_get("artifact_summary_snapshot")?;
    let completion_snapshot: sqlx::types::Json<JsonValue> = row.try_get("completion_snapshot")?;

    Ok(RtcMediaSessionCompletionRecord {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        media_session_id: row.try_get("session_id")?,
        room_id: row.try_get("room_id")?,
        owner_user_id: postgres_i64_column_to_string(&row, "owner_user_id")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        media_mode: i32_to_media_mode(media_mode)?,
        session_status: i32_to_media_session_status(session_status)?,
        started_at: row.try_get("started_at")?,
        connected_at: row.try_get("connected_at")?,
        ended_at: row.try_get("ended_at")?,
        duration_ms: option_i64_to_u64(duration_ms),
        end_reason: row.try_get("end_reason")?,
        end_source: end_source.as_deref().map(str_to_end_source).transpose()?,
        participant_count: i32_column_to_u32(&row, "participant_count")?,
        max_concurrent_participants: i32_column_to_u32(&row, "max_concurrent_participants")?,
        quality_summary: quality_summary.0,
        recording_summary: recording_summary.0,
        participants: participants.0,
        tracks: tracks.0,
        artifacts: artifacts.0,
        source_webhook_event_id: row.try_get("provider_webhook_event_id")?,
        source_provider_query_job_id: row.try_get("provider_query_job_id")?,
        completion_snapshot: completion_snapshot.0,
        completion_snapshot_hash: row.try_get("completion_snapshot_hash")?,
        recorded_at: row.try_get("recorded_at")?,
    })
}

fn serialize_json<T>(value: &T) -> RtcStorageResult<String>
where
    T: serde::Serialize,
{
    Ok(serde_json::to_string(value)?)
}

fn deserialize_json_text<T>(value: String) -> RtcStorageResult<T>
where
    T: DeserializeOwned,
{
    Ok(serde_json::from_str(&value)?)
}

fn ensure_session_summary_updated(
    rows_affected: u64,
    media_session_id: &str,
) -> RtcStorageResult<()> {
    if rows_affected == 0 {
        return Err(RtcStorageError::MissingMediaSessionSummary {
            media_session_id: media_session_id.to_string(),
        });
    }

    Ok(())
}

fn parse_i64_field(field: &'static str, value: &str) -> RtcStorageResult<i64> {
    value
        .parse::<i64>()
        .map_err(|_| RtcStorageError::InvalidEnumValue {
            field,
            value: value.to_string(),
        })
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
            field: "session_status",
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
    use crate::SQLITE_SCHEMA;
    use sdkwork_communication_rtc_service::{
        RtcMediaParticipant, RtcMediaSession, RtcMediaSessionCompletionInput,
        RtcMediaSessionCompletionRecord, RtcParticipantRole, RtcParticipantState,
    };
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn sqlite_repository_upserts_and_reads_post_session_completion_record() {
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

        sqlx::query(
            r#"
            INSERT INTO rtc_media_session (
                id,
                uuid,
                tenant_id,
                organization_id,
                room_id,
                owner_user_id,
                media_mode,
                status,
                provider_profile_id,
                provider_session_id,
                started_at,
                connected_at,
                ended_at,
                duration_ms,
                end_reason,
                end_source,
                participant_count,
                max_concurrent_participants,
                created_at,
                updated_at,
                version
            )
            VALUES (
                1,
                'session-1',
                100,
                200,
                'room-1',
                300,
                2,
                4,
                'provider-volcengine-default',
                'volc-session-1',
                '2026-06-06T00:00:00.000Z',
                '2026-06-06T00:00:02.000Z',
                '2026-06-06T00:10:00.000Z',
                600000,
                'host_closed',
                'provider_webhook',
                2,
                2,
                '2026-06-06T00:00:00.000Z',
                '2026-06-06T00:00:00.000Z',
                0
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("seed media session should insert");

        let completion =
            RtcMediaSessionCompletionRecord::from_input(RtcMediaSessionCompletionInput {
                session: completion_test_session(),
                tracks: Vec::new(),
                artifacts: Vec::new(),
                quality_samples: Vec::new(),
                source_webhook_event_id: Some("webhook-1".to_string()),
                source_provider_query_job_id: Some("query-1".to_string()),
                recorded_at: "2026-06-06T00:10:05.000Z".to_string(),
            });
        let repository = RtcSqliteCompletionRecordRepository::new(pool.clone());

        repository
            .upsert_completion_record(1, &completion)
            .await
            .expect("completion record should persist");
        let stored = repository
            .get_completion_record_by_session_id("session-1")
            .await
            .expect("completion record lookup should work")
            .expect("completion record should exist");

        assert_eq!(stored.media_session_id, "session-1");
        assert_eq!(
            stored.provider_session_id.as_deref(),
            Some("volc-session-1")
        );
        assert_eq!(
            stored.end_source,
            Some(RtcMediaSessionEndSource::ProviderWebhook)
        );
        assert_eq!(stored.source_webhook_event_id.as_deref(), Some("webhook-1"));
        assert_eq!(
            stored.source_provider_query_job_id.as_deref(),
            Some("query-1")
        );
        assert_eq!(
            stored.completion_snapshot_hash,
            completion.completion_snapshot_hash
        );

        let session_summary =
            sqlx::query_as::<_, (Option<String>, Option<String>, Option<String>)>(
                r#"
            SELECT
                completion_recorded_at,
                last_provider_webhook_event_id,
                last_provider_query_job_id
            FROM rtc_media_session
            WHERE uuid = 'session-1'
            "#,
            )
            .fetch_one(&pool)
            .await
            .expect("session summary should be readable");

        assert_eq!(
            session_summary.0.as_deref(),
            Some("2026-06-06T00:10:05.000Z")
        );
        assert_eq!(session_summary.1.as_deref(), Some("webhook-1"));
        assert_eq!(session_summary.2.as_deref(), Some("query-1"));
    }

    #[tokio::test]
    async fn sqlite_repository_rolls_back_completion_record_when_session_summary_is_missing() {
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

        let completion =
            RtcMediaSessionCompletionRecord::from_input(RtcMediaSessionCompletionInput {
                session: completion_test_session(),
                tracks: Vec::new(),
                artifacts: Vec::new(),
                quality_samples: Vec::new(),
                source_webhook_event_id: Some("webhook-1".to_string()),
                source_provider_query_job_id: Some("query-1".to_string()),
                recorded_at: "2026-06-06T00:10:05.000Z".to_string(),
            });
        let repository = RtcSqliteCompletionRecordRepository::new(pool.clone());

        let result = repository.upsert_completion_record(1, &completion).await;

        assert!(
            result.is_err(),
            "completion persistence must fail when its media session summary row is missing"
        );
        let stored_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM rtc_media_session_completion_record WHERE session_id = 'session-1'",
        )
        .fetch_one(&pool)
        .await
        .expect("completion record count should be readable");
        assert_eq!(
            stored_count, 0,
            "completion insert must roll back with the failed session summary update"
        );
    }

    fn completion_test_session() -> RtcMediaSession {
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
            started_at: Some("2026-06-06T00:00:00.000Z".to_string()),
            connected_at: Some("2026-06-06T00:00:02.000Z".to_string()),
            ended_at: Some("2026-06-06T00:10:00.000Z".to_string()),
            duration_ms: Some(600_000),
            end_reason: Some("host_closed".to_string()),
            end_source: Some(RtcMediaSessionEndSource::ProviderWebhook),
            participant_count: 2,
            max_concurrent_participants: 2,
            quality_summary: None,
            recording_summary: None,
            completion_recorded_at: None,
            last_provider_webhook_event_id: Some("webhook-1".to_string()),
            last_provider_query_job_id: Some("query-1".to_string()),
            participants: vec![
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
                    joined_at: Some("2026-06-06T00:00:02.000Z".to_string()),
                    left_at: Some("2026-06-06T00:10:00.000Z".to_string()),
                    duration_ms: Some(598_000),
                    leave_reason: Some("host_closed".to_string()),
                    last_seen_at: Some("2026-06-06T00:10:00.000Z".to_string()),
                },
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
                    joined_at: Some("2026-06-06T00:00:30.000Z".to_string()),
                    left_at: Some("2026-06-06T00:09:50.000Z".to_string()),
                    duration_ms: Some(560_000),
                    leave_reason: Some("user_left".to_string()),
                    last_seen_at: Some("2026-06-06T00:09:50.000Z".to_string()),
                },
            ],
        }
    }
}
