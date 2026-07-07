use sdkwork_communication_rtc_service::{
    RtcMediaSessionIdempotencyClaim, RtcMediaSessionIdempotencyRecord,
};
use sqlx::{Executor, PgPool, Postgres, Row, Sqlite, SqlitePool, postgres::PgRow, sqlite::SqliteRow};

use crate::{RtcStorageError, RtcStorageResult};

#[derive(Clone, Debug)]
pub struct RtcSqliteMediaSessionIdempotencyRepository {
    pool: SqlitePool,
}

impl RtcSqliteMediaSessionIdempotencyRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn upsert_idempotency_record_with(
        &self,
        transaction: &mut sqlx::Transaction<'_, Sqlite>,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<()> {
        let row = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = ?
              AND organization_id = ?
              AND idempotency_key = ?
            LIMIT 1
            "#,
        )
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .fetch_optional(&mut **transaction)
        .await?;

        if let Some(existing) = row.map(sqlite_row_to_idempotency_record).transpose()? {
            if idempotency_payload_mismatch(
                existing.payload_hash.as_str(),
                record.payload_hash.as_str(),
            ) {
                return Err(RtcStorageError::Conflict(format!(
                    "RTC media session idempotency key reused with different payload: {}",
                    record.idempotency_key
                )));
            }
            if existing.media_session_id != record.media_session_id {
                return Err(RtcStorageError::Conflict(format!(
                    "RTC media session idempotency key reused with different session target: {}",
                    record.idempotency_key
                )));
            }
        }

        sqlx::query(
            r#"
            INSERT INTO rtc_media_session_idempotency (
                id,
                uuid,
                tenant_id,
                organization_id,
                idempotency_key,
                media_session_id,
                payload_hash,
                response_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tenant_id, organization_id, idempotency_key) DO UPDATE SET
                media_session_id = excluded.media_session_id,
                payload_hash = excluded.payload_hash,
                response_json = excluded.response_json,
                created_at = excluded.created_at
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .bind(&record.media_session_id)
        .bind(&record.payload_hash)
        .bind(&record.response_json)
        .bind(&record.created_at)
        .execute(&mut **transaction)
        .await?;

        Ok(())
    }

    pub async fn claim_idempotency_record(
        &self,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        self.claim_idempotency_record_with(&self.pool, numeric_id, record)
            .await
    }

    pub async fn claim_idempotency_record_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        let result = sqlx::query(
            r#"
            INSERT INTO rtc_media_session_idempotency (
                id,
                uuid,
                tenant_id,
                organization_id,
                idempotency_key,
                media_session_id,
                payload_hash,
                response_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tenant_id, organization_id, idempotency_key) DO NOTHING
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .bind(&record.media_session_id)
        .bind(&record.payload_hash)
        .bind(&record.response_json)
        .bind(&record.created_at)
        .execute(executor)
        .await?;

        if result.rows_affected() > 0 {
            return Ok(RtcMediaSessionIdempotencyClaim::Claimed);
        }

        let existing = self
            .resolve_idempotency_record_by_key(
                record.tenant_id.as_str(),
                record.organization_id.as_str(),
                record.idempotency_key.as_str(),
            )
            .await?
            .ok_or_else(|| {
                RtcStorageError::Conflict(
                    "RTC media session idempotency claim failed without a stored record"
                        .to_string(),
                )
            })?;
        validate_idempotency_claim_match(record, &existing)?;
        Ok(RtcMediaSessionIdempotencyClaim::Existing(existing))
    }

    pub async fn claim_idempotency_record_on_transaction(
        &self,
        transaction: &mut sqlx::Transaction<'_, Sqlite>,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        let result = sqlx::query(
            r#"
            INSERT INTO rtc_media_session_idempotency (
                id,
                uuid,
                tenant_id,
                organization_id,
                idempotency_key,
                media_session_id,
                payload_hash,
                response_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tenant_id, organization_id, idempotency_key) DO NOTHING
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .bind(&record.media_session_id)
        .bind(&record.payload_hash)
        .bind(&record.response_json)
        .bind(&record.created_at)
        .execute(&mut **transaction)
        .await?;

        if result.rows_affected() > 0 {
            return Ok(RtcMediaSessionIdempotencyClaim::Claimed);
        }

        let row = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = ?
              AND organization_id = ?
              AND idempotency_key = ?
            LIMIT 1
            "#,
        )
        .bind(parse_i64_field("tenant_id", record.tenant_id.as_str())?)
        .bind(parse_i64_field("organization_id", record.organization_id.as_str())?)
        .bind(&record.idempotency_key)
        .fetch_optional(&mut **transaction)
        .await?;
        let existing = row
            .map(sqlite_row_to_idempotency_record)
            .transpose()?
            .ok_or_else(|| {
                RtcStorageError::Conflict(
                    "RTC media session idempotency claim failed without a stored record"
                        .to_string(),
                )
            })?;
        validate_idempotency_claim_match(record, &existing)?;
        Ok(RtcMediaSessionIdempotencyClaim::Existing(existing))
    }

    pub async fn resolve_idempotency_record_by_key(
        &self,
        tenant_id: &str,
        organization_id: &str,
        idempotency_key: &str,
    ) -> RtcStorageResult<Option<RtcMediaSessionIdempotencyRecord>> {
        let row = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = ?
              AND organization_id = ?
              AND idempotency_key = ?
            LIMIT 1
            "#,
        )
        .bind(parse_i64_field("tenant_id", tenant_id)?)
        .bind(parse_i64_field("organization_id", organization_id)?)
        .bind(idempotency_key)
        .fetch_optional(&self.pool)
        .await?;

        row.map(sqlite_row_to_idempotency_record).transpose()
    }

    pub async fn list_idempotency_records_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaSessionIdempotencyRecord>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = ?
              AND organization_id = ?
            ORDER BY created_at ASC, uuid ASC
            "#,
        )
        .bind(parse_i64_field("tenant_id", tenant_id)?)
        .bind(parse_i64_field("organization_id", organization_id)?)
        .fetch_all(&self.pool)
        .await?;

        rows.into_iter()
            .map(sqlite_row_to_idempotency_record)
            .collect()
    }

    pub async fn list_hydration_idempotency_records_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcMediaSessionIdempotencyRecord>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = ?
              AND organization_id = ?
            ORDER BY created_at DESC, uuid DESC
            LIMIT ?
            "#,
        )
        .bind(parse_i64_field("tenant_id", tenant_id)?)
        .bind(parse_i64_field("organization_id", organization_id)?)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        rows.into_iter()
            .map(sqlite_row_to_idempotency_record)
            .collect()
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresMediaSessionIdempotencyRepository {
    pool: PgPool,
}

