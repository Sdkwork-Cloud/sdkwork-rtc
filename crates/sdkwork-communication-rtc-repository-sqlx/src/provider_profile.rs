use sdkwork_communication_rtc_service::{
    RtcActiveProviderProfile, RtcProviderCapabilitySnapshot, RtcProviderHealthStatus,
    RtcProviderProfile, RtcProviderProfileStatus, RtcProviderProfileVerification,
};
use serde::de::DeserializeOwned;
use serde_json::Value as JsonValue;
use sqlx::{
    Executor, PgPool, Postgres, Row, Sqlite, SqlitePool, postgres::PgRow, sqlite::SqliteRow,
};

use crate::{RtcStorageError, RtcStorageResult};

#[derive(Clone, Debug)]
pub struct RtcSqliteProviderProfileRepository {
    pool: SqlitePool,
}

impl RtcSqliteProviderProfileRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn upsert_provider_profile(
        &self,
        numeric_id: i64,
        profile: &RtcProviderProfile,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_profile_with(&self.pool, numeric_id, profile)
            .await
    }

    pub async fn upsert_provider_profile_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        profile: &RtcProviderProfile,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        let capability_snapshot = serialize_json(&profile.capabilities)?;
        let config_snapshot = serialize_json(&profile.config_snapshot)?;

        sqlx::query(sqlite_upsert_provider_profile_sql())
            .bind(numeric_id)
            .bind(&profile.id)
            .bind(parse_i64_field("tenant_id", &profile.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &profile.organization_id,
            )?)
            .bind(&profile.provider)
            .bind(&profile.code)
            .bind(&profile.name)
            .bind(provider_profile_status_to_i32(&profile.status))
            .bind(bool_to_i64(profile.is_default))
            .bind(profile.priority)
            .bind(&profile.environment)
            .bind(&profile.region)
            .bind(&profile.provider_app_id)
            .bind(&profile.endpoint)
            .bind(&profile.credential_ref)
            .bind(&profile.credential_fingerprint)
            .bind(&profile.webhook_secret_ref)
            .bind(&profile.webhook_secret_fingerprint)
            .bind(capability_snapshot)
            .bind(config_snapshot)
            .bind(provider_health_status_to_i32(&profile.health_status))
            .bind(&profile.last_verified_at)
            .bind(profile.last_verification_latency_ms.map(u32_to_i64))
            .bind(&profile.last_verification_error)
            .bind(option_string_to_i64(
                "created_by",
                profile.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                profile.updated_by.as_deref(),
            )?)
            .bind(
                profile
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                profile
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &profile.version)?)
            .bind(&profile.deleted_at)
            .bind(option_string_to_i64(
                "deleted_by",
                profile.deleted_by.as_deref(),
            )?)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn get_provider_profile_by_id(
        &self,
        provider_profile_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderProfile>> {
        let sql = provider_profile_select_columns_sql("WHERE uuid = ?", "");
        let row = sqlx::query(&sql)
            .bind(provider_profile_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_provider_profile).transpose()
    }

    pub async fn list_provider_profiles(
        &self,
        tenant_id: &str,
        organization_id: &str,
        code: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcProviderProfile>> {
        let sql = provider_profile_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND (? IS NULL OR code = ?)
            "#,
            "ORDER BY is_default DESC, priority ASC, provider ASC, code ASC",
        );
        let query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(code)
            .bind(code);

        let rows = query.fetch_all(&self.pool).await?;
        rows.into_iter()
            .map(sqlite_row_to_provider_profile)
            .collect()
    }

    pub async fn list_hydration_provider_profiles_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderProfile>> {
        let sql = provider_profile_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND deleted_at IS NULL
            "#,
            "ORDER BY updated_at DESC, id DESC LIMIT ?",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter()
            .map(sqlite_row_to_provider_profile)
            .collect()
    }

    pub async fn list_active_provider_profiles(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcActiveProviderProfile>> {
        let sql = provider_profile_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND status = 1
              AND deleted_at IS NULL
              AND (? IS NULL OR provider = ?)
            "#,
            "ORDER BY is_default DESC, priority ASC, provider ASC, code ASC",
        );
        let query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider)
            .bind(provider);

        let rows = query.fetch_all(&self.pool).await?;
        rows.into_iter()
            .map(sqlite_row_to_provider_profile)
            .map(|result| result.map(|profile| profile.active_projection()))
            .collect()
    }

    pub async fn list_provider_profiles_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderProfile>> {
        let mut where_parts = vec![
            "tenant_id = ?".to_string(),
            "organization_id = ?".to_string(),
            "deleted_at IS NULL".to_string(),
        ];
        if provider.is_some() {
            where_parts.push("provider = ?".to_string());
        }
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            where_parts.push(
                "(LOWER(uuid) LIKE ? OR LOWER(code) LIKE ? OR LOWER(name) LIKE ? OR LOWER(provider) LIKE ?)"
                    .to_string(),
            );
        }
        let order_column = provider_profile_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = provider_profile_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!("ORDER BY {order_column} {direction}, id ASC LIMIT ? OFFSET ?"),
        );
        let mut query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(provider) = provider {
            query = query.bind(provider);
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
            .map(sqlite_row_to_provider_profile)
            .collect()
    }

    pub async fn list_active_provider_profiles_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcActiveProviderProfile>> {
        let mut where_parts = vec![
            "tenant_id = ?".to_string(),
            "organization_id = ?".to_string(),
            "status = 1".to_string(),
            "deleted_at IS NULL".to_string(),
        ];
        if provider.is_some() {
            where_parts.push("provider = ?".to_string());
        }
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            where_parts.push(
                "(LOWER(uuid) LIKE ? OR LOWER(code) LIKE ? OR LOWER(name) LIKE ? OR LOWER(provider) LIKE ?)"
                    .to_string(),
            );
        }
        let order_column = provider_profile_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = provider_profile_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!("ORDER BY {order_column} {direction}, id ASC LIMIT ? OFFSET ?"),
        );
        let mut query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(provider) = provider {
            query = query.bind(provider);
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
            .map(sqlite_row_to_provider_profile)
            .map(|result| result.map(|profile| profile.active_projection()))
            .collect()
    }

    pub async fn disable_provider_profile(
        &self,
        provider_profile_id: &str,
        reason: Option<&str>,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderProfile> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_profile
            SET
                status = 2,
                is_default = 0,
                last_verification_error = COALESCE(?, last_verification_error),
                updated_by = ?,
                updated_at = ?,
                version = version + 1
            WHERE uuid = ?
            "#,
        )
        .bind(reason)
        .bind(option_string_to_i64("updated_by", updated_by)?)
        .bind(updated_at)
        .bind(provider_profile_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_profile_updated(result.rows_affected(), provider_profile_id)?;
        self.get_provider_profile_by_id(provider_profile_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderProfile {
                provider_profile_id: provider_profile_id.to_string(),
            })
    }

    pub async fn record_provider_profile_verification(
        &self,
        verification: &RtcProviderProfileVerification,
    ) -> RtcStorageResult<RtcProviderProfile> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_profile
            SET
                health_status = ?,
                last_verified_at = ?,
                last_verification_latency_ms = ?,
                last_verification_error = ?,
                updated_at = ?,
                version = version + 1
            WHERE uuid = ?
            "#,
        )
        .bind(provider_health_status_to_i32(&verification.status))
        .bind(&verification.verified_at)
        .bind(verification.latency_ms.map(u32_to_i64))
        .bind(&verification.error)
        .bind(&verification.verified_at)
        .bind(&verification.provider_profile_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_profile_updated(result.rows_affected(), &verification.provider_profile_id)?;
        self.get_provider_profile_by_id(&verification.provider_profile_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderProfile {
                provider_profile_id: verification.provider_profile_id.clone(),
            })
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresProviderProfileRepository {
    pool: PgPool,
}

impl RtcPostgresProviderProfileRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn upsert_provider_profile(
        &self,
        numeric_id: i64,
        profile: &RtcProviderProfile,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_profile_with(&self.pool, numeric_id, profile)
            .await
    }

    pub async fn upsert_provider_profile_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        profile: &RtcProviderProfile,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_provider_profile_sql())
            .bind(numeric_id)
            .bind(&profile.id)
            .bind(parse_i64_field("tenant_id", &profile.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &profile.organization_id,
            )?)
            .bind(&profile.provider)
            .bind(&profile.code)
            .bind(&profile.name)
            .bind(provider_profile_status_to_i32(&profile.status))
            .bind(profile.is_default)
            .bind(profile.priority)
            .bind(&profile.environment)
            .bind(&profile.region)
            .bind(&profile.provider_app_id)
            .bind(&profile.endpoint)
            .bind(&profile.credential_ref)
            .bind(&profile.credential_fingerprint)
            .bind(&profile.webhook_secret_ref)
            .bind(&profile.webhook_secret_fingerprint)
            .bind(sqlx::types::Json(profile.capabilities.clone()))
            .bind(sqlx::types::Json(profile.config_snapshot.clone()))
            .bind(provider_health_status_to_i32(&profile.health_status))
            .bind(&profile.last_verified_at)
            .bind(profile.last_verification_latency_ms.map(u32_to_i32))
            .bind(&profile.last_verification_error)
            .bind(option_string_to_i64(
                "created_by",
                profile.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                profile.updated_by.as_deref(),
            )?)
            .bind(
                profile
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                profile
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &profile.version)?)
            .bind(&profile.deleted_at)
            .bind(option_string_to_i64(
                "deleted_by",
                profile.deleted_by.as_deref(),
            )?)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn get_provider_profile_by_id(
        &self,
        provider_profile_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderProfile>> {
        let sql = postgres_provider_profile_select_columns_sql("WHERE uuid = $1", "");
        let row = sqlx::query(&sql)
            .bind(provider_profile_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_provider_profile).transpose()
    }

    pub async fn list_provider_profiles(
        &self,
        tenant_id: &str,
        organization_id: &str,
        code: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcProviderProfile>> {
        let sql = postgres_provider_profile_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND ($3::text IS NULL OR code = $4)
            "#,
            "ORDER BY is_default DESC, priority ASC, provider ASC, code ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(code)
            .bind(code)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_profile)
            .collect()
    }

    pub async fn list_hydration_provider_profiles_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderProfile>> {
        let sql = postgres_provider_profile_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND deleted_at IS NULL
            "#,
            "ORDER BY updated_at DESC, id DESC LIMIT $3",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter()
            .map(postgres_row_to_provider_profile)
            .collect()
    }

    pub async fn list_active_provider_profiles(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcActiveProviderProfile>> {
        let sql = postgres_provider_profile_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND status = 1
              AND deleted_at IS NULL
              AND ($3::text IS NULL OR provider = $4)
            "#,
            "ORDER BY is_default DESC, priority ASC, provider ASC, code ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider)
            .bind(provider)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_profile)
            .map(|result| result.map(|profile| profile.active_projection()))
            .collect()
    }

    pub async fn list_provider_profiles_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderProfile>> {
        let mut where_parts = vec![
            "tenant_id = $1".to_string(),
            "organization_id = $2".to_string(),
            "deleted_at IS NULL".to_string(),
        ];
        let mut next_param = 3usize;
        if provider.is_some() {
            let param = format!("${next_param}");
            next_param += 1;
            where_parts.push(format!("provider = {param}"));
        }
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            let start = next_param;
            where_parts.push(format!(
                "(LOWER(uuid) LIKE ${start} OR LOWER(code) LIKE ${} OR LOWER(name) LIKE ${} OR LOWER(provider) LIKE ${})",
                start + 1,
                start + 2,
                start + 3
            ));
            next_param += 4;
        }
        let limit_param = format!("${next_param}");
        let offset_param = format!("${}", next_param + 1);
        let order_column = provider_profile_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = postgres_provider_profile_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!(
                "ORDER BY {order_column} {direction}, id ASC LIMIT {limit_param} OFFSET {offset_param}"
            ),
        );
        let mut query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(provider) = provider {
            query = query.bind(provider);
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
            .map(postgres_row_to_provider_profile)
            .collect()
    }

    pub async fn list_active_provider_profiles_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcActiveProviderProfile>> {
        let mut where_parts = vec![
            "tenant_id = $1".to_string(),
            "organization_id = $2".to_string(),
            "status = 1".to_string(),
            "deleted_at IS NULL".to_string(),
        ];
        let mut next_param = 3usize;
        if provider.is_some() {
            let param = format!("${next_param}");
            next_param += 1;
            where_parts.push(format!("provider = {param}"));
        }
        let needle = q
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{}%", value.to_ascii_lowercase()));
        if needle.is_some() {
            let start = next_param;
            where_parts.push(format!(
                "(LOWER(uuid) LIKE ${start} OR LOWER(code) LIKE ${} OR LOWER(name) LIKE ${} OR LOWER(provider) LIKE ${})",
                start + 1,
                start + 2,
                start + 3
            ));
            next_param += 4;
        }
        let limit_param = format!("${next_param}");
        let offset_param = format!("${}", next_param + 1);
        let order_column = provider_profile_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = postgres_provider_profile_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!(
                "ORDER BY {order_column} {direction}, id ASC LIMIT {limit_param} OFFSET {offset_param}"
            ),
        );
        let mut query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
        if let Some(provider) = provider {
            query = query.bind(provider);
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
            .map(postgres_row_to_provider_profile)
            .map(|result| result.map(|profile| profile.active_projection()))
            .collect()
    }

    pub async fn disable_provider_profile(
        &self,
        provider_profile_id: &str,
        reason: Option<&str>,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderProfile> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_profile
            SET
                status = 2,
                is_default = FALSE,
                last_verification_error = COALESCE($1, last_verification_error),
                updated_by = $2,
                updated_at = $3::text::timestamp,
                version = version + 1
            WHERE uuid = $4
            "#,
        )
        .bind(reason)
        .bind(option_string_to_i64("updated_by", updated_by)?)
        .bind(updated_at)
        .bind(provider_profile_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_profile_updated(result.rows_affected(), provider_profile_id)?;
        self.get_provider_profile_by_id(provider_profile_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderProfile {
                provider_profile_id: provider_profile_id.to_string(),
            })
    }

    pub async fn record_provider_profile_verification(
        &self,
        verification: &RtcProviderProfileVerification,
    ) -> RtcStorageResult<RtcProviderProfile> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_profile
            SET
                health_status = $1,
                last_verified_at = $2::text::timestamp,
                last_verification_latency_ms = $3,
                last_verification_error = $4,
                updated_at = $5::text::timestamp,
                version = version + 1
            WHERE uuid = $6
            "#,
        )
        .bind(provider_health_status_to_i32(&verification.status))
        .bind(&verification.verified_at)
        .bind(verification.latency_ms.map(u32_to_i32))
        .bind(&verification.error)
        .bind(&verification.verified_at)
        .bind(&verification.provider_profile_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_profile_updated(result.rows_affected(), &verification.provider_profile_id)?;
        self.get_provider_profile_by_id(&verification.provider_profile_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderProfile {
                provider_profile_id: verification.provider_profile_id.clone(),
            })
    }
}

