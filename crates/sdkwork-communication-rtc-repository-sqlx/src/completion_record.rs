use std::fmt;

use sdkwork_communication_rtc_service::{
    RtcMediaSessionCompletionArtifactSummary, RtcMediaSessionCompletionParticipantSummary,
    RtcMediaSessionCompletionQualitySummary, RtcMediaSessionCompletionRecord,
    RtcMediaSessionCompletionRecordingSummary, RtcMediaSessionCompletionTrackSummary,
    RtcMediaSessionEndSource, RtcMediaSessionMode, RtcMediaSessionStatus};
use serde::de::DeserializeOwned;
use serde_json::Value as JsonValue;
use sqlx::{PgPool, Postgres, Row, postgres::PgRow};

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
    Conflict(String)}

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
                provider_account_id} => {
                write!(
                    formatter,
                    "rtc provider account row is missing: {provider_account_id}"
                )
            }
            Self::MissingProviderApplication {
                provider_application_id} => {
                write!(
                    formatter,
                    "rtc provider application row is missing: {provider_application_id}"
                )
            }
            Self::MissingProviderCredential {
                provider_credential_id} => {
                write!(
                    formatter,
                    "rtc provider credential row is missing: {provider_credential_id}"
                )
            }
            Self::MissingProviderProfile {
                provider_profile_id} => {
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
                provider_query_job_id} => {
                write!(
                    formatter,
                    "rtc provider query job row is missing: {provider_query_job_id}"
                )
            }
            Self::MissingProviderQuerySnapshot {
                provider_query_snapshot_id} => {
                write!(
                    formatter,
                    "rtc provider query snapshot row is missing: {provider_query_snapshot_id}"
                )
            }
            Self::Conflict(message) => write!(formatter, "rtc storage conflict: {message}")}
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
        self.upsert_completion_record_with(&mut transaction, numeric_id, record)
            .await?;
        transaction.commit().await?;
        Ok(())
    }

    pub async fn upsert_completion_record_with(
        &self,
        transaction: &mut sqlx::Transaction<'_, Postgres>,
        numeric_id: i64,
        record: &RtcMediaSessionCompletionRecord,
    ) -> RtcStorageResult<()> {
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
        .execute(&mut **transaction)
        .await?;

        self.update_media_session_summary(transaction, record).await
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

    pub async fn list_completion_records_for_sessions(
        &self,
        session_ids: &[String],
    ) -> RtcStorageResult<Vec<RtcMediaSessionCompletionRecord>> {
        if session_ids.is_empty() {
            return Ok(Vec::new());
        }
        let placeholders = session_ids
            .iter()
            .enumerate()
            .map(|(index, _)| format!("${}", index + 1))
            .collect::<Vec<_>>()
            .join(", ");
        let sql = format!(
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
            WHERE session_id IN ({placeholders})
            ORDER BY session_id ASC, recorded_at ASC
            "#
        );
        let mut query = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()));
        for session_id in session_ids {
            query = query.bind(session_id);
        }
        let rows = query.fetch_all(&self.pool).await?;
        rows.into_iter()
            .map(postgres_row_to_completion_record)
            .collect()
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
        recorded_at: row.try_get("recorded_at")?})
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
            media_session_id: media_session_id.to_string()});
    }

    Ok(())
}

fn parse_i64_field(field: &'static str, value: &str) -> RtcStorageResult<i64> {
    value
        .parse::<i64>()
        .map_err(|_| RtcStorageError::InvalidEnumValue {
            field,
            value: value.to_string()})
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


fn postgres_i64_column_to_string(row: &PgRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}


fn i32_column_to_u32(row: &PgRow, column: &'static str) -> RtcStorageResult<u32> {
    let value: i32 = row.try_get(column)?;
    Ok(u32::try_from(value).unwrap_or(u32::MAX))
}

fn media_mode_to_i32(value: &RtcMediaSessionMode) -> i32 {
    match value {
        RtcMediaSessionMode::Audio => 1,
        RtcMediaSessionMode::Video => 2,
        RtcMediaSessionMode::Live => 3}
}

fn i32_to_media_mode(value: i32) -> RtcStorageResult<RtcMediaSessionMode> {
    match value {
        1 => Ok(RtcMediaSessionMode::Audio),
        2 => Ok(RtcMediaSessionMode::Video),
        3 => Ok(RtcMediaSessionMode::Live),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "media_mode",
            value: value.to_string()})}
}

fn media_session_status_to_i32(value: &RtcMediaSessionStatus) -> i32 {
    match value {
        RtcMediaSessionStatus::Preparing => 1,
        RtcMediaSessionStatus::Active => 2,
        RtcMediaSessionStatus::Closing => 3,
        RtcMediaSessionStatus::Ended => 4,
        RtcMediaSessionStatus::Failed => 5}
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
            value: value.to_string()})}
}

fn end_source_to_str(value: &RtcMediaSessionEndSource) -> &'static str {
    match value {
        RtcMediaSessionEndSource::ManualClose => "manual_close",
        RtcMediaSessionEndSource::ProviderWebhook => "provider_webhook",
        RtcMediaSessionEndSource::ActiveProviderQuery => "active_provider_query",
        RtcMediaSessionEndSource::ProviderStateSync => "provider_state_sync",
        RtcMediaSessionEndSource::Timeout => "timeout",
        RtcMediaSessionEndSource::SystemReconcile => "system_reconcile",
        RtcMediaSessionEndSource::Unknown => "unknown"}
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
            value: value.to_string()})}
}