impl RtcPostgresMediaSessionIdempotencyRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn upsert_idempotency_record_with(
        &self,
        transaction: &mut sqlx::Transaction<'_, Postgres>,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<()> {
        let row = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = $1
              AND organization_id = $2
              AND idempotency_key = $3
            LIMIT 1
            "#,
        )
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .fetch_optional(&mut **transaction)
        .await?;

        if let Some(existing) = row.map(postgres_row_to_idempotency_record).transpose()? {
            if idempotency_payload_mismatch(
                existing.payload_hash.as_str(),
                record.payload_hash.as_str(),
            ) {
                return Err(RtcStorageError::Conflict(format!(
                    "RTC media session idempotency key reused with different payload: {}",
                    record.idempotency_key
                )));
            }
            if existing.media_session_id != record.media_session_id {
                return Err(RtcStorageError::Conflict(format!(
                    "RTC media session idempotency key reused with different session target: {}",
                    record.idempotency_key
                )));
            }
        }

        sqlx::query(
            r#"
            INSERT INTO rtc_media_session_idempotency (
                id,
                uuid,
                tenant_id,
                organization_id,
                idempotency_key,
                media_session_id,
                payload_hash,
                response_json,
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
                $9::text::timestamp
            )
            ON CONFLICT (tenant_id, organization_id, idempotency_key) DO UPDATE SET
                media_session_id = EXCLUDED.media_session_id,
                payload_hash = EXCLUDED.payload_hash,
                response_json = EXCLUDED.response_json,
                created_at = EXCLUDED.created_at
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .bind(&record.media_session_id)
        .bind(&record.payload_hash)
        .bind(&record.response_json)
        .bind(&record.created_at)
        .execute(&mut **transaction)
        .await?;

        Ok(())
    }

    pub async fn claim_idempotency_record(
        &self,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        self.claim_idempotency_record_with(&self.pool, numeric_id, record)
            .await
    }

    pub async fn claim_idempotency_record_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim>
    where
        E: Executor<'e, Database = Postgres>,
    {
        let result = sqlx::query(
            r#"
            INSERT INTO rtc_media_session_idempotency (
                id,
                uuid,
                tenant_id,
                organization_id,
                idempotency_key,
                media_session_id,
                payload_hash,
                response_json,
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
                $9::text::timestamp
            )
            ON CONFLICT (tenant_id, organization_id, idempotency_key) DO NOTHING
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .bind(&record.media_session_id)
        .bind(&record.payload_hash)
        .bind(&record.response_json)
        .bind(&record.created_at)
        .execute(executor)
        .await?;

        if result.rows_affected() > 0 {
            return Ok(RtcMediaSessionIdempotencyClaim::Claimed);
        }

        let existing = self
            .resolve_idempotency_record_by_key(
                record.tenant_id.as_str(),
                record.organization_id.as_str(),
                record.idempotency_key.as_str(),
            )
            .await?
            .ok_or_else(|| {
                RtcStorageError::Conflict(
                    "RTC media session idempotency claim failed without a stored record"
                        .to_string(),
                )
            })?;
        validate_idempotency_claim_match(record, &existing)?;
        Ok(RtcMediaSessionIdempotencyClaim::Existing(existing))
    }

    pub async fn claim_idempotency_record_on_transaction(
        &self,
        transaction: &mut sqlx::Transaction<'_, Postgres>,
        numeric_id: i64,
        record: &RtcMediaSessionIdempotencyRecord,
    ) -> RtcStorageResult<RtcMediaSessionIdempotencyClaim> {
        let result = sqlx::query(
            r#"
            INSERT INTO rtc_media_session_idempotency (
                id,
                uuid,
                tenant_id,
                organization_id,
                idempotency_key,
                media_session_id,
                payload_hash,
                response_json,
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
                $9::text::timestamp
            )
            ON CONFLICT (tenant_id, organization_id, idempotency_key) DO NOTHING
            "#,
        )
        .bind(numeric_id)
        .bind(&record.id)
        .bind(parse_i64_field("tenant_id", &record.tenant_id)?)
        .bind(parse_i64_field("organization_id", &record.organization_id)?)
        .bind(&record.idempotency_key)
        .bind(&record.media_session_id)
        .bind(&record.payload_hash)
        .bind(&record.response_json)
        .bind(&record.created_at)
        .execute(&mut **transaction)
        .await?;

        if result.rows_affected() > 0 {
            return Ok(RtcMediaSessionIdempotencyClaim::Claimed);
        }

        let row = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = $1
              AND organization_id = $2
              AND idempotency_key = $3
            LIMIT 1
            "#,
        )
        .bind(parse_i64_field("tenant_id", record.tenant_id.as_str())?)
        .bind(parse_i64_field("organization_id", record.organization_id.as_str())?)
        .bind(&record.idempotency_key)
        .fetch_optional(&mut **transaction)
        .await?;
        let existing = row
            .map(postgres_row_to_idempotency_record)
            .transpose()?
            .ok_or_else(|| {
                RtcStorageError::Conflict(
                    "RTC media session idempotency claim failed without a stored record"
                        .to_string(),
                )
            })?;
        validate_idempotency_claim_match(record, &existing)?;
        Ok(RtcMediaSessionIdempotencyClaim::Existing(existing))
    }

    pub async fn resolve_idempotency_record_by_key(
        &self,
        tenant_id: &str,
        organization_id: &str,
        idempotency_key: &str,
    ) -> RtcStorageResult<Option<RtcMediaSessionIdempotencyRecord>> {
        let row = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = $1
              AND organization_id = $2
              AND idempotency_key = $3
            LIMIT 1
            "#,
        )
        .bind(parse_i64_field("tenant_id", tenant_id)?)
        .bind(parse_i64_field("organization_id", organization_id)?)
        .bind(idempotency_key)
        .fetch_optional(&self.pool)
        .await?;

        row.map(postgres_row_to_idempotency_record).transpose()
    }

    pub async fn list_idempotency_records_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcMediaSessionIdempotencyRecord>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = $1
              AND organization_id = $2
            ORDER BY created_at ASC, uuid ASC
            "#,
        )
        .bind(parse_i64_field("tenant_id", tenant_id)?)
        .bind(parse_i64_field("organization_id", organization_id)?)
        .fetch_all(&self.pool)
        .await?;

        rows.into_iter()
            .map(postgres_row_to_idempotency_record)
            .collect()
    }

    pub async fn list_hydration_idempotency_records_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcMediaSessionIdempotencyRecord>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, idempotency_key, media_session_id, payload_hash, response_json, created_at
            FROM rtc_media_session_idempotency
            WHERE tenant_id = $1
              AND organization_id = $2
            ORDER BY created_at DESC, uuid DESC
            LIMIT $3
            "#,
        )
        .bind(parse_i64_field("tenant_id", tenant_id)?)
        .bind(parse_i64_field("organization_id", organization_id)?)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        rows.into_iter()
            .map(postgres_row_to_idempotency_record)
            .collect()
    }
}