fn sqlite_upsert_provider_profile_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_profile (
        id,
        uuid,
        tenant_id,
        organization_id,
        provider,
        code,
        name,
        status,
        is_default,
        priority,
        environment,
        region,
        provider_app_id,
        endpoint,
        credential_ref,
        credential_fingerprint,
        webhook_secret_ref,
        webhook_secret_fingerprint,
        capability_snapshot,
        config_snapshot,
        health_status,
        last_verified_at,
        last_verification_latency_ms,
        last_verification_error,
        created_by,
        updated_by,
        created_at,
        updated_at,
        version,
        deleted_at,
        deleted_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(tenant_id, organization_id, provider, code) DO UPDATE SET
        uuid = excluded.uuid,
        name = excluded.name,
        status = excluded.status,
        is_default = excluded.is_default,
        priority = excluded.priority,
        environment = excluded.environment,
        region = excluded.region,
        provider_app_id = excluded.provider_app_id,
        endpoint = excluded.endpoint,
        credential_ref = excluded.credential_ref,
        credential_fingerprint = excluded.credential_fingerprint,
        webhook_secret_ref = excluded.webhook_secret_ref,
        webhook_secret_fingerprint = excluded.webhook_secret_fingerprint,
        capability_snapshot = excluded.capability_snapshot,
        config_snapshot = excluded.config_snapshot,
        health_status = excluded.health_status,
        last_verified_at = excluded.last_verified_at,
        last_verification_latency_ms = excluded.last_verification_latency_ms,
        last_verification_error = excluded.last_verification_error,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_profile.version + 1,
        deleted_at = excluded.deleted_at,
        deleted_by = excluded.deleted_by
    "#
}

