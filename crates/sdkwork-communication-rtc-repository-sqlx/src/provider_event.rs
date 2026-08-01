use sdkwork_communication_rtc_service::{
    RtcProviderEventKind, RtcProviderQueryJobRecord, RtcProviderQueryKind, RtcProviderQueryResult,
    RtcProviderQuerySnapshotRecord, RtcProviderWebhookEvent, RtcProviderWebhookEventRecord,
};
use serde::de::DeserializeOwned;
use serde_json::Value as JsonValue;
use sqlx::{PgPool, Row, SqlitePool, postgres::PgRow, sqlite::SqliteRow};

use crate::{RtcStorageError, RtcStorageResult};

#[derive(Clone, Debug)]
pub struct RtcSqliteProviderEventRepository {
    pool: SqlitePool,
}

impl RtcSqliteProviderEventRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn record_webhook_event(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        event: &RtcProviderWebhookEvent,
        status: &str,
    ) -> RtcStorageResult<RtcProviderWebhookEventRecord> {
        let id = format!("webhook-event-{numeric_id}");
        let raw_payload = normalize_json_text(&event.raw_payload)?;
        let normalized_event = normalize_json_text(&event.normalized_event_json)?;
        let provider_profile_dedupe_key = optional_dedupe_key(
            event.provider_profile_id.as_deref(),
            "__default_provider_profile__",
        );
        let external_event_dedupe_key = optional_dedupe_key(
            event.external_event_id.as_deref(),
            event.payload_hash.as_str(),
        );

        sqlx::query(sqlite_insert_webhook_event_sql())
            .bind(numeric_id)
            .bind(&id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&event.provider)
            .bind(&event.provider_profile_id)
            .bind(&provider_profile_dedupe_key)
            .bind(&event.external_event_id)
            .bind(&external_event_dedupe_key)
            .bind(&event.event_type)
            .bind(event_kind_to_str(&event.event_kind))
            .bind(&event.room_id)
            .bind(
                event
                    .rtc_session_id
                    .as_ref()
                    .or(event.provider_session_id.as_ref()),
            )
            .bind(&event.participant_id)
            .bind(&event.recording_id)
            .bind(&event.payload_hash)
            .bind(raw_payload)
            .bind(normalized_event)
            .bind(&event.signature_header)
            .bind(&event.received_at)
            .bind(Option::<String>::None)
            .bind(webhook_status_to_i32(status)?)
            .bind(&event.received_at)
            .bind(&event.received_at)
            .execute(&self.pool)
            .await?;

        let lookup = self
            .get_webhook_event_by_dedupe(
                tenant_id,
                organization_id,
                &event.provider,
                &provider_profile_dedupe_key,
                &external_event_dedupe_key,
                &event.payload_hash,
            )
            .await?;
        lookup.ok_or_else(|| RtcStorageError::MissingProviderWebhookEvent {
            webhook_event_id: id,
        })
    }

    pub async fn get_webhook_event_by_id(
        &self,
        webhook_event_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderWebhookEventRecord>> {
        let sql = webhook_event_select_columns_sql("WHERE uuid = ?", "");
        let row = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(webhook_event_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_webhook_event_record).transpose()
    }

    pub async fn list_webhook_events_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderWebhookEventRecord>> {
        let sql = webhook_event_select_columns_sql(
            "WHERE tenant_id = ? AND organization_id = ?",
            "ORDER BY received_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_webhook_event_record)
            .collect()
    }

    pub async fn list_hydration_webhook_events_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderWebhookEventRecord>> {
        let sql = webhook_event_select_columns_sql(
            "WHERE tenant_id = ? AND organization_id = ?",
            "ORDER BY received_at DESC, id DESC LIMIT ?",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_webhook_event_record)
            .collect()
    }

    pub async fn list_provider_query_jobs_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderQueryJobRecord>> {
        let sql = provider_query_job_select_columns_sql(
            "WHERE tenant_id = ? AND organization_id = ?",
            "ORDER BY requested_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_query_job_record)
            .collect()
    }

    pub async fn list_hydration_provider_query_jobs_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderQueryJobRecord>> {
        let sql = provider_query_job_select_columns_sql(
            "WHERE tenant_id = ? AND organization_id = ?",
            "ORDER BY requested_at DESC, id DESC LIMIT ?",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_query_job_record)
            .collect()
    }

    pub async fn list_provider_query_snapshots_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let sql = provider_query_snapshot_select_columns_sql(
            "WHERE tenant_id = ? AND organization_id = ?",
            "ORDER BY captured_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_query_snapshot_record)
            .collect()
    }

    pub async fn list_hydration_provider_query_snapshots_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let sql = provider_query_snapshot_select_columns_sql(
            "WHERE tenant_id = ? AND organization_id = ?",
            "ORDER BY captured_at DESC, id DESC LIMIT ?",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_query_snapshot_record)
            .collect()
    }

    pub async fn record_provider_query_result(
        &self,
        query_job_numeric_id: i64,
        snapshot_numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        result: &RtcProviderQueryResult,
    ) -> RtcStorageResult<(RtcProviderQueryJobRecord, RtcProviderQuerySnapshotRecord)> {
        let query_job_id = provider_query_job_id(result);
        let snapshot_id = format!("provider-query-snapshot-{snapshot_numeric_id}");
        let target_kind = provider_query_target_kind(result);
        let target_id = provider_query_target_id(result);
        let result_snapshot = provider_query_result_snapshot(result)?;

        sqlx::query(sqlite_upsert_provider_query_job_sql())
            .bind(query_job_numeric_id)
            .bind(&query_job_id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&result.provider)
            .bind(&result.provider_profile_id)
            .bind(query_kind_to_str(&result.query_kind))
            .bind(&target_kind)
            .bind(&target_id)
            .bind(&result.room_id)
            .bind(&result.rtc_session_id)
            .bind(&result.provider_session_id)
            .bind(&result.raw_provider_action)
            .bind(3)
            .bind(&result.queried_at)
            .bind(&result.queried_at)
            .bind(serde_json::to_string(&result_snapshot)?)
            .bind(&result.queried_at)
            .bind(&result.queried_at)
            .execute(&self.pool)
            .await?;

        sqlx::query(sqlite_insert_provider_query_snapshot_sql())
            .bind(snapshot_numeric_id)
            .bind(&snapshot_id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&query_job_id)
            .bind(&result.provider)
            .bind(query_kind_to_str(&result.query_kind))
            .bind(&target_kind)
            .bind(&target_id)
            .bind(&result.provider_session_id)
            .bind("provider_query_result")
            .bind(&result.result_snapshot_json)
            .bind(&result.queried_at)
            .bind(&result.queried_at)
            .execute(&self.pool)
            .await?;

        let job = self
            .get_provider_query_job_by_id(&query_job_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderQueryJob {
                provider_query_job_id: query_job_id.clone(),
            })?;
        let snapshot = self
            .list_provider_query_snapshots(&query_job_id)
            .await?
            .into_iter()
            .find(|snapshot| snapshot.id == snapshot_id)
            .ok_or_else(|| RtcStorageError::MissingProviderQuerySnapshot {
                provider_query_snapshot_id: snapshot_id,
            })?;

        Ok((job, snapshot))
    }

    pub async fn get_provider_query_job_by_id(
        &self,
        provider_query_job_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderQueryJobRecord>> {
        let sql = provider_query_job_select_columns_sql("WHERE uuid = ?", "");
        let row = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(provider_query_job_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_provider_query_job_record).transpose()
    }

    pub async fn list_provider_query_snapshots(
        &self,
        provider_query_job_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let sql = provider_query_snapshot_select_columns_sql(
            "WHERE provider_query_job_id = ?",
            "ORDER BY captured_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(provider_query_job_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_query_snapshot_record)
            .collect()
    }

    pub async fn list_webhook_events_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderWebhookEventRecord>> {
        let mut where_parts = vec![
            "tenant_id = ?".to_string(),
            "organization_id = ?".to_string(),
        ];
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            where_parts.push(
                "(LOWER(uuid) LIKE ? OR LOWER(provider) LIKE ? OR LOWER(event_type) LIKE ? OR LOWER(COALESCE(external_event_id, '')) LIKE ? OR LOWER(COALESCE(room_id, '')) LIKE ? OR LOWER(COALESCE(session_id, '')) LIKE ?)"
                    .to_string(),
            );
        }
        let order_column = webhook_event_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = webhook_event_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!("ORDER BY {order_column} {direction}, id ASC LIMIT ? OFFSET ?"),
        );
        let mut query = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(pattern) = needle.as_deref() {
            query = query
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern);
        }
        let rows = query
            .bind((limit + 1) as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter()
            .map(sqlite_row_to_webhook_event_record)
            .collect()
    }

    pub async fn list_provider_query_snapshots_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_query_job_id: Option<&str>,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let mut where_parts = vec![
            "tenant_id = ?".to_string(),
            "organization_id = ?".to_string(),
        ];
        if provider_query_job_id.is_some() {
            where_parts.push("provider_query_job_id = ?".to_string());
        }
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            where_parts.push(
                "(LOWER(uuid) LIKE ? OR LOWER(provider_query_job_id) LIKE ? OR LOWER(target_id) LIKE ? OR LOWER(COALESCE(provider_session_id, '')) LIKE ?)"
                    .to_string(),
            );
        }
        let order_column = provider_query_snapshot_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = provider_query_snapshot_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!("ORDER BY {order_column} {direction}, id ASC LIMIT ? OFFSET ?"),
        );
        let mut query = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(job_id) = provider_query_job_id {
            query = query.bind(job_id);
        }
        if let Some(pattern) = needle.as_deref() {
            query = query
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern);
        }
        let rows = query
            .bind((limit + 1) as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter()
            .map(sqlite_row_to_provider_query_snapshot_record)
            .collect()
    }

    async fn get_webhook_event_by_dedupe(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: &str,
        provider_profile_dedupe_key: &str,
        external_event_dedupe_key: &str,
        payload_hash: &str,
    ) -> RtcStorageResult<Option<RtcProviderWebhookEventRecord>> {
        let sql = webhook_event_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND provider = ?
              AND provider_profile_dedupe_key = ?
              AND external_event_dedupe_key = ?
              AND payload_hash = ?
            "#,
            "",
        );
        let row = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider)
            .bind(provider_profile_dedupe_key)
            .bind(external_event_dedupe_key)
            .bind(payload_hash)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_webhook_event_record).transpose()
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresProviderEventRepository {
    pool: PgPool,
}

impl RtcPostgresProviderEventRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn record_webhook_event(
        &self,
        numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        event: &RtcProviderWebhookEvent,
        status: &str,
    ) -> RtcStorageResult<RtcProviderWebhookEventRecord> {
        let id = format!("webhook-event-{numeric_id}");
        let raw_payload = normalize_json_value(&event.raw_payload)?;
        let normalized_event = normalize_json_value(&event.normalized_event_json)?;
        let provider_profile_dedupe_key = optional_dedupe_key(
            event.provider_profile_id.as_deref(),
            "__default_provider_profile__",
        );
        let external_event_dedupe_key = optional_dedupe_key(
            event.external_event_id.as_deref(),
            event.payload_hash.as_str(),
        );

        sqlx::query(postgres_insert_webhook_event_sql())
            .bind(numeric_id)
            .bind(&id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&event.provider)
            .bind(&event.provider_profile_id)
            .bind(&provider_profile_dedupe_key)
            .bind(&event.external_event_id)
            .bind(&external_event_dedupe_key)
            .bind(&event.event_type)
            .bind(event_kind_to_str(&event.event_kind))
            .bind(&event.room_id)
            .bind(
                event
                    .rtc_session_id
                    .as_ref()
                    .or(event.provider_session_id.as_ref()),
            )
            .bind(&event.participant_id)
            .bind(&event.recording_id)
            .bind(&event.payload_hash)
            .bind(sqlx::types::Json(raw_payload))
            .bind(sqlx::types::Json(normalized_event))
            .bind(&event.signature_header)
            .bind(&event.received_at)
            .bind(Option::<String>::None)
            .bind(webhook_status_to_i32(status)?)
            .bind(&event.received_at)
            .bind(&event.received_at)
            .execute(&self.pool)
            .await?;

        let lookup = self
            .get_webhook_event_by_dedupe(
                tenant_id,
                organization_id,
                &event.provider,
                &provider_profile_dedupe_key,
                &external_event_dedupe_key,
                &event.payload_hash,
            )
            .await?;
        lookup.ok_or_else(|| RtcStorageError::MissingProviderWebhookEvent {
            webhook_event_id: id,
        })
    }

    pub async fn get_webhook_event_by_id(
        &self,
        webhook_event_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderWebhookEventRecord>> {
        let sql = postgres_webhook_event_select_columns_sql("WHERE uuid = $1", "");
        let row = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(webhook_event_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_webhook_event_record).transpose()
    }

    pub async fn list_webhook_events_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderWebhookEventRecord>> {
        let sql = postgres_webhook_event_select_columns_sql(
            "WHERE tenant_id = $1 AND organization_id = $2",
            "ORDER BY received_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_webhook_event_record)
            .collect()
    }

    pub async fn list_hydration_webhook_events_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderWebhookEventRecord>> {
        let sql = postgres_webhook_event_select_columns_sql(
            "WHERE tenant_id = $1 AND organization_id = $2",
            "ORDER BY received_at DESC, id DESC LIMIT $3",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_webhook_event_record)
            .collect()
    }

    pub async fn list_provider_query_jobs_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderQueryJobRecord>> {
        let sql = postgres_provider_query_job_select_columns_sql(
            "WHERE tenant_id = $1 AND organization_id = $2",
            "ORDER BY requested_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_query_job_record)
            .collect()
    }

    pub async fn list_hydration_provider_query_jobs_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderQueryJobRecord>> {
        let sql = postgres_provider_query_job_select_columns_sql(
            "WHERE tenant_id = $1 AND organization_id = $2",
            "ORDER BY requested_at DESC, id DESC LIMIT $3",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_query_job_record)
            .collect()
    }

    pub async fn list_provider_query_snapshots_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let sql = postgres_provider_query_snapshot_select_columns_sql(
            "WHERE tenant_id = $1 AND organization_id = $2",
            "ORDER BY captured_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_query_snapshot_record)
            .collect()
    }

    pub async fn list_hydration_provider_query_snapshots_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let sql = postgres_provider_query_snapshot_select_columns_sql(
            "WHERE tenant_id = $1 AND organization_id = $2",
            "ORDER BY captured_at DESC, id DESC LIMIT $3",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_query_snapshot_record)
            .collect()
    }

    pub async fn record_provider_query_result(
        &self,
        query_job_numeric_id: i64,
        snapshot_numeric_id: i64,
        tenant_id: &str,
        organization_id: &str,
        result: &RtcProviderQueryResult,
    ) -> RtcStorageResult<(RtcProviderQueryJobRecord, RtcProviderQuerySnapshotRecord)> {
        let query_job_id = provider_query_job_id(result);
        let snapshot_id = format!("provider-query-snapshot-{snapshot_numeric_id}");
        let target_kind = provider_query_target_kind(result);
        let target_id = provider_query_target_id(result);
        let result_snapshot = provider_query_result_snapshot(result)?;
        let snapshot_payload = normalize_json_value(&result.result_snapshot_json)?;

        sqlx::query(postgres_upsert_provider_query_job_sql())
            .bind(query_job_numeric_id)
            .bind(&query_job_id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&result.provider)
            .bind(&result.provider_profile_id)
            .bind(query_kind_to_str(&result.query_kind))
            .bind(&target_kind)
            .bind(&target_id)
            .bind(&result.room_id)
            .bind(&result.rtc_session_id)
            .bind(&result.provider_session_id)
            .bind(&result.raw_provider_action)
            .bind(3)
            .bind(&result.queried_at)
            .bind(&result.queried_at)
            .bind(sqlx::types::Json(result_snapshot))
            .bind(&result.queried_at)
            .bind(&result.queried_at)
            .execute(&self.pool)
            .await?;

        sqlx::query(postgres_insert_provider_query_snapshot_sql())
            .bind(snapshot_numeric_id)
            .bind(&snapshot_id)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(&query_job_id)
            .bind(&result.provider)
            .bind(query_kind_to_str(&result.query_kind))
            .bind(&target_kind)
            .bind(&target_id)
            .bind(&result.provider_session_id)
            .bind("provider_query_result")
            .bind(sqlx::types::Json(snapshot_payload))
            .bind(&result.queried_at)
            .bind(&result.queried_at)
            .execute(&self.pool)
            .await?;

        let job = self
            .get_provider_query_job_by_id(&query_job_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderQueryJob {
                provider_query_job_id: query_job_id.clone(),
            })?;
        let snapshot = self
            .list_provider_query_snapshots(&query_job_id)
            .await?
            .into_iter()
            .find(|snapshot| snapshot.id == snapshot_id)
            .ok_or_else(|| RtcStorageError::MissingProviderQuerySnapshot {
                provider_query_snapshot_id: snapshot_id,
            })?;

        Ok((job, snapshot))
    }

    pub async fn get_provider_query_job_by_id(
        &self,
        provider_query_job_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderQueryJobRecord>> {
        let sql = postgres_provider_query_job_select_columns_sql("WHERE uuid = $1", "");
        let row = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(provider_query_job_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_provider_query_job_record)
            .transpose()
    }

    pub async fn list_provider_query_snapshots(
        &self,
        provider_query_job_id: &str,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let sql = postgres_provider_query_snapshot_select_columns_sql(
            "WHERE provider_query_job_id = $1",
            "ORDER BY captured_at ASC, id ASC",
        );
        let rows = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(provider_query_job_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_query_snapshot_record)
            .collect()
    }

    pub async fn list_webhook_events_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderWebhookEventRecord>> {
        let mut where_parts = vec![
            "tenant_id = $1".to_string(),
            "organization_id = $2".to_string(),
        ];
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            where_parts.push(
                "(LOWER(uuid) LIKE $3 OR LOWER(provider) LIKE $4 OR LOWER(event_type) LIKE $5 OR LOWER(COALESCE(external_event_id, '')) LIKE $6 OR LOWER(COALESCE(room_id, '')) LIKE $7 OR LOWER(COALESCE(session_id, '')) LIKE $8)"
                    .to_string(),
            );
        }
        let order_column = webhook_event_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let limit_param = if needle.is_some() { "$9" } else { "$3" };
        let offset_param = if needle.is_some() { "$10" } else { "$4" };
        let sql = postgres_webhook_event_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!(
                "ORDER BY {order_column} {direction}, id ASC LIMIT {limit_param} OFFSET {offset_param}"
            ),
        );
        let mut query = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(pattern) = needle.as_deref() {
            query = query
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern);
        }
        let rows = query
            .bind((limit + 1) as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter()
            .map(postgres_row_to_webhook_event_record)
            .collect()
    }

    pub async fn list_provider_query_snapshots_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_query_job_id: Option<&str>,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderQuerySnapshotRecord>> {
        let mut where_parts = vec![
            "tenant_id = $1".to_string(),
            "organization_id = $2".to_string(),
        ];
        let mut next_param = 3usize;
        if provider_query_job_id.is_some() {
            where_parts.push(format!("provider_query_job_id = ${next_param}"));
            next_param += 1;
        }
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            let start = next_param;
            where_parts.push(format!(
                "(LOWER(uuid) LIKE ${start} OR LOWER(provider_query_job_id) LIKE ${} OR LOWER(target_id) LIKE ${} OR LOWER(COALESCE(provider_session_id, '')) LIKE ${})",
                start + 1,
                start + 2,
                start + 3
            ));
            next_param += 4;
        }
        let limit_param = format!("${next_param}");
        let offset_param = format!("${}", next_param + 1);
        let order_column = provider_query_snapshot_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = postgres_provider_query_snapshot_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!(
                "ORDER BY {order_column} {direction}, id ASC LIMIT {limit_param} OFFSET {offset_param}"
            ),
        );
        let mut query = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(job_id) = provider_query_job_id {
            query = query.bind(job_id);
        }
        if let Some(pattern) = needle.as_deref() {
            query = query
                .bind(pattern)
                .bind(pattern)
                .bind(pattern)
                .bind(pattern);
        }
        let rows = query
            .bind((limit + 1) as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter()
            .map(postgres_row_to_provider_query_snapshot_record)
            .collect()
    }

    async fn get_webhook_event_by_dedupe(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: &str,
        provider_profile_dedupe_key: &str,
        external_event_dedupe_key: &str,
        payload_hash: &str,
    ) -> RtcStorageResult<Option<RtcProviderWebhookEventRecord>> {
        let sql = postgres_webhook_event_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND provider = $3
              AND provider_profile_dedupe_key = $4
              AND external_event_dedupe_key = $5
              AND payload_hash = $6
            "#,
            "",
        );
        let row = sqlx::query(sqlx::AssertSqlSafe(sql.as_str()))
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider)
            .bind(provider_profile_dedupe_key)
            .bind(external_event_dedupe_key)
            .bind(payload_hash)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_webhook_event_record).transpose()
    }
}

