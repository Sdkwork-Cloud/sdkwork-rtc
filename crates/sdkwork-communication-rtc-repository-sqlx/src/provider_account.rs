use sdkwork_communication_rtc_service::{
    RtcProviderAccount, RtcProviderAccountStatus, RtcProviderApplication,
    RtcProviderApplicationStatus, RtcProviderCredential, RtcProviderCredentialRole,
    RtcProviderCredentialStatus,
};
use serde::de::DeserializeOwned;
use serde_json::Value as JsonValue;
use sqlx::{
    Executor, PgPool, Postgres, Row, Sqlite, SqlitePool, postgres::PgRow, sqlite::SqliteRow,
};

use crate::{RtcStorageError, RtcStorageResult};

#[derive(Clone, Debug)]
pub struct RtcSqliteProviderAccountRepository {
    pool: SqlitePool,
}

impl RtcSqliteProviderAccountRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn upsert_provider_account(
        &self,
        numeric_id: i64,
        account: &RtcProviderAccount,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_account_with(&self.pool, numeric_id, account)
            .await
    }

    pub async fn upsert_provider_account_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        account: &RtcProviderAccount,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_provider_account_sql())
            .bind(numeric_id)
            .bind(&account.id)
            .bind(parse_i64_field("tenant_id", &account.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &account.organization_id,
            )?)
            .bind(&account.provider)
            .bind(&account.code)
            .bind(&account.name)
            .bind(provider_account_status_to_i32(&account.status))
            .bind(&account.environment)
            .bind(&account.external_tenant_id)
            .bind(&account.cloud_account_id)
            .bind(&account.project_id)
            .bind(&account.resource_group_id)
            .bind(&account.last_verified_at)
            .bind(&account.last_verification_error)
            .bind(option_string_to_i64(
                "created_by",
                account.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                account.updated_by.as_deref(),
            )?)
            .bind(
                account
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                account
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &account.version)?)
            .bind(&account.deleted_at)
            .bind(option_string_to_i64(
                "deleted_by",
                account.deleted_by.as_deref(),
            )?)
            .execute(executor)
            .await?;
        Ok(())
    }

    pub async fn get_provider_account_by_id(
        &self,
        provider_account_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderAccount>> {
        let sql = provider_account_select_columns_sql("WHERE uuid = ?", "");
        let row = sqlx::query(&sql)
            .bind(provider_account_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_provider_account).transpose()
    }

    pub async fn list_provider_accounts(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
        status: Option<RtcProviderAccountStatus>,
    ) -> RtcStorageResult<Vec<RtcProviderAccount>> {
        let status = status.as_ref().map(provider_account_status_to_i32);
        let sql = provider_account_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND (? IS NULL OR provider = ?)
              AND (? IS NULL OR status = ?)
              AND deleted_at IS NULL
            "#,
            "ORDER BY provider ASC, code ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider)
            .bind(provider)
            .bind(status)
            .bind(status)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_account)
            .collect()
    }

    pub async fn disable_provider_account(
        &self,
        provider_account_id: &str,
        reason: Option<&str>,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderAccount> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_account
            SET
                status = 2,
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
        .bind(provider_account_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_account_updated(result.rows_affected(), provider_account_id)?;
        self.get_provider_account_by_id(provider_account_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderAccount {
                provider_account_id: provider_account_id.to_string(),
            })
    }

    pub async fn upsert_provider_application(
        &self,
        numeric_id: i64,
        application: &RtcProviderApplication,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_application_with(&self.pool, numeric_id, application)
            .await
    }

    pub async fn upsert_provider_application_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        application: &RtcProviderApplication,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_provider_application_sql())
            .bind(numeric_id)
            .bind(&application.id)
            .bind(parse_i64_field("tenant_id", &application.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &application.organization_id,
            )?)
            .bind(&application.provider_account_id)
            .bind(&application.provider)
            .bind(&application.code)
            .bind(&application.name)
            .bind(provider_application_status_to_i32(&application.status))
            .bind(&application.environment)
            .bind(&application.region)
            .bind(&application.provider_application_id)
            .bind(&application.provider_application_id_kind)
            .bind(&application.access_endpoint)
            .bind(&application.api_endpoint)
            .bind(&application.api_host)
            .bind(&application.api_version)
            .bind(&application.webhook_callback_url)
            .bind(serialize_json(&application.config_snapshot)?)
            .bind(&application.last_verified_at)
            .bind(&application.last_verification_error)
            .bind(option_string_to_i64(
                "created_by",
                application.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                application.updated_by.as_deref(),
            )?)
            .bind(
                application
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                application
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &application.version)?)
            .bind(&application.deleted_at)
            .bind(option_string_to_i64(
                "deleted_by",
                application.deleted_by.as_deref(),
            )?)
            .execute(executor)
            .await?;
        Ok(())
    }

    pub async fn get_provider_application_by_id(
        &self,
        provider_application_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderApplication>> {
        let sql = provider_application_select_columns_sql("WHERE uuid = ?", "");
        let row = sqlx::query(&sql)
            .bind(provider_application_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_provider_application).transpose()
    }

    pub async fn list_provider_applications(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_account_id: Option<&str>,
        status: Option<RtcProviderApplicationStatus>,
    ) -> RtcStorageResult<Vec<RtcProviderApplication>> {
        let status = status.as_ref().map(provider_application_status_to_i32);
        let sql = provider_application_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND (? IS NULL OR provider_account_id = ?)
              AND (? IS NULL OR status = ?)
              AND deleted_at IS NULL
            "#,
            "ORDER BY provider ASC, code ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider_account_id)
            .bind(provider_account_id)
            .bind(status)
            .bind(status)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_application)
            .collect()
    }

    pub async fn disable_provider_application(
        &self,
        provider_application_id: &str,
        reason: Option<&str>,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderApplication> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_application
            SET
                status = 2,
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
        .bind(provider_application_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_application_updated(result.rows_affected(), provider_application_id)?;
        self.get_provider_application_by_id(provider_application_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderApplication {
                provider_application_id: provider_application_id.to_string(),
            })
    }

    pub async fn upsert_provider_credential(
        &self,
        numeric_id: i64,
        credential: &RtcProviderCredential,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_credential_with(&self.pool, numeric_id, credential)
            .await
    }

    pub async fn upsert_provider_credential_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        credential: &RtcProviderCredential,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_provider_credential_sql())
            .bind(numeric_id)
            .bind(&credential.id)
            .bind(parse_i64_field("tenant_id", &credential.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &credential.organization_id,
            )?)
            .bind(&credential.provider_account_id)
            .bind(&credential.provider_application_id)
            .bind(&credential.provider)
            .bind(provider_credential_role_to_i32(&credential.credential_role))
            .bind(&credential.credential_label)
            .bind(&credential.credential_ref)
            .bind(&credential.credential_fingerprint)
            .bind(&credential.secret_version)
            .bind(provider_credential_status_to_i32(&credential.status))
            .bind(&credential.valid_from)
            .bind(&credential.expires_at)
            .bind(&credential.rotation_due_at)
            .bind(&credential.rotated_at)
            .bind(&credential.revoked_at)
            .bind(&credential.last_verified_at)
            .bind(&credential.last_used_at)
            .bind(option_string_to_i64(
                "created_by",
                credential.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                credential.updated_by.as_deref(),
            )?)
            .bind(
                credential
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                credential
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &credential.version)?)
            .execute(executor)
            .await?;
        Ok(())
    }

    pub async fn get_provider_credential_by_id(
        &self,
        provider_credential_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderCredential>> {
        let sql = provider_credential_select_columns_sql("WHERE uuid = ?", "");
        let row = sqlx::query(&sql)
            .bind(provider_credential_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_provider_credential).transpose()
    }

    pub async fn list_provider_credentials(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_application_id: Option<&str>,
        status: Option<RtcProviderCredentialStatus>,
    ) -> RtcStorageResult<Vec<RtcProviderCredential>> {
        let status = status.as_ref().map(provider_credential_status_to_i32);
        let sql = provider_credential_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND (? IS NULL OR provider_application_id = ?)
              AND (? IS NULL OR status = ?)
            "#,
            "ORDER BY provider ASC, credential_role ASC, credential_label ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider_application_id)
            .bind(provider_application_id)
            .bind(status)
            .bind(status)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(sqlite_row_to_provider_credential)
            .collect()
    }

    pub async fn revoke_provider_credential(
        &self,
        provider_credential_id: &str,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderCredential> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_credential
            SET
                status = 4,
                revoked_at = ?,
                updated_by = ?,
                updated_at = ?,
                version = version + 1
            WHERE uuid = ?
            "#,
        )
        .bind(updated_at)
        .bind(option_string_to_i64("updated_by", updated_by)?)
        .bind(updated_at)
        .bind(provider_credential_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_credential_updated(result.rows_affected(), provider_credential_id)?;
        self.get_provider_credential_by_id(provider_credential_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderCredential {
                provider_credential_id: provider_credential_id.to_string(),
            })
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresProviderAccountRepository {
    pool: PgPool,
}

impl RtcPostgresProviderAccountRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn upsert_provider_account(
        &self,
        numeric_id: i64,
        account: &RtcProviderAccount,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_account_with(&self.pool, numeric_id, account)
            .await
    }

    pub async fn upsert_provider_account_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        account: &RtcProviderAccount,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_provider_account_sql())
            .bind(numeric_id)
            .bind(&account.id)
            .bind(parse_i64_field("tenant_id", &account.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &account.organization_id,
            )?)
            .bind(&account.provider)
            .bind(&account.code)
            .bind(&account.name)
            .bind(provider_account_status_to_i32(&account.status))
            .bind(&account.environment)
            .bind(&account.external_tenant_id)
            .bind(&account.cloud_account_id)
            .bind(&account.project_id)
            .bind(&account.resource_group_id)
            .bind(account.last_verified_at.as_deref().unwrap_or(""))
            .bind(&account.last_verification_error)
            .bind(option_string_to_i64(
                "created_by",
                account.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                account.updated_by.as_deref(),
            )?)
            .bind(
                account
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                account
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &account.version)?)
            .bind(account.deleted_at.as_deref().unwrap_or(""))
            .bind(option_string_to_i64(
                "deleted_by",
                account.deleted_by.as_deref(),
            )?)
            .execute(executor)
            .await?;
        Ok(())
    }

    pub async fn get_provider_account_by_id(
        &self,
        provider_account_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderAccount>> {
        let sql = postgres_provider_account_select_columns_sql("WHERE uuid = $1", "");
        let row = sqlx::query(&sql)
            .bind(provider_account_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_provider_account).transpose()
    }

    pub async fn list_provider_accounts(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
        status: Option<RtcProviderAccountStatus>,
    ) -> RtcStorageResult<Vec<RtcProviderAccount>> {
        let status = status.as_ref().map(provider_account_status_to_i32);
        let sql = postgres_provider_account_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND ($3::text IS NULL OR provider = $4)
              AND ($5::integer IS NULL OR status = $6)
              AND deleted_at IS NULL
            "#,
            "ORDER BY provider ASC, code ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider)
            .bind(provider)
            .bind(status)
            .bind(status)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_account)
            .collect()
    }

    pub async fn disable_provider_account(
        &self,
        provider_account_id: &str,
        reason: Option<&str>,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderAccount> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_account
            SET
                status = 2,
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
        .bind(provider_account_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_account_updated(result.rows_affected(), provider_account_id)?;
        self.get_provider_account_by_id(provider_account_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderAccount {
                provider_account_id: provider_account_id.to_string(),
            })
    }

    pub async fn upsert_provider_application(
        &self,
        numeric_id: i64,
        application: &RtcProviderApplication,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_application_with(&self.pool, numeric_id, application)
            .await
    }

    pub async fn upsert_provider_application_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        application: &RtcProviderApplication,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_provider_application_sql())
            .bind(numeric_id)
            .bind(&application.id)
            .bind(parse_i64_field("tenant_id", &application.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &application.organization_id,
            )?)
            .bind(&application.provider_account_id)
            .bind(&application.provider)
            .bind(&application.code)
            .bind(&application.name)
            .bind(provider_application_status_to_i32(&application.status))
            .bind(&application.environment)
            .bind(&application.region)
            .bind(&application.provider_application_id)
            .bind(&application.provider_application_id_kind)
            .bind(&application.access_endpoint)
            .bind(&application.api_endpoint)
            .bind(&application.api_host)
            .bind(&application.api_version)
            .bind(&application.webhook_callback_url)
            .bind(sqlx::types::Json(application.config_snapshot.clone()))
            .bind(application.last_verified_at.as_deref().unwrap_or(""))
            .bind(&application.last_verification_error)
            .bind(option_string_to_i64(
                "created_by",
                application.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                application.updated_by.as_deref(),
            )?)
            .bind(
                application
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                application
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &application.version)?)
            .bind(application.deleted_at.as_deref().unwrap_or(""))
            .bind(option_string_to_i64(
                "deleted_by",
                application.deleted_by.as_deref(),
            )?)
            .execute(executor)
            .await?;
        Ok(())
    }

    pub async fn get_provider_application_by_id(
        &self,
        provider_application_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderApplication>> {
        let sql = postgres_provider_application_select_columns_sql("WHERE uuid = $1", "");
        let row = sqlx::query(&sql)
            .bind(provider_application_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_provider_application).transpose()
    }

    pub async fn list_provider_applications(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_account_id: Option<&str>,
        status: Option<RtcProviderApplicationStatus>,
    ) -> RtcStorageResult<Vec<RtcProviderApplication>> {
        let status = status.as_ref().map(provider_application_status_to_i32);
        let sql = postgres_provider_application_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND ($3::text IS NULL OR provider_account_id = $4)
              AND ($5::integer IS NULL OR status = $6)
              AND deleted_at IS NULL
            "#,
            "ORDER BY provider ASC, code ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider_account_id)
            .bind(provider_account_id)
            .bind(status)
            .bind(status)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_application)
            .collect()
    }

    pub async fn disable_provider_application(
        &self,
        provider_application_id: &str,
        reason: Option<&str>,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderApplication> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_application
            SET
                status = 2,
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
        .bind(provider_application_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_application_updated(result.rows_affected(), provider_application_id)?;
        self.get_provider_application_by_id(provider_application_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderApplication {
                provider_application_id: provider_application_id.to_string(),
            })
    }

    pub async fn upsert_provider_credential(
        &self,
        numeric_id: i64,
        credential: &RtcProviderCredential,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_credential_with(&self.pool, numeric_id, credential)
            .await
    }

    pub async fn upsert_provider_credential_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        credential: &RtcProviderCredential,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_provider_credential_sql())
            .bind(numeric_id)
            .bind(&credential.id)
            .bind(parse_i64_field("tenant_id", &credential.tenant_id)?)
            .bind(parse_i64_field(
                "organization_id",
                &credential.organization_id,
            )?)
            .bind(&credential.provider_account_id)
            .bind(&credential.provider_application_id)
            .bind(&credential.provider)
            .bind(provider_credential_role_to_i32(&credential.credential_role))
            .bind(&credential.credential_label)
            .bind(&credential.credential_ref)
            .bind(&credential.credential_fingerprint)
            .bind(&credential.secret_version)
            .bind(provider_credential_status_to_i32(&credential.status))
            .bind(credential.valid_from.as_deref().unwrap_or(""))
            .bind(credential.expires_at.as_deref().unwrap_or(""))
            .bind(credential.rotation_due_at.as_deref().unwrap_or(""))
            .bind(credential.rotated_at.as_deref().unwrap_or(""))
            .bind(credential.revoked_at.as_deref().unwrap_or(""))
            .bind(credential.last_verified_at.as_deref().unwrap_or(""))
            .bind(credential.last_used_at.as_deref().unwrap_or(""))
            .bind(option_string_to_i64(
                "created_by",
                credential.created_by.as_deref(),
            )?)
            .bind(option_string_to_i64(
                "updated_by",
                credential.updated_by.as_deref(),
            )?)
            .bind(
                credential
                    .created_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(
                credential
                    .updated_at
                    .as_deref()
                    .unwrap_or("1970-01-01T00:00:00.000Z"),
            )
            .bind(parse_i64_field("version", &credential.version)?)
            .execute(executor)
            .await?;
        Ok(())
    }

    pub async fn get_provider_credential_by_id(
        &self,
        provider_credential_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderCredential>> {
        let sql = postgres_provider_credential_select_columns_sql("WHERE uuid = $1", "");
        let row = sqlx::query(&sql)
            .bind(provider_credential_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_provider_credential).transpose()
    }

    pub async fn list_provider_credentials(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_application_id: Option<&str>,
        status: Option<RtcProviderCredentialStatus>,
    ) -> RtcStorageResult<Vec<RtcProviderCredential>> {
        let status = status.as_ref().map(provider_credential_status_to_i32);
        let sql = postgres_provider_credential_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND ($3::text IS NULL OR provider_application_id = $4)
              AND ($5::integer IS NULL OR status = $6)
            "#,
            "ORDER BY provider ASC, credential_role ASC, credential_label ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider_application_id)
            .bind(provider_application_id)
            .bind(status)
            .bind(status)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_credential)
            .collect()
    }

    pub async fn revoke_provider_credential(
        &self,
        provider_credential_id: &str,
        updated_by: Option<&str>,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderCredential> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_credential
            SET
                status = 4,
                revoked_at = $1::text::timestamp,
                updated_by = $2,
                updated_at = $3::text::timestamp,
                version = version + 1
            WHERE uuid = $4
            "#,
        )
        .bind(updated_at)
        .bind(option_string_to_i64("updated_by", updated_by)?)
        .bind(updated_at)
        .bind(provider_credential_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_credential_updated(result.rows_affected(), provider_credential_id)?;
        self.get_provider_credential_by_id(provider_credential_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderCredential {
                provider_credential_id: provider_credential_id.to_string(),
            })
    }
}