fn postgres_upsert_provider_profile_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_profile (
        id,
        uuid,
        tenant_id,
        organization_id,
        provider,
        code,
        name,
        status,
        is_default,
        priority,
        environment,
        region,
        provider_app_id,
        endpoint,
        credential_ref,
        credential_fingerprint,
        webhook_secret_ref,
        webhook_secret_fingerprint,
        capability_snapshot,
        config_snapshot,
        health_status,
        last_verified_at,
        last_verification_latency_ms,
        last_verification_error,
        created_by,
        updated_by,
        created_at,
        updated_at,
        version,
        deleted_at,
        deleted_by
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
        $20,
        $21,
        NULLIF($22::text, '')::timestamp,
        $23,
        $24,
        $25,
        $26,
        $27::text::timestamp,
        $28::text::timestamp,
        $29,
        NULLIF($30::text, '')::timestamp,
        $31
    )
    ON CONFLICT(tenant_id, organization_id, provider, code) DO UPDATE SET
        uuid = excluded.uuid,
        name = excluded.name,
        status = excluded.status,
        is_default = excluded.is_default,
        priority = excluded.priority,
        environment = excluded.environment,
        region = excluded.region,
        provider_app_id = excluded.provider_app_id,
        endpoint = excluded.endpoint,
        credential_ref = excluded.credential_ref,
        credential_fingerprint = excluded.credential_fingerprint,
        webhook_secret_ref = excluded.webhook_secret_ref,
        webhook_secret_fingerprint = excluded.webhook_secret_fingerprint,
        capability_snapshot = excluded.capability_snapshot,
        config_snapshot = excluded.config_snapshot,
        health_status = excluded.health_status,
        last_verified_at = excluded.last_verified_at,
        last_verification_latency_ms = excluded.last_verification_latency_ms,
        last_verification_error = excluded.last_verification_error,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_profile.version + 1,
        deleted_at = excluded.deleted_at,
        deleted_by = excluded.deleted_by
    "#
}