fn idempotency_payload_mismatch(stored_hash: &str, incoming_hash: &str) -> bool {
    !stored_hash.is_empty() && !incoming_hash.is_empty() && stored_hash != incoming_hash
}

fn validate_idempotency_claim_match(
    record: &RtcMediaSessionIdempotencyRecord,
    existing: &RtcMediaSessionIdempotencyRecord,
) -> RtcStorageResult<()> {
    if idempotency_payload_mismatch(
        existing.payload_hash.as_str(),
        record.payload_hash.as_str(),
    ) {
        return Err(RtcStorageError::Conflict(format!(
            "RTC media session idempotency key reused with different payload: {}",
            record.idempotency_key
        )));
    }
    if existing.media_session_id != record.media_session_id {
        return Err(RtcStorageError::Conflict(format!(
            "RTC media session idempotency key reused with different session target: {}",
            record.idempotency_key
        )));
    }
    Ok(())
}

fn sqlite_row_to_idempotency_record(
    row: SqliteRow,
) -> RtcStorageResult<RtcMediaSessionIdempotencyRecord> {
    Ok(RtcMediaSessionIdempotencyRecord {
        id: row.try_get("uuid")?,
        tenant_id: row.try_get::<i64, _>("tenant_id")?.to_string(),
        organization_id: row.try_get::<i64, _>("organization_id")?.to_string(),
        idempotency_key: row.try_get("idempotency_key")?,
        media_session_id: row.try_get("media_session_id")?,
        payload_hash: row.try_get("payload_hash")?,
        response_json: row.try_get("response_json").unwrap_or_default(),
        created_at: row.try_get("created_at")?,
    })
}

fn postgres_row_to_idempotency_record(
    row: PgRow,
) -> RtcStorageResult<RtcMediaSessionIdempotencyRecord> {
    Ok(RtcMediaSessionIdempotencyRecord {
        id: row.try_get("uuid")?,
        tenant_id: row.try_get::<i64, _>("tenant_id")?.to_string(),
        organization_id: row.try_get::<i64, _>("organization_id")?.to_string(),
        idempotency_key: row.try_get("idempotency_key")?,
        media_session_id: row.try_get("media_session_id")?,
        payload_hash: row.try_get("payload_hash")?,
        response_json: row.try_get("response_json").unwrap_or_default(),
        created_at: row.try_get("created_at")?,
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