fn sqlite_upsert_provider_account_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_account (
        id, uuid, tenant_id, organization_id, provider, code, name, status, environment,
        external_tenant_id, cloud_account_id, project_id, resource_group_id,
        last_verified_at, last_verification_error, created_by, updated_by, created_at,
        updated_at, version, deleted_at, deleted_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(tenant_id, organization_id, provider, code) DO UPDATE SET
        uuid = excluded.uuid,
        name = excluded.name,
        status = excluded.status,
        environment = excluded.environment,
        external_tenant_id = excluded.external_tenant_id,
        cloud_account_id = excluded.cloud_account_id,
        project_id = excluded.project_id,
        resource_group_id = excluded.resource_group_id,
        last_verified_at = excluded.last_verified_at,
        last_verification_error = excluded.last_verification_error,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_account.version + 1,
        deleted_at = excluded.deleted_at,
        deleted_by = excluded.deleted_by
    "#
}

fn postgres_upsert_provider_account_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_account (
        id, uuid, tenant_id, organization_id, provider, code, name, status, environment,
        external_tenant_id, cloud_account_id, project_id, resource_group_id,
        last_verified_at, last_verification_error, created_by, updated_by, created_at,
        updated_at, version, deleted_at, deleted_by
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        NULLIF($14::text, '')::timestamp, $15, $16, $17, $18::text::timestamp,
        $19::text::timestamp, $20, NULLIF($21::text, '')::timestamp, $22
    )
    ON CONFLICT(tenant_id, organization_id, provider, code) DO UPDATE SET
        uuid = excluded.uuid,
        name = excluded.name,
        status = excluded.status,
        environment = excluded.environment,
        external_tenant_id = excluded.external_tenant_id,
        cloud_account_id = excluded.cloud_account_id,
        project_id = excluded.project_id,
        resource_group_id = excluded.resource_group_id,
        last_verified_at = excluded.last_verified_at,
        last_verification_error = excluded.last_verification_error,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_account.version + 1,
        deleted_at = excluded.deleted_at,
        deleted_by = excluded.deleted_by
    "#
}