fn provider_profile_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider,
            code,
            name,
            status,
            is_default,
            priority,
            environment,
            region,
            provider_app_id,
            endpoint,
            credential_ref,
            credential_fingerprint,
            webhook_secret_ref,
            webhook_secret_fingerprint,
            capability_snapshot,
            config_snapshot,
            health_status,
            last_verified_at,
            last_verification_latency_ms,
            last_verification_error,
            created_by,
            updated_by,
            created_at,
            updated_at,
            version,
            deleted_at,
            deleted_by
        FROM rtc_provider_profile
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_provider_profile_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider,
            code,
            name,
            status,
            is_default,
            priority,
            environment,
            region,
            provider_app_id,
            endpoint,
            credential_ref,
            credential_fingerprint,
            webhook_secret_ref,
            webhook_secret_fingerprint,
            capability_snapshot,
            config_snapshot,
            health_status,
            to_char(last_verified_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_verified_at,
            last_verification_latency_ms,
            last_verification_error,
            created_by,
            updated_by,
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
            to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at,
            version,
            to_char(deleted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS deleted_at,
            deleted_by
        FROM rtc_provider_profile
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_row_to_provider_profile(row: SqliteRow) -> RtcStorageResult<RtcProviderProfile> {
    let status: i32 = row.try_get("status")?;
    let health_status: i32 = row.try_get("health_status")?;
    let is_default: i64 = row.try_get("is_default")?;
    let version: i64 = row.try_get("version")?;

    Ok(RtcProviderProfile {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        code: row.try_get("code")?,
        name: row.try_get("name")?,
        status: i32_to_provider_profile_status(status)?,
        is_default: is_default != 0,
        priority: row.try_get("priority")?,
        environment: row.try_get("environment")?,
        region: row.try_get("region")?,
        provider_app_id: row.try_get("provider_app_id")?,
        endpoint: row.try_get("endpoint")?,
        credential_ref: row.try_get("credential_ref")?,
        credential_fingerprint: row.try_get("credential_fingerprint")?,
        webhook_secret_ref: row.try_get("webhook_secret_ref")?,
        webhook_secret_fingerprint: row.try_get("webhook_secret_fingerprint")?,
        capabilities: deserialize_json_text(row.try_get("capability_snapshot")?)?,
        config_snapshot: deserialize_json_text(row.try_get("config_snapshot")?)?,
        health_status: i32_to_provider_health_status(health_status)?,
        last_verified_at: row.try_get("last_verified_at")?,
        last_verification_latency_ms: sqlite_optional_i64_column_to_u32(
            &row,
            "last_verification_latency_ms",
        )?,
        last_verification_error: row.try_get("last_verification_error")?,
        created_by: sqlite_optional_i64_column_to_string(&row, "created_by")?,
        updated_by: sqlite_optional_i64_column_to_string(&row, "updated_by")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
        version: version.to_string(),
        deleted_at: row.try_get("deleted_at")?,
        deleted_by: sqlite_optional_i64_column_to_string(&row, "deleted_by")?,
    })
}

fn postgres_row_to_provider_profile(row: PgRow) -> RtcStorageResult<RtcProviderProfile> {
    let status: i32 = row.try_get("status")?;
    let health_status: i32 = row.try_get("health_status")?;
    let version: i64 = row.try_get("version")?;
    let capabilities: sqlx::types::Json<RtcProviderCapabilitySnapshot> =
        row.try_get("capability_snapshot")?;
    let config_snapshot: sqlx::types::Json<JsonValue> = row.try_get("config_snapshot")?;

    Ok(RtcProviderProfile {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        code: row.try_get("code")?,
        name: row.try_get("name")?,
        status: i32_to_provider_profile_status(status)?,
        is_default: row.try_get("is_default")?,
        priority: row.try_get("priority")?,
        environment: row.try_get("environment")?,
        region: row.try_get("region")?,
        provider_app_id: row.try_get("provider_app_id")?,
        endpoint: row.try_get("endpoint")?,
        credential_ref: row.try_get("credential_ref")?,
        credential_fingerprint: row.try_get("credential_fingerprint")?,
        webhook_secret_ref: row.try_get("webhook_secret_ref")?,
        webhook_secret_fingerprint: row.try_get("webhook_secret_fingerprint")?,
        capabilities: capabilities.0,
        config_snapshot: config_snapshot.0,
        health_status: i32_to_provider_health_status(health_status)?,
        last_verified_at: row.try_get("last_verified_at")?,
        last_verification_latency_ms: postgres_optional_i32_column_to_u32(
            &row,
            "last_verification_latency_ms",
        )?,
        last_verification_error: row.try_get("last_verification_error")?,
        created_by: postgres_optional_i64_column_to_string(&row, "created_by")?,
        updated_by: postgres_optional_i64_column_to_string(&row, "updated_by")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
        version: version.to_string(),
        deleted_at: row.try_get("deleted_at")?,
        deleted_by: postgres_optional_i64_column_to_string(&row, "deleted_by")?,
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

fn ensure_provider_profile_updated(
    rows_affected: u64,
    provider_profile_id: &str,
) -> RtcStorageResult<()> {
    if rows_affected == 0 {
        return Err(RtcStorageError::MissingProviderProfile {
            provider_profile_id: provider_profile_id.to_string(),
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

fn option_string_to_i64(field: &'static str, value: Option<&str>) -> RtcStorageResult<Option<i64>> {
    value.map(|inner| parse_i64_field(field, inner)).transpose()
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

fn sqlite_i64_column_to_string(row: &SqliteRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn sqlite_optional_i64_column_to_u32(
    row: &SqliteRow,
    column: &'static str,
) -> RtcStorageResult<Option<u32>> {
    let value: Option<i64> = row.try_get(column)?;
    Ok(value.and_then(|inner| u32::try_from(inner).ok()))
}

fn sqlite_optional_i64_column_to_string(
    row: &SqliteRow,
    column: &'static str,
) -> RtcStorageResult<Option<String>> {
    let value: Option<i64> = row.try_get(column)?;
    Ok(value.map(|inner| inner.to_string()))
}

fn postgres_i64_column_to_string(row: &PgRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn postgres_optional_i32_column_to_u32(
    row: &PgRow,
    column: &'static str,
) -> RtcStorageResult<Option<u32>> {
    let value: Option<i32> = row.try_get(column)?;
    Ok(value.and_then(|inner| u32::try_from(inner).ok()))
}

fn postgres_optional_i64_column_to_string(
    row: &PgRow,
    column: &'static str,
) -> RtcStorageResult<Option<String>> {
    let value: Option<i64> = row.try_get(column)?;
    Ok(value.map(|inner| inner.to_string()))
}

fn provider_profile_status_to_i32(value: &RtcProviderProfileStatus) -> i32 {
    match value {
        RtcProviderProfileStatus::Active => 1,
        RtcProviderProfileStatus::Disabled => 2,
        RtcProviderProfileStatus::Archived => 3,
    }
}

fn i32_to_provider_profile_status(value: i32) -> RtcStorageResult<RtcProviderProfileStatus> {
    match value {
        1 => Ok(RtcProviderProfileStatus::Active),
        2 => Ok(RtcProviderProfileStatus::Disabled),
        3 => Ok(RtcProviderProfileStatus::Archived),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "status",
            value: value.to_string(),
        }),
    }
}

fn provider_health_status_to_i32(value: &RtcProviderHealthStatus) -> i32 {
    match value {
        RtcProviderHealthStatus::Unknown => 0,
        RtcProviderHealthStatus::Healthy => 1,
        RtcProviderHealthStatus::Degraded => 2,
        RtcProviderHealthStatus::Unhealthy => 3,
    }
}

fn i32_to_provider_health_status(value: i32) -> RtcStorageResult<RtcProviderHealthStatus> {
    match value {
        0 => Ok(RtcProviderHealthStatus::Unknown),
        1 => Ok(RtcProviderHealthStatus::Healthy),
        2 => Ok(RtcProviderHealthStatus::Degraded),
        3 => Ok(RtcProviderHealthStatus::Unhealthy),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "health_status",
            value: value.to_string(),
        }),
    }
}

fn provider_profile_sort_column(field: &str) -> &'static str {
    match field {
        "name" => "name",
        "code" => "code",
        "provider" => "provider",
        "priority" => "priority",
        "isDefault" | "is_default" => "is_default",
        _ => "uuid",
    }
}

#[cfg(test)]
mod tests {
    use crate::SQLITE_SCHEMA;
    use sdkwork_communication_rtc_service::{
        RtcProviderCapabilitySnapshot, RtcProviderHealthStatus, RtcProviderProfile,
        RtcProviderProfileStatus, RtcProviderProfileVerification,
    };
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn sqlite_repository_manages_multiple_provider_profiles_and_safe_active_projection() {
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

        let repository = super::RtcSqliteProviderProfileRepository::new(pool.clone());

        repository
            .upsert_provider_profile(
                1,
                &provider_profile("profile-volcengine", "volcengine", true, 10),
            )
            .await
            .expect("volcengine profile should persist");
        repository
            .upsert_provider_profile(
                2,
                &provider_profile("profile-tencent", "tencent", false, 20),
            )
            .await
            .expect("tencent profile should persist");
        repository
            .upsert_provider_profile(3, &provider_profile("profile-agora", "agora", false, 30))
            .await
            .expect("agora profile should persist");

        let stored = repository
            .get_provider_profile_by_id("profile-volcengine")
            .await
            .expect("profile lookup should work")
            .expect("profile should exist");
        assert_eq!(stored.provider, "volcengine");
        assert_eq!(
            stored.credential_ref.as_deref(),
            Some("secret://rtc/volcengine/default")
        );
        assert_eq!(
            stored.webhook_secret_ref.as_deref(),
            Some("secret://rtc/volcengine/webhook")
        );
        assert!(stored.capabilities.audio);
        assert_eq!(stored.config_snapshot["tokenTtlSeconds"], 3600);

        let active_profiles = repository
            .list_active_provider_profiles("100", "200", None)
            .await
            .expect("active provider profile lookup should work");
        assert_eq!(
            active_profiles
                .iter()
                .map(|profile| profile.id.as_str())
                .collect::<Vec<_>>(),
            vec!["profile-volcengine", "profile-tencent", "profile-agora"]
        );
        let active_json =
            serde_json::to_value(&active_profiles).expect("active profiles should serialize");
        for forbidden in [
            "credentialRef",
            "credentialFingerprint",
            "webhookSecretRef",
            "webhookSecretFingerprint",
            "configSnapshot",
        ] {
            assert!(
                !active_json.to_string().contains(forbidden),
                "app active provider projection must not expose {forbidden}"
            );
        }

        repository
            .disable_provider_profile(
                "profile-agora",
                Some("not enabled for this tenant"),
                Some("301"),
                "2026-06-10T00:00:00.000Z",
            )
            .await
            .expect("disable should update profile");
        let active_after_disable = repository
            .list_active_provider_profiles("100", "200", None)
            .await
            .expect("active provider profile lookup should work after disable");
        assert_eq!(
            active_after_disable
                .iter()
                .map(|profile| profile.id.as_str())
                .collect::<Vec<_>>(),
            vec!["profile-volcengine", "profile-tencent"]
        );

        repository
            .record_provider_profile_verification(&RtcProviderProfileVerification {
                provider_profile_id: "profile-tencent".to_string(),
                provider: "tencent".to_string(),
                status: RtcProviderHealthStatus::Degraded,
                verified_at: "2026-06-10T00:01:00.000Z".to_string(),
                latency_ms: Some(120),
                error: Some("recording probe skipped".to_string()),
            })
            .await
            .expect("verification result should persist");
        let verified = repository
            .get_provider_profile_by_id("profile-tencent")
            .await
            .expect("profile lookup should work")
            .expect("profile should exist");
        assert_eq!(verified.health_status, RtcProviderHealthStatus::Degraded);
        assert_eq!(
            verified.last_verified_at.as_deref(),
            Some("2026-06-10T00:01:00.000Z")
        );
        assert_eq!(
            verified.last_verification_error.as_deref(),
            Some("recording probe skipped")
        );
        assert_eq!(
            verified.last_verification_latency_ms,
            Some(120),
            "provider account verification latency must be persisted for backend diagnostics"
        );

        let tenant_profiles = repository
            .list_provider_profiles("100", "200", Some("default"))
            .await
            .expect("provider profile list should work");
        assert_eq!(tenant_profiles.len(), 3);
        assert!(
            tenant_profiles
                .iter()
                .any(|profile| profile.provider == "agora"
                    && profile.status == RtcProviderProfileStatus::Disabled),
            "backend provider profile list should keep disabled profiles visible for operators"
        );
    }

    #[tokio::test]
    async fn sqlite_repository_allows_same_provider_code_per_organization_scope() {
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

        let repository = super::RtcSqliteProviderProfileRepository::new(pool.clone());
        let mut first_org_profile =
            provider_profile("profile-volcengine-org-200", "volcengine", true, 10);
        first_org_profile.organization_id = "200".to_string();
        let mut second_org_profile =
            provider_profile("profile-volcengine-org-201", "volcengine", true, 10);
        second_org_profile.organization_id = "201".to_string();

        repository
            .upsert_provider_profile(11, &first_org_profile)
            .await
            .expect("first organization profile should persist");
        repository
            .upsert_provider_profile(12, &second_org_profile)
            .await
            .expect("second organization profile should persist without replacing the first");

        let first_org_profiles = repository
            .list_provider_profiles("100", "200", Some("default"))
            .await
            .expect("first organization profiles should list");
        let second_org_profiles = repository
            .list_provider_profiles("100", "201", Some("default"))
            .await
            .expect("second organization profiles should list");

        assert_eq!(
            first_org_profiles
                .iter()
                .map(|profile| profile.id.as_str())
                .collect::<Vec<_>>(),
            vec!["profile-volcengine-org-200"]
        );
        assert_eq!(
            second_org_profiles
                .iter()
                .map(|profile| profile.id.as_str())
                .collect::<Vec<_>>(),
            vec!["profile-volcengine-org-201"]
        );
    }

    fn provider_profile(
        id: impl Into<String>,
        provider: impl Into<String>,
        is_default: bool,
        priority: i32,
    ) -> RtcProviderProfile {
        let id = id.into();
        let provider = provider.into();
        RtcProviderProfile {
            id,
            tenant_id: "100".to_string(),
            organization_id: "200".to_string(),
            provider: provider.clone(),
            code: "default".to_string(),
            name: format!("{provider} default"),
            status: RtcProviderProfileStatus::Active,
            is_default,
            priority,
            environment: "production".to_string(),
            region: Some("cn-beijing".to_string()),
            provider_app_id: Some(format!("{provider}-app-id")),
            endpoint: Some(format!("https://rtc.{provider}.example")),
            credential_ref: Some(format!("secret://rtc/{provider}/default")),
            credential_fingerprint: Some(format!("fingerprint:{provider}:credential")),
            webhook_secret_ref: Some(format!("secret://rtc/{provider}/webhook")),
            webhook_secret_fingerprint: Some(format!("fingerprint:{provider}:webhook")),
            capabilities: RtcProviderCapabilitySnapshot {
                audio: true,
                video: true,
                live: true,
                live_broadcast: true,
                live_audience: true,
                cdn_relay: provider == "tencent",
                screen_share: true,
                recording: true,
                webhook: true,
                active_query: true,
                max_participants: Some(300),
                supported_regions: vec!["cn-beijing".to_string()],
                provider_features: serde_json::json!({
                    "cloudMix": provider == "volcengine",
                    "cdnRelay": provider == "tencent"
                }),
            },
            config_snapshot: serde_json::json!({
                "tokenTtlSeconds": 3600,
                "recording": { "enabled": true }
            }),
            health_status: RtcProviderHealthStatus::Unknown,
            last_verified_at: None,
            last_verification_latency_ms: None,
            last_verification_error: None,
            created_by: Some("300".to_string()),
            updated_by: Some("300".to_string()),
            created_at: Some("2026-06-10T00:00:00.000Z".to_string()),
            updated_at: Some("2026-06-10T00:00:00.000Z".to_string()),
            version: "0".to_string(),
            deleted_at: None,
            deleted_by: None,
        }
    }
}