fn sqlite_insert_webhook_event_sql() -> &'static str {
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
        updated_at = excluded.updated_at,
        status = rtc_provider_webhook_event.status,
        processed_at = rtc_provider_webhook_event.processed_at
    "#
}

fn postgres_insert_webhook_event_sql() -> &'static str {
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
        updated_at = excluded.updated_at,
        status = rtc_provider_webhook_event.status,
        processed_at = rtc_provider_webhook_event.processed_at
    "#
}

fn sqlite_upsert_provider_query_job_sql() -> &'static str {
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
    "#
}

fn postgres_upsert_provider_query_job_sql() -> &'static str {
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
        $16::text::timestamp,
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
    "#
}

fn sqlite_insert_provider_query_snapshot_sql() -> &'static str {
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
    "#
}

fn postgres_insert_provider_query_snapshot_sql() -> &'static str {
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
    "#
}

fn webhook_event_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            external_event_id,
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
            status
        FROM rtc_provider_webhook_event
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_webhook_event_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider,
            provider_profile_id,
            external_event_id,
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
            to_char(received_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS received_at,
            to_char(processed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS processed_at,
            status
        FROM rtc_provider_webhook_event
        {where_clause}
        {order_clause}
        "#
    )
}

fn provider_query_job_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
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
            result_snapshot
        FROM rtc_provider_query_job
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_provider_query_job_select_columns_sql(
    where_clause: &str,
    order_clause: &str,
) -> String {
    format!(
        r#"
        SELECT
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
            to_char(requested_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS requested_at,
            to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS completed_at,
            result_snapshot
        FROM rtc_provider_query_job
        {where_clause}
        {order_clause}
        "#
    )
}

fn provider_query_snapshot_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
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
            captured_at
        FROM rtc_provider_query_snapshot
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_provider_query_snapshot_select_columns_sql(
    where_clause: &str,
    order_clause: &str,
) -> String {
    format!(
        r#"
        SELECT
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
            to_char(captured_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS captured_at
        FROM rtc_provider_query_snapshot
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_row_to_webhook_event_record(
    row: SqliteRow,
) -> RtcStorageResult<RtcProviderWebhookEventRecord> {
    Ok(RtcProviderWebhookEventRecord {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        external_event_id: row.try_get("external_event_id")?,
        event_type: row.try_get("event_type")?,
        event_kind: str_to_event_kind(row.try_get::<String, _>("event_kind")?.as_str())?,
        room_id: row.try_get("room_id")?,
        media_session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        recording_id: row.try_get("recording_id")?,
        payload_hash: row.try_get("payload_hash")?,
        raw_payload: deserialize_json_text(row.try_get("raw_payload")?)?,
        normalized_event: deserialize_json_text(row.try_get("normalized_event")?)?,
        signature_header: row.try_get("signature_header")?,
        received_at: row.try_get("received_at")?,
        processed_at: row.try_get("processed_at")?,
        status: webhook_status_to_str(row.try_get("status")?).to_string(),
    })
}

fn postgres_row_to_webhook_event_record(
    row: PgRow,
) -> RtcStorageResult<RtcProviderWebhookEventRecord> {
    let raw_payload: sqlx::types::Json<JsonValue> = row.try_get("raw_payload")?;
    let normalized_event: sqlx::types::Json<JsonValue> = row.try_get("normalized_event")?;

    Ok(RtcProviderWebhookEventRecord {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        external_event_id: row.try_get("external_event_id")?,
        event_type: row.try_get("event_type")?,
        event_kind: str_to_event_kind(row.try_get::<String, _>("event_kind")?.as_str())?,
        room_id: row.try_get("room_id")?,
        media_session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        recording_id: row.try_get("recording_id")?,
        payload_hash: row.try_get("payload_hash")?,
        raw_payload: raw_payload.0,
        normalized_event: normalized_event.0,
        signature_header: row.try_get("signature_header")?,
        received_at: row.try_get("received_at")?,
        processed_at: row.try_get("processed_at")?,
        status: webhook_status_to_str(row.try_get("status")?).to_string(),
    })
}

fn sqlite_row_to_provider_query_job_record(
    row: SqliteRow,
) -> RtcStorageResult<RtcProviderQueryJobRecord> {
    Ok(RtcProviderQueryJobRecord {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        query_kind: str_to_query_kind(row.try_get::<String, _>("query_kind")?.as_str())?,
        target_kind: row.try_get("target_kind")?,
        target_id: row.try_get("target_id")?,
        room_id: row.try_get("room_id")?,
        media_session_id: row.try_get("session_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        provider_request_id: row.try_get("provider_request_id")?,
        status: provider_query_status_to_str(row.try_get("status")?).to_string(),
        requested_at: row.try_get("requested_at")?,
        completed_at: row.try_get("completed_at")?,
        result_snapshot: deserialize_json_text(row.try_get("result_snapshot")?)?,
    })
}

fn postgres_row_to_provider_query_job_record(
    row: PgRow,
) -> RtcStorageResult<RtcProviderQueryJobRecord> {
    let result_snapshot: sqlx::types::Json<JsonValue> = row.try_get("result_snapshot")?;

    Ok(RtcProviderQueryJobRecord {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        query_kind: str_to_query_kind(row.try_get::<String, _>("query_kind")?.as_str())?,
        target_kind: row.try_get("target_kind")?,
        target_id: row.try_get("target_id")?,
        room_id: row.try_get("room_id")?,
        media_session_id: row.try_get("session_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        provider_request_id: row.try_get("provider_request_id")?,
        status: provider_query_status_to_str(row.try_get("status")?).to_string(),
        requested_at: row.try_get("requested_at")?,
        completed_at: row.try_get("completed_at")?,
        result_snapshot: result_snapshot.0,
    })
}

fn sqlite_row_to_provider_query_snapshot_record(
    row: SqliteRow,
) -> RtcStorageResult<RtcProviderQuerySnapshotRecord> {
    Ok(RtcProviderQuerySnapshotRecord {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider_query_job_id: row.try_get("provider_query_job_id")?,
        provider: row.try_get("provider")?,
        query_kind: str_to_query_kind(row.try_get::<String, _>("query_kind")?.as_str())?,
        target_kind: row.try_get("target_kind")?,
        target_id: row.try_get("target_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        snapshot_kind: row.try_get("snapshot_kind")?,
        snapshot_payload: deserialize_json_text(row.try_get("snapshot_payload")?)?,
        captured_at: row.try_get("captured_at")?,
    })
}

fn postgres_row_to_provider_query_snapshot_record(
    row: PgRow,
) -> RtcStorageResult<RtcProviderQuerySnapshotRecord> {
    let snapshot_payload: sqlx::types::Json<JsonValue> = row.try_get("snapshot_payload")?;

    Ok(RtcProviderQuerySnapshotRecord {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider_query_job_id: row.try_get("provider_query_job_id")?,
        provider: row.try_get("provider")?,
        query_kind: str_to_query_kind(row.try_get::<String, _>("query_kind")?.as_str())?,
        target_kind: row.try_get("target_kind")?,
        target_id: row.try_get("target_id")?,
        provider_session_id: row.try_get("provider_session_id")?,
        snapshot_kind: row.try_get("snapshot_kind")?,
        snapshot_payload: snapshot_payload.0,
        captured_at: row.try_get("captured_at")?,
    })
}

fn normalize_json_text(value: &str) -> RtcStorageResult<String> {
    Ok(serde_json::to_string(&normalize_json_value(value)?)?)
}

fn normalize_json_value(value: &str) -> RtcStorageResult<JsonValue> {
    Ok(serde_json::from_str(value)?)
}

fn deserialize_json_text<T>(value: String) -> RtcStorageResult<T>
where
    T: DeserializeOwned,
{
    Ok(serde_json::from_str(&value)?)
}

fn provider_query_result_snapshot(result: &RtcProviderQueryResult) -> RtcStorageResult<JsonValue> {
    let provider_snapshot = normalize_json_value(&result.result_snapshot_json)?;
    Ok(serde_json::json!({
        "provider": result.provider,
        "providerProfileId": result.provider_profile_id,
        "queryKind": result.query_kind,
        "targetKind": provider_query_target_kind(result),
        "targetId": provider_query_target_id(result),
        "providerSessionId": result.provider_session_id,
        "status": result.status,
        "providerAction": result.raw_provider_action,
        "providerSnapshot": provider_snapshot,
        "queriedAt": result.queried_at,
    }))
}

fn provider_query_job_id(result: &RtcProviderQueryResult) -> String {
    format!(
        "provider-query-{}-{}-{}",
        result.provider,
        query_kind_to_str(&result.query_kind),
        provider_query_target_id(result)
    )
}

fn optional_dedupe_key(value: Option<&str>, fallback: &str) -> String {
    value
        .filter(|inner| !inner.is_empty())
        .unwrap_or(fallback)
        .to_string()
}

fn provider_query_target_kind(result: &RtcProviderQueryResult) -> String {
    match result.query_kind {
        RtcProviderQueryKind::RoomOnlineUsers | RtcProviderQueryKind::RoomState => {
            "room".to_string()
        }
        RtcProviderQueryKind::MediaSessionState => "media_session".to_string(),
        RtcProviderQueryKind::RecordingArtifacts => "recording".to_string(),
        RtcProviderQueryKind::QualitySamples => "quality".to_string(),
    }
}

fn provider_query_target_id(result: &RtcProviderQueryResult) -> String {
    match result.query_kind {
        RtcProviderQueryKind::RoomOnlineUsers | RtcProviderQueryKind::RoomState => result
            .room_id
            .clone()
            .or_else(|| result.rtc_session_id.clone())
            .or_else(|| result.provider_session_id.clone()),
        RtcProviderQueryKind::MediaSessionState => result
            .rtc_session_id
            .clone()
            .or_else(|| result.provider_session_id.clone())
            .or_else(|| result.room_id.clone()),
        RtcProviderQueryKind::RecordingArtifacts => result
            .provider_session_id
            .clone()
            .or_else(|| result.rtc_session_id.clone())
            .or_else(|| result.room_id.clone()),
        RtcProviderQueryKind::QualitySamples => result
            .rtc_session_id
            .clone()
            .or_else(|| result.provider_session_id.clone())
            .or_else(|| result.room_id.clone()),
    }
    .unwrap_or_else(|| {
        format!(
            "{}-{}",
            result.provider,
            query_kind_to_str(&result.query_kind)
        )
    })
}

fn parse_i64_field(field: &'static str, value: &str) -> RtcStorageResult<i64> {
    value
        .parse::<i64>()
        .map_err(|_| RtcStorageError::InvalidEnumValue {
            field,
            value: value.to_string(),
        })
}

fn sqlite_i64_column_to_string(row: &SqliteRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn postgres_i64_column_to_string(row: &PgRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn event_kind_to_str(value: &RtcProviderEventKind) -> &'static str {
    match value {
        RtcProviderEventKind::RoomStarted => "room_started",
        RtcProviderEventKind::RoomEnded => "room_ended",
        RtcProviderEventKind::ParticipantJoined => "participant_joined",
        RtcProviderEventKind::ParticipantLeft => "participant_left",
        RtcProviderEventKind::RecordingStarted => "recording_started",
        RtcProviderEventKind::RecordingCompleted => "recording_completed",
        RtcProviderEventKind::RecordingFailed => "recording_failed",
        RtcProviderEventKind::MediaTrackStarted => "media_track_started",
        RtcProviderEventKind::MediaTrackStopped => "media_track_stopped",
        RtcProviderEventKind::QualitySample => "quality_sample",
        RtcProviderEventKind::Unknown => "unknown",
    }
}

fn str_to_event_kind(value: &str) -> RtcStorageResult<RtcProviderEventKind> {
    match value {
        "room_started" => Ok(RtcProviderEventKind::RoomStarted),
        "room_ended" => Ok(RtcProviderEventKind::RoomEnded),
        "participant_joined" => Ok(RtcProviderEventKind::ParticipantJoined),
        "participant_left" => Ok(RtcProviderEventKind::ParticipantLeft),
        "recording_started" => Ok(RtcProviderEventKind::RecordingStarted),
        "recording_completed" => Ok(RtcProviderEventKind::RecordingCompleted),
        "recording_failed" => Ok(RtcProviderEventKind::RecordingFailed),
        "media_track_started" => Ok(RtcProviderEventKind::MediaTrackStarted),
        "media_track_stopped" => Ok(RtcProviderEventKind::MediaTrackStopped),
        "quality_sample" => Ok(RtcProviderEventKind::QualitySample),
        "unknown" => Ok(RtcProviderEventKind::Unknown),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "event_kind",
            value: value.to_string(),
        }),
    }
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

fn str_to_query_kind(value: &str) -> RtcStorageResult<RtcProviderQueryKind> {
    match value {
        "room_online_users" => Ok(RtcProviderQueryKind::RoomOnlineUsers),
        "room_state" => Ok(RtcProviderQueryKind::RoomState),
        "media_session_state" => Ok(RtcProviderQueryKind::MediaSessionState),
        "recording_artifacts" => Ok(RtcProviderQueryKind::RecordingArtifacts),
        "quality_samples" => Ok(RtcProviderQueryKind::QualitySamples),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "query_kind",
            value: value.to_string(),
        }),
    }
}

fn provider_query_status_to_str(value: i32) -> &'static str {
    match value {
        1 => "requested",
        2 => "running",
        3 => "completed",
        4 => "failed",
        _ => "failed",
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

fn webhook_status_to_str(value: i32) -> &'static str {
    match value {
        1 => "received",
        2 => "processed",
        3 => "failed",
        4 => "ignored",
        _ => "failed",
    }
}

fn webhook_event_sort_column(field: &str) -> &'static str {
    match field {
        "provider" => "provider",
        "eventType" | "event_type" => "event_type",
        "externalEventId" | "external_event_id" => "external_event_id",
        "receivedAt" | "received_at" => "received_at",
        "status" => "status",
        _ => "uuid",
    }
}

fn provider_query_snapshot_sort_column(field: &str) -> &'static str {
    match field {
        "queryKind" | "query_kind" => "query_kind",
        "jobId" | "job_id" | "providerQueryJobId" | "provider_query_job_id" => {
            "provider_query_job_id"
        }
        "capturedAt" | "captured_at" => "captured_at",
        _ => "uuid",
    }
}

#[cfg(test)]
mod tests {
    use crate::SQLITE_SCHEMA;
    use sdkwork_communication_rtc_service::{
        RtcProviderEventKind, RtcProviderQueryKind, RtcProviderQueryResult, RtcProviderWebhookEvent,
    };
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn sqlite_repository_records_provider_webhooks_queries_and_snapshots() {
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
            sqlx::query(sqlx::AssertSqlSafe(statement))
                .execute(&pool)
                .await
                .expect("rtc sqlite schema should apply");
        }

        let repository = super::RtcSqliteProviderEventRepository::new(pool.clone());
        let webhook = webhook_event();

        let stored_webhook = repository
            .record_webhook_event(1, "100", "200", &webhook, "received")
            .await
            .expect("webhook event should persist");
        let duplicate_webhook = repository
            .record_webhook_event(2, "100", "200", &webhook, "received")
            .await
            .expect("duplicate webhook event should resolve to existing event");

        assert_eq!(stored_webhook.id, "webhook-event-1");
        assert_eq!(duplicate_webhook.id, "webhook-event-1");
        assert_eq!(stored_webhook.event_kind, RtcProviderEventKind::RoomEnded);
        assert_eq!(stored_webhook.status, "received");
        let stored_status = sqlx::query_as::<_, (i64, String)>(
            "SELECT status, typeof(status) FROM rtc_provider_webhook_event WHERE uuid = 'webhook-event-1'",
        )
        .fetch_one(&pool)
        .await
        .expect("webhook status should be readable from storage");
        assert_eq!(
            stored_status,
            (1, "integer".to_string()),
            "webhook status must be persisted as a portable numeric enum"
        );
        assert_eq!(
            stored_webhook.normalized_event["providerProfileId"],
            "profile-volcengine"
        );
        assert!(
            !stored_webhook
                .raw_payload
                .to_string()
                .contains("volc-secret-value"),
            "webhook storage should keep provider payloads after adapter normalization, not secret config"
        );

        let fetched_webhook = repository
            .get_webhook_event_by_id("webhook-event-1")
            .await
            .expect("webhook lookup should work")
            .expect("webhook should exist");
        assert_eq!(fetched_webhook.payload_hash, webhook.payload_hash);

        let query_result = query_result();
        let (query_job, snapshot) = repository
            .record_provider_query_result(10, 11, "100", "200", &query_result)
            .await
            .expect("provider query result should persist");

        assert_eq!(query_job.id, "provider-query-volcengine-room_state-room-1");
        assert_eq!(query_job.status, "completed");
        assert_eq!(
            query_job.provider_request_id.as_deref(),
            Some("GetRoomInfo")
        );
        assert_eq!(query_job.result_snapshot["status"], "synced");
        assert_eq!(
            snapshot.provider_query_job_id,
            "provider-query-volcengine-room_state-room-1"
        );
        assert_eq!(
            snapshot.snapshot_payload["providerResponse"]["roomState"],
            "ended"
        );
        assert!(
            !snapshot
                .snapshot_payload
                .to_string()
                .contains("volc-secret-value"),
            "provider query snapshots must not persist raw provider credential values"
        );

        let fetched_query_job = repository
            .get_provider_query_job_by_id("provider-query-volcengine-room_state-room-1")
            .await
            .expect("query job lookup should work")
            .expect("query job should exist");
        assert_eq!(fetched_query_job.provider, "volcengine");

        let snapshots = repository
            .list_provider_query_snapshots("provider-query-volcengine-room_state-room-1")
            .await
            .expect("query snapshots should list");
        assert_eq!(snapshots, vec![snapshot]);
    }

    #[tokio::test]
    async fn sqlite_repository_deduplicates_webhooks_without_external_event_id() {
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
            sqlx::query(sqlx::AssertSqlSafe(statement))
                .execute(&pool)
                .await
                .expect("rtc sqlite schema should apply");
        }

        let repository = super::RtcSqliteProviderEventRepository::new(pool.clone());
        let mut webhook = webhook_event();
        webhook.external_event_id = None;

        let stored_webhook = repository
            .record_webhook_event(1, "100", "200", &webhook, "received")
            .await
            .expect("webhook without provider event id should persist");
        let duplicate_webhook = repository
            .record_webhook_event(2, "100", "200", &webhook, "received")
            .await
            .expect("duplicate webhook without provider event id should resolve to existing event");

        assert_eq!(stored_webhook.id, "webhook-event-1");
        assert_eq!(duplicate_webhook.id, "webhook-event-1");
        let stored_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM rtc_provider_webhook_event WHERE payload_hash = 'fnv64:webhook'",
        )
        .fetch_one(&pool)
        .await
        .expect("webhook count should be readable");
        assert_eq!(
            stored_count, 1,
            "webhook dedupe must not rely on nullable provider external event ids"
        );
    }

    #[tokio::test]
    async fn sqlite_repository_separates_provider_query_jobs_by_query_kind() {
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
            sqlx::query(sqlx::AssertSqlSafe(statement))
                .execute(&pool)
                .await
                .expect("rtc sqlite schema should apply");
        }

        let repository = super::RtcSqliteProviderEventRepository::new(pool.clone());
        let room_state = query_result();
        let mut online_users = query_result();
        online_users.query_kind = RtcProviderQueryKind::RoomOnlineUsers;
        online_users.raw_provider_action = "GetRoomOnlineUsers".to_string();
        online_users.result_snapshot_json = serde_json::json!({
            "providerRequest": {
                "action": "GetRoomOnlineUsers",
                "roomId": "room-1"
            },
            "providerResponse": {
                "onlineUsers": ["1", "user-2"]
            }
        })
        .to_string();

        let (room_state_job, _) = repository
            .record_provider_query_result(10, 11, "100", "200", &room_state)
            .await
            .expect("room state query result should persist");
        let (online_users_job, _) = repository
            .record_provider_query_result(12, 13, "100", "200", &online_users)
            .await
            .expect("room online users query result should persist separately");

        assert_ne!(room_state_job.id, online_users_job.id);
        assert_eq!(
            room_state_job.id,
            "provider-query-volcengine-room_state-room-1"
        );
        assert_eq!(
            online_users_job.id,
            "provider-query-volcengine-room_online_users-room-1"
        );
        let stored_count =
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM rtc_provider_query_job")
                .fetch_one(&pool)
                .await
                .expect("query job count should be readable");
        assert_eq!(
            stored_count, 2,
            "provider active query jobs must preserve query kind per target"
        );
    }

    fn webhook_event() -> RtcProviderWebhookEvent {
        RtcProviderWebhookEvent {
            provider: "volcengine".to_string(),
            provider_profile_id: Some("profile-volcengine".to_string()),
            external_event_id: Some("provider-event-1".to_string()),
            event_type: "RoomEnd".to_string(),
            event_kind: RtcProviderEventKind::RoomEnded,
            room_id: Some("room-1".to_string()),
            rtc_session_id: Some("session-1".to_string()),
            provider_session_id: Some("volcengine:session-1".to_string()),
            participant_id: None,
            recording_id: Some("recording-1".to_string()),
            occurred_at: Some("2026-06-10T00:10:00.000Z".to_string()),
            received_at: "2026-06-10T00:10:01.000Z".to_string(),
            payload_hash: "fnv64:webhook".to_string(),
            signature_header: Some("signature-value".to_string()),
            raw_payload: serde_json::json!({
                "EventType": "RoomEnd",
                "RoomId": "room-1",
                "TaskId": "recording-1"
            })
            .to_string(),
            normalized_event_json: serde_json::json!({
                "provider": "volcengine",
                "eventKind": "room_ended",
                "roomId": "room-1",
                "providerProfileId": "profile-volcengine"
            })
            .to_string(),
        }
    }

    fn query_result() -> RtcProviderQueryResult {
        RtcProviderQueryResult {
            provider: "volcengine".to_string(),
            provider_profile_id: Some("profile-volcengine".to_string()),
            query_kind: RtcProviderQueryKind::RoomState,
            room_id: Some("room-1".to_string()),
            rtc_session_id: Some("session-1".to_string()),
            provider_session_id: Some("volcengine:session-1".to_string()),
            status: "synced".to_string(),
            raw_provider_action: "GetRoomInfo".to_string(),
            result_snapshot_json: serde_json::json!({
                "providerRequest": {
                    "action": "GetRoomInfo",
                    "roomId": "room-1"
                },
                "providerResponse": {
                    "roomState": "ended"
                }
            })
            .to_string(),
            next_cursor: None,
            queried_at: "2026-06-10T00:10:02.000Z".to_string(),
        }
    }
}