fn sqlite_upsert_provider_application_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_application (
        id, uuid, tenant_id, organization_id, provider_account_id, provider, code, name,
        status, environment, region, provider_application_id, provider_application_id_kind,
        access_endpoint, api_endpoint, api_host, api_version, webhook_callback_url,
        config_snapshot, last_verified_at, last_verification_error, created_by, updated_by,
        created_at, updated_at, version, deleted_at, deleted_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider_account_id, code) DO UPDATE SET
        uuid = excluded.uuid,
        provider = excluded.provider,
        name = excluded.name,
        status = excluded.status,
        environment = excluded.environment,
        region = excluded.region,
        provider_application_id = excluded.provider_application_id,
        provider_application_id_kind = excluded.provider_application_id_kind,
        access_endpoint = excluded.access_endpoint,
        api_endpoint = excluded.api_endpoint,
        api_host = excluded.api_host,
        api_version = excluded.api_version,
        webhook_callback_url = excluded.webhook_callback_url,
        config_snapshot = excluded.config_snapshot,
        last_verified_at = excluded.last_verified_at,
        last_verification_error = excluded.last_verification_error,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_application.version + 1,
        deleted_at = excluded.deleted_at,
        deleted_by = excluded.deleted_by
    "#
}

fn postgres_upsert_provider_application_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_application (
        id, uuid, tenant_id, organization_id, provider_account_id, provider, code, name,
        status, environment, region, provider_application_id, provider_application_id_kind,
        access_endpoint, api_endpoint, api_host, api_version, webhook_callback_url,
        config_snapshot, last_verified_at, last_verification_error, created_by, updated_by,
        created_at, updated_at, version, deleted_at, deleted_by
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, NULLIF($20::text, '')::timestamp, $21, $22, $23,
        $24::text::timestamp, $25::text::timestamp, $26, NULLIF($27::text, '')::timestamp, $28
    )
    ON CONFLICT(provider_account_id, code) DO UPDATE SET
        uuid = excluded.uuid,
        provider = excluded.provider,
        name = excluded.name,
        status = excluded.status,
        environment = excluded.environment,
        region = excluded.region,
        provider_application_id = excluded.provider_application_id,
        provider_application_id_kind = excluded.provider_application_id_kind,
        access_endpoint = excluded.access_endpoint,
        api_endpoint = excluded.api_endpoint,
        api_host = excluded.api_host,
        api_version = excluded.api_version,
        webhook_callback_url = excluded.webhook_callback_url,
        config_snapshot = excluded.config_snapshot,
        last_verified_at = excluded.last_verified_at,
        last_verification_error = excluded.last_verification_error,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_application.version + 1,
        deleted_at = excluded.deleted_at,
        deleted_by = excluded.deleted_by
    "#
}

fn sqlite_upsert_provider_credential_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_credential (
        id, uuid, tenant_id, organization_id, provider_account_id, provider_application_id,
        provider, credential_role, credential_label, credential_ref, credential_fingerprint,
        secret_version, status, valid_from, expires_at, rotation_due_at, rotated_at,
        revoked_at, last_verified_at, last_used_at, created_by, updated_by, created_at,
        updated_at, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider_application_id, credential_role, credential_label) DO UPDATE SET
        uuid = excluded.uuid,
        credential_ref = excluded.credential_ref,
        credential_fingerprint = excluded.credential_fingerprint,
        secret_version = excluded.secret_version,
        status = excluded.status,
        valid_from = excluded.valid_from,
        expires_at = excluded.expires_at,
        rotation_due_at = excluded.rotation_due_at,
        rotated_at = excluded.rotated_at,
        revoked_at = excluded.revoked_at,
        last_verified_at = excluded.last_verified_at,
        last_used_at = excluded.last_used_at,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_credential.version + 1
    "#
}

fn postgres_upsert_provider_credential_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_credential (
        id, uuid, tenant_id, organization_id, provider_account_id, provider_application_id,
        provider, credential_role, credential_label, credential_ref, credential_fingerprint,
        secret_version, status, valid_from, expires_at, rotation_due_at, rotated_at,
        revoked_at, last_verified_at, last_used_at, created_by, updated_by, created_at,
        updated_at, version
    )
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        NULLIF($14::text, '')::timestamp,
        NULLIF($15::text, '')::timestamp,
        NULLIF($16::text, '')::timestamp,
        NULLIF($17::text, '')::timestamp,
        NULLIF($18::text, '')::timestamp,
        NULLIF($19::text, '')::timestamp,
        NULLIF($20::text, '')::timestamp,
        $21, $22, $23::text::timestamp, $24::text::timestamp, $25
    )
    ON CONFLICT(provider_application_id, credential_role, credential_label) DO UPDATE SET
        uuid = excluded.uuid,
        credential_ref = excluded.credential_ref,
        credential_fingerprint = excluded.credential_fingerprint,
        secret_version = excluded.secret_version,
        status = excluded.status,
        valid_from = excluded.valid_from,
        expires_at = excluded.expires_at,
        rotation_due_at = excluded.rotation_due_at,
        rotated_at = excluded.rotated_at,
        revoked_at = excluded.revoked_at,
        last_verified_at = excluded.last_verified_at,
        last_used_at = excluded.last_used_at,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at,
        version = rtc_provider_credential.version + 1
    "#
}

fn provider_account_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
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
            environment,
            external_tenant_id,
            cloud_account_id,
            project_id,
            resource_group_id,
            last_verified_at,
            last_verification_error,
            created_by,
            updated_by,
            created_at,
            updated_at,
            version,
            deleted_at,
            deleted_by
        FROM rtc_provider_account
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_provider_account_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
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
            environment,
            external_tenant_id,
            cloud_account_id,
            project_id,
            resource_group_id,
            to_char(last_verified_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_verified_at,
            last_verification_error,
            created_by,
            updated_by,
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
            to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at,
            version,
            to_char(deleted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS deleted_at,
            deleted_by
        FROM rtc_provider_account
        {where_clause}
        {order_clause}
        "#
    )
}

fn provider_application_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider_account_id,
            provider,
            code,
            name,
            status,
            environment,
            region,
            provider_application_id,
            provider_application_id_kind,
            access_endpoint,
            api_endpoint,
            api_host,
            api_version,
            webhook_callback_url,
            config_snapshot,
            last_verified_at,
            last_verification_error,
            created_by,
            updated_by,
            created_at,
            updated_at,
            version,
            deleted_at,
            deleted_by
        FROM rtc_provider_application
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_provider_application_select_columns_sql(
    where_clause: &str,
    order_clause: &str,
) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider_account_id,
            provider,
            code,
            name,
            status,
            environment,
            region,
            provider_application_id,
            provider_application_id_kind,
            access_endpoint,
            api_endpoint,
            api_host,
            api_version,
            webhook_callback_url,
            config_snapshot,
            to_char(last_verified_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_verified_at,
            last_verification_error,
            created_by,
            updated_by,
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
            to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at,
            version,
            to_char(deleted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS deleted_at,
            deleted_by
        FROM rtc_provider_application
        {where_clause}
        {order_clause}
        "#
    )
}

fn provider_credential_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider_account_id,
            provider_application_id,
            provider,
            credential_role,
            credential_label,
            credential_ref,
            credential_fingerprint,
            secret_version,
            status,
            valid_from,
            expires_at,
            rotation_due_at,
            rotated_at,
            revoked_at,
            last_verified_at,
            last_used_at,
            created_by,
            updated_by,
            created_at,
            updated_at,
            version
        FROM rtc_provider_credential
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_provider_credential_select_columns_sql(
    where_clause: &str,
    order_clause: &str,
) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider_account_id,
            provider_application_id,
            provider,
            credential_role,
            credential_label,
            credential_ref,
            credential_fingerprint,
            secret_version,
            status,
            to_char(valid_from AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS valid_from,
            to_char(expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS expires_at,
            to_char(rotation_due_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS rotation_due_at,
            to_char(rotated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS rotated_at,
            to_char(revoked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS revoked_at,
            to_char(last_verified_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_verified_at,
            to_char(last_used_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_used_at,
            created_by,
            updated_by,
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
            to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at,
            version
        FROM rtc_provider_credential
        {where_clause}
        {order_clause}
        "#
    )
}

fn sqlite_row_to_provider_account(row: SqliteRow) -> RtcStorageResult<RtcProviderAccount> {
    let status: i32 = row.try_get("status")?;
    let version: i64 = row.try_get("version")?;
    Ok(RtcProviderAccount {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        code: row.try_get("code")?,
        name: row.try_get("name")?,
        status: i32_to_provider_account_status(status)?,
        environment: row.try_get("environment")?,
        external_tenant_id: row.try_get("external_tenant_id")?,
        cloud_account_id: row.try_get("cloud_account_id")?,
        project_id: row.try_get("project_id")?,
        resource_group_id: row.try_get("resource_group_id")?,
        last_verified_at: row.try_get("last_verified_at")?,
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

fn postgres_row_to_provider_account(row: PgRow) -> RtcStorageResult<RtcProviderAccount> {
    let status: i32 = row.try_get("status")?;
    let version: i64 = row.try_get("version")?;
    Ok(RtcProviderAccount {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider: row.try_get("provider")?,
        code: row.try_get("code")?,
        name: row.try_get("name")?,
        status: i32_to_provider_account_status(status)?,
        environment: row.try_get("environment")?,
        external_tenant_id: row.try_get("external_tenant_id")?,
        cloud_account_id: row.try_get("cloud_account_id")?,
        project_id: row.try_get("project_id")?,
        resource_group_id: row.try_get("resource_group_id")?,
        last_verified_at: row.try_get("last_verified_at")?,
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

fn sqlite_row_to_provider_application(row: SqliteRow) -> RtcStorageResult<RtcProviderApplication> {
    let status: i32 = row.try_get("status")?;
    let version: i64 = row.try_get("version")?;
    Ok(RtcProviderApplication {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider_account_id: row.try_get("provider_account_id")?,
        provider: row.try_get("provider")?,
        code: row.try_get("code")?,
        name: row.try_get("name")?,
        status: i32_to_provider_application_status(status)?,
        environment: row.try_get("environment")?,
        region: row.try_get("region")?,
        provider_application_id: row.try_get("provider_application_id")?,
        provider_application_id_kind: row.try_get("provider_application_id_kind")?,
        access_endpoint: row.try_get("access_endpoint")?,
        api_endpoint: row.try_get("api_endpoint")?,
        api_host: row.try_get("api_host")?,
        api_version: row.try_get("api_version")?,
        webhook_callback_url: row.try_get("webhook_callback_url")?,
        config_snapshot: deserialize_json_text(row.try_get("config_snapshot")?)?,
        last_verified_at: row.try_get("last_verified_at")?,
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

fn postgres_row_to_provider_application(row: PgRow) -> RtcStorageResult<RtcProviderApplication> {
    let status: i32 = row.try_get("status")?;
    let version: i64 = row.try_get("version")?;
    let config_snapshot: sqlx::types::Json<JsonValue> = row.try_get("config_snapshot")?;
    Ok(RtcProviderApplication {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider_account_id: row.try_get("provider_account_id")?,
        provider: row.try_get("provider")?,
        code: row.try_get("code")?,
        name: row.try_get("name")?,
        status: i32_to_provider_application_status(status)?,
        environment: row.try_get("environment")?,
        region: row.try_get("region")?,
        provider_application_id: row.try_get("provider_application_id")?,
        provider_application_id_kind: row.try_get("provider_application_id_kind")?,
        access_endpoint: row.try_get("access_endpoint")?,
        api_endpoint: row.try_get("api_endpoint")?,
        api_host: row.try_get("api_host")?,
        api_version: row.try_get("api_version")?,
        webhook_callback_url: row.try_get("webhook_callback_url")?,
        config_snapshot: config_snapshot.0,
        last_verified_at: row.try_get("last_verified_at")?,
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

fn sqlite_row_to_provider_credential(row: SqliteRow) -> RtcStorageResult<RtcProviderCredential> {
    let credential_role: i32 = row.try_get("credential_role")?;
    let status: i32 = row.try_get("status")?;
    let version: i64 = row.try_get("version")?;
    Ok(RtcProviderCredential {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider_account_id: row.try_get("provider_account_id")?,
        provider_application_id: row.try_get("provider_application_id")?,
        provider: row.try_get("provider")?,
        credential_role: i32_to_provider_credential_role(credential_role)?,
        credential_label: row.try_get("credential_label")?,
        credential_ref: row.try_get("credential_ref")?,
        credential_fingerprint: row.try_get("credential_fingerprint")?,
        secret_version: row.try_get("secret_version")?,
        status: i32_to_provider_credential_status(status)?,
        valid_from: row.try_get("valid_from")?,
        expires_at: row.try_get("expires_at")?,
        rotation_due_at: row.try_get("rotation_due_at")?,
        rotated_at: row.try_get("rotated_at")?,
        revoked_at: row.try_get("revoked_at")?,
        last_verified_at: row.try_get("last_verified_at")?,
        last_used_at: row.try_get("last_used_at")?,
        created_by: sqlite_optional_i64_column_to_string(&row, "created_by")?,
        updated_by: sqlite_optional_i64_column_to_string(&row, "updated_by")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
        version: version.to_string(),
    })
}

fn postgres_row_to_provider_credential(row: PgRow) -> RtcStorageResult<RtcProviderCredential> {
    let credential_role: i32 = row.try_get("credential_role")?;
    let status: i32 = row.try_get("status")?;
    let version: i64 = row.try_get("version")?;
    Ok(RtcProviderCredential {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider_account_id: row.try_get("provider_account_id")?,
        provider_application_id: row.try_get("provider_application_id")?,
        provider: row.try_get("provider")?,
        credential_role: i32_to_provider_credential_role(credential_role)?,
        credential_label: row.try_get("credential_label")?,
        credential_ref: row.try_get("credential_ref")?,
        credential_fingerprint: row.try_get("credential_fingerprint")?,
        secret_version: row.try_get("secret_version")?,
        status: i32_to_provider_credential_status(status)?,
        valid_from: row.try_get("valid_from")?,
        expires_at: row.try_get("expires_at")?,
        rotation_due_at: row.try_get("rotation_due_at")?,
        rotated_at: row.try_get("rotated_at")?,
        revoked_at: row.try_get("revoked_at")?,
        last_verified_at: row.try_get("last_verified_at")?,
        last_used_at: row.try_get("last_used_at")?,
        created_by: postgres_optional_i64_column_to_string(&row, "created_by")?,
        updated_by: postgres_optional_i64_column_to_string(&row, "updated_by")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
        version: version.to_string(),
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

fn ensure_provider_account_updated(
    rows_affected: u64,
    provider_account_id: &str,
) -> RtcStorageResult<()> {
    if rows_affected == 0 {
        return Err(RtcStorageError::MissingProviderAccount {
            provider_account_id: provider_account_id.to_string(),
        });
    }
    Ok(())
}

fn ensure_provider_application_updated(
    rows_affected: u64,
    provider_application_id: &str,
) -> RtcStorageResult<()> {
    if rows_affected == 0 {
        return Err(RtcStorageError::MissingProviderApplication {
            provider_application_id: provider_application_id.to_string(),
        });
    }
    Ok(())
}

fn ensure_provider_credential_updated(
    rows_affected: u64,
    provider_credential_id: &str,
) -> RtcStorageResult<()> {
    if rows_affected == 0 {
        return Err(RtcStorageError::MissingProviderCredential {
            provider_credential_id: provider_credential_id.to_string(),
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

fn sqlite_i64_column_to_string(row: &SqliteRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
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

fn postgres_optional_i64_column_to_string(
    row: &PgRow,
    column: &'static str,
) -> RtcStorageResult<Option<String>> {
    let value: Option<i64> = row.try_get(column)?;
    Ok(value.map(|inner| inner.to_string()))
}

fn provider_account_status_to_i32(value: &RtcProviderAccountStatus) -> i32 {
    match value {
        RtcProviderAccountStatus::Active => 1,
        RtcProviderAccountStatus::Disabled => 2,
        RtcProviderAccountStatus::Archived => 3,
    }
}

fn i32_to_provider_account_status(value: i32) -> RtcStorageResult<RtcProviderAccountStatus> {
    match value {
        1 => Ok(RtcProviderAccountStatus::Active),
        2 => Ok(RtcProviderAccountStatus::Disabled),
        3 => Ok(RtcProviderAccountStatus::Archived),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "provider_account_status",
            value: value.to_string(),
        }),
    }
}

fn provider_application_status_to_i32(value: &RtcProviderApplicationStatus) -> i32 {
    match value {
        RtcProviderApplicationStatus::Active => 1,
        RtcProviderApplicationStatus::Disabled => 2,
        RtcProviderApplicationStatus::Archived => 3,
    }
}

fn i32_to_provider_application_status(
    value: i32,
) -> RtcStorageResult<RtcProviderApplicationStatus> {
    match value {
        1 => Ok(RtcProviderApplicationStatus::Active),
        2 => Ok(RtcProviderApplicationStatus::Disabled),
        3 => Ok(RtcProviderApplicationStatus::Archived),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "provider_application_status",
            value: value.to_string(),
        }),
    }
}

fn provider_credential_role_to_i32(value: &RtcProviderCredentialRole) -> i32 {
    match value {
        RtcProviderCredentialRole::RtcTokenSigning => 1,
        RtcProviderCredentialRole::OpenApiSigning => 2,
        RtcProviderCredentialRole::UserSigSigning => 3,
        RtcProviderCredentialRole::CloudApiSigning => 4,
        RtcProviderCredentialRole::WebhookSigning => 5,
    }
}

fn i32_to_provider_credential_role(value: i32) -> RtcStorageResult<RtcProviderCredentialRole> {
    match value {
        1 => Ok(RtcProviderCredentialRole::RtcTokenSigning),
        2 => Ok(RtcProviderCredentialRole::OpenApiSigning),
        3 => Ok(RtcProviderCredentialRole::UserSigSigning),
        4 => Ok(RtcProviderCredentialRole::CloudApiSigning),
        5 => Ok(RtcProviderCredentialRole::WebhookSigning),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "provider_credential_role",
            value: value.to_string(),
        }),
    }
}

fn provider_credential_status_to_i32(value: &RtcProviderCredentialStatus) -> i32 {
    match value {
        RtcProviderCredentialStatus::Active => 1,
        RtcProviderCredentialStatus::Pending => 2,
        RtcProviderCredentialStatus::Disabled => 3,
        RtcProviderCredentialStatus::Revoked => 4,
        RtcProviderCredentialStatus::Expired => 5,
    }
}

fn i32_to_provider_credential_status(value: i32) -> RtcStorageResult<RtcProviderCredentialStatus> {
    match value {
        1 => Ok(RtcProviderCredentialStatus::Active),
        2 => Ok(RtcProviderCredentialStatus::Pending),
        3 => Ok(RtcProviderCredentialStatus::Disabled),
        4 => Ok(RtcProviderCredentialStatus::Revoked),
        5 => Ok(RtcProviderCredentialStatus::Expired),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "provider_credential_status",
            value: value.to_string(),
        }),
    }
}

#[cfg(test)]
mod tests {
    use crate::SQLITE_SCHEMA;
    use sdkwork_communication_rtc_service::{
        RtcProviderAccount, RtcProviderAccountStatus, RtcProviderApplication,
        RtcProviderApplicationStatus, RtcProviderCredential, RtcProviderCredentialRole,
        RtcProviderCredentialStatus,
    };
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn sqlite_repository_manages_provider_account_application_and_credentials() {
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

        let repository = super::RtcSqliteProviderAccountRepository::new(pool);
        repository
            .upsert_provider_account(1, &provider_account("account-volcengine", "volcengine"))
            .await
            .expect("provider account should persist");
        repository
            .upsert_provider_application(
                2,
                &provider_application(
                    "app-volcengine",
                    "account-volcengine",
                    "volcengine",
                    "volcengine_app_id",
                ),
            )
            .await
            .expect("provider application should persist");
        repository
            .upsert_provider_credential(
                3,
                &provider_credential(
                    "credential-volcengine-token",
                    "account-volcengine",
                    "app-volcengine",
                    "volcengine",
                    RtcProviderCredentialRole::RtcTokenSigning,
                ),
            )
            .await
            .expect("token signing credential should persist");
        repository
            .upsert_provider_credential(
                4,
                &provider_credential(
                    "credential-volcengine-openapi",
                    "account-volcengine",
                    "app-volcengine",
                    "volcengine",
                    RtcProviderCredentialRole::OpenApiSigning,
                ),
            )
            .await
            .expect("open api credential should persist");

        let stored_account = repository
            .get_provider_account_by_id("account-volcengine")
            .await
            .expect("account lookup should work")
            .expect("account should exist");
        assert_eq!(stored_account.provider, "volcengine");
        assert_eq!(stored_account.status, RtcProviderAccountStatus::Active);

        let applications = repository
            .list_provider_applications("100", "200", Some("account-volcengine"), None)
            .await
            .expect("applications should list");
        assert_eq!(applications.len(), 1);
        assert_eq!(
            applications[0].provider_application_id_kind,
            "volcengine_app_id"
        );
        assert_eq!(applications[0].config_snapshot["tokenTtlSeconds"], 3600);

        let credentials = repository
            .list_provider_credentials("100", "200", Some("app-volcengine"), None)
            .await
            .expect("credentials should list");
        assert_eq!(
            credentials
                .iter()
                .map(|credential| &credential.credential_role)
                .collect::<Vec<_>>(),
            vec![
                &RtcProviderCredentialRole::RtcTokenSigning,
                &RtcProviderCredentialRole::OpenApiSigning,
            ]
        );
        assert!(
            credentials
                .iter()
                .all(|credential| !credential.credential_ref.contains("raw"))
        );

        let revoked = repository
            .revoke_provider_credential(
                "credential-volcengine-token",
                Some("300"),
                "2026-06-10T00:01:00.000Z",
            )
            .await
            .expect("credential should revoke");
        assert_eq!(revoked.status, RtcProviderCredentialStatus::Revoked);
        assert_eq!(
            revoked.revoked_at.as_deref(),
            Some("2026-06-10T00:01:00.000Z")
        );

        let disabled_application = repository
            .disable_provider_application(
                "app-volcengine",
                Some("operator disabled application"),
                Some("300"),
                "2026-06-10T00:02:00.000Z",
            )
            .await
            .expect("application should disable");
        assert_eq!(
            disabled_application.status,
            RtcProviderApplicationStatus::Disabled
        );

        let disabled_account = repository
            .disable_provider_account(
                "account-volcengine",
                Some("operator disabled account"),
                Some("300"),
                "2026-06-10T00:03:00.000Z",
            )
            .await
            .expect("account should disable");
        assert_eq!(disabled_account.status, RtcProviderAccountStatus::Disabled);
    }

    fn provider_account(id: impl Into<String>, provider: impl Into<String>) -> RtcProviderAccount {
        let id = id.into();
        let provider = provider.into();
        RtcProviderAccount {
            id,
            tenant_id: "100".into(),
            organization_id: "200".into(),
            provider: provider.clone(),
            code: "default".into(),
            name: format!("{provider} account"),
            status: RtcProviderAccountStatus::Active,
            environment: "production".into(),
            external_tenant_id: Some(format!("{provider}-tenant")),
            cloud_account_id: Some(format!("{provider}-cloud-account")),
            project_id: Some(format!("{provider}-project")),
            resource_group_id: Some(format!("{provider}-resource-group")),
            last_verified_at: None,
            last_verification_error: None,
            created_by: Some("300".into()),
            updated_by: Some("300".into()),
            created_at: Some("2026-06-10T00:00:00.000Z".into()),
            updated_at: Some("2026-06-10T00:00:00.000Z".into()),
            version: "0".into(),
            deleted_at: None,
            deleted_by: None,
        }
    }

    fn provider_application(
        id: impl Into<String>,
        account_id: impl Into<String>,
        provider: impl Into<String>,
        id_kind: impl Into<String>,
    ) -> RtcProviderApplication {
        let provider = provider.into();
        RtcProviderApplication {
            id: id.into(),
            tenant_id: "100".into(),
            organization_id: "200".into(),
            provider_account_id: account_id.into(),
            provider: provider.clone(),
            code: "primary".into(),
            name: format!("{provider} application"),
            status: RtcProviderApplicationStatus::Active,
            environment: "production".into(),
            region: Some("cn-beijing".into()),
            provider_application_id: format!("{provider}-app-id"),
            provider_application_id_kind: id_kind.into(),
            access_endpoint: Some(format!("https://rtc.{provider}.example")),
            api_endpoint: Some(format!("https://api.{provider}.example")),
            api_host: Some(format!("api.{provider}.example")),
            api_version: Some("2024-01-01".into()),
            webhook_callback_url: Some(format!("https://callback.example/{provider}")),
            config_snapshot: serde_json::json!({ "tokenTtlSeconds": 3600 }),
            last_verified_at: None,
            last_verification_error: None,
            created_by: Some("300".into()),
            updated_by: Some("300".into()),
            created_at: Some("2026-06-10T00:00:00.000Z".into()),
            updated_at: Some("2026-06-10T00:00:00.000Z".into()),
            version: "0".into(),
            deleted_at: None,
            deleted_by: None,
        }
    }

    fn provider_credential(
        id: impl Into<String>,
        account_id: impl Into<String>,
        application_id: impl Into<String>,
        provider: impl Into<String>,
        role: RtcProviderCredentialRole,
    ) -> RtcProviderCredential {
        let provider = provider.into();
        let label = match &role {
            RtcProviderCredentialRole::RtcTokenSigning => "token",
            RtcProviderCredentialRole::OpenApiSigning => "open-api",
            RtcProviderCredentialRole::UserSigSigning => "usersig",
            RtcProviderCredentialRole::CloudApiSigning => "cloud-api",
            RtcProviderCredentialRole::WebhookSigning => "webhook",
        };
        RtcProviderCredential {
            id: id.into(),
            tenant_id: "100".into(),
            organization_id: "200".into(),
            provider_account_id: account_id.into(),
            provider_application_id: application_id.into(),
            provider,
            credential_role: role,
            credential_label: label.into(),
            credential_ref: format!("secret://rtc/{label}"),
            credential_fingerprint: Some(format!("fingerprint:{label}")),
            secret_version: Some("1".into()),
            status: RtcProviderCredentialStatus::Active,
            valid_from: Some("2026-06-10T00:00:00.000Z".into()),
            expires_at: None,
            rotation_due_at: None,
            rotated_at: None,
            revoked_at: None,
            last_verified_at: None,
            last_used_at: None,
            created_by: Some("300".into()),
            updated_by: Some("300".into()),
            created_at: Some("2026-06-10T00:00:00.000Z".into()),
            updated_at: Some("2026-06-10T00:00:00.000Z".into()),
            version: "0".into(),
        }
    }
}
