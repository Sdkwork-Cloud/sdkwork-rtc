use sdkwork_communication_rtc_service::{
    RtcSessionTokenGrant, RtcSessionTokenGrantStatus,
};
use sqlx::{Executor, PgPool, Postgres, Row, Sqlite, SqlitePool, postgres::PgRow, sqlite::SqliteRow};

use crate::{RtcStorageError, RtcStorageResult};

#[derive(Clone, Debug)]
pub struct RtcSqliteSessionTokenGrantRepository {
    pool: SqlitePool,
}

impl RtcSqliteSessionTokenGrantRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn upsert_session_token_grant(
        &self,
        numeric_id: i64,
        grant: &RtcSessionTokenGrant,
    ) -> RtcStorageResult<()> {
        self.upsert_session_token_grant_with(&self.pool, numeric_id, grant)
            .await
    }

    pub async fn upsert_session_token_grant_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        grant: &RtcSessionTokenGrant,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_session_token_grant_sql())
            .bind(numeric_id)
            .bind(&grant.id)
            .bind(parse_i64_field("tenant_id", &grant.tenant_id)?)
            .bind(parse_i64_field("organization_id", &grant.organization_id)?)
            .bind(&grant.session_id)
            .bind(&grant.participant_id)
            .bind(grant.provider_profile_id.as_deref())
            .bind(&grant.token_hash)
            .bind(&grant.scope)
            .bind(&grant.expire_at)
            .bind(grant.revoked_at.as_deref())
            .bind(&grant.created_at)
            .bind(grant.status.as_i32())
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn revoke_active_grants_for_session(
        &self,
        tenant_id: &str,
        organization_id: &str,
        session_id: &str,
        revoked_at: &str,
    ) -> RtcStorageResult<()> {
        self.revoke_active_grants(tenant_id, organization_id, session_id, None, revoked_at)
            .await
    }

    pub async fn revoke_active_grants(
        &self,
        tenant_id: &str,
        organization_id: &str,
        session_id: &str,
        participant_id: Option<&str>,
        revoked_at: &str,
    ) -> RtcStorageResult<()> {
        let mut sql = String::from(
            r#"
            UPDATE rtc_session_token_grant
            SET status = ?, revoked_at = ?
            WHERE tenant_id = ?
              AND organization_id = ?
              AND session_id = ?
              AND status = ?
            "#,
        );
        if participant_id.is_some() {
            sql.push_str(" AND participant_id = ?");
        }
        let mut query = sqlx::query(&sql)
            .bind(RtcSessionTokenGrantStatus::Revoked.as_i32())
            .bind(revoked_at)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(session_id)
            .bind(RtcSessionTokenGrantStatus::Active.as_i32());
        if let Some(participant_id) = participant_id {
            query = query.bind(participant_id);
        }
        query.execute(&self.pool).await?;
        Ok(())
    }

    pub async fn revoke_active_grants_with<'e, E>(
        &self,
        executor: E,
        tenant_id: &str,
        organization_id: &str,
        session_id: &str,
        participant_id: Option<&str>,
        revoked_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        let mut sql = String::from(
            r#"
            UPDATE rtc_session_token_grant
            SET status = ?, revoked_at = ?
            WHERE tenant_id = ?
              AND organization_id = ?
              AND session_id = ?
              AND status = ?
            "#,
        );
        if participant_id.is_some() {
            sql.push_str(" AND participant_id = ?");
        }
        let mut query = sqlx::query(&sql)
            .bind(RtcSessionTokenGrantStatus::Revoked.as_i32())
            .bind(revoked_at)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(session_id)
            .bind(RtcSessionTokenGrantStatus::Active.as_i32());
        if let Some(participant_id) = participant_id {
            query = query.bind(participant_id);
        }
        query.execute(executor).await?;
        Ok(())
    }

    pub async fn list_session_token_grants_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcSessionTokenGrant>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, session_id, participant_id,
                   provider_profile_id, token_hash, scope, expire_at, revoked_at, created_at, status
            FROM rtc_session_token_grant
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
            .map(sqlite_row_to_session_token_grant)
            .collect()
    }

    pub async fn list_hydration_session_token_grants_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcSessionTokenGrant>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, session_id, participant_id,
                   provider_profile_id, token_hash, scope, expire_at, revoked_at, created_at, status
            FROM rtc_session_token_grant
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
            .map(sqlite_row_to_session_token_grant)
            .collect()
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresSessionTokenGrantRepository {
    pool: PgPool,
}

impl RtcPostgresSessionTokenGrantRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn upsert_session_token_grant(
        &self,
        numeric_id: i64,
        grant: &RtcSessionTokenGrant,
    ) -> RtcStorageResult<()> {
        self.upsert_session_token_grant_with(&self.pool, numeric_id, grant)
            .await
    }

    pub async fn upsert_session_token_grant_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        grant: &RtcSessionTokenGrant,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_session_token_grant_sql())
            .bind(numeric_id)
            .bind(&grant.id)
            .bind(parse_i64_field("tenant_id", &grant.tenant_id)?)
            .bind(parse_i64_field("organization_id", &grant.organization_id)?)
            .bind(&grant.session_id)
            .bind(&grant.participant_id)
            .bind(grant.provider_profile_id.as_deref())
            .bind(&grant.token_hash)
            .bind(&grant.scope)
            .bind(&grant.expire_at)
            .bind(grant.revoked_at.as_deref())
            .bind(&grant.created_at)
            .bind(grant.status.as_i32())
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn revoke_active_grants_for_session(
        &self,
        tenant_id: &str,
        organization_id: &str,
        session_id: &str,
        revoked_at: &str,
    ) -> RtcStorageResult<()> {
        self.revoke_active_grants(tenant_id, organization_id, session_id, None, revoked_at)
            .await
    }

    pub async fn revoke_active_grants(
        &self,
        tenant_id: &str,
        organization_id: &str,
        session_id: &str,
        participant_id: Option<&str>,
        revoked_at: &str,
    ) -> RtcStorageResult<()> {
        self.revoke_active_grants_with(&self.pool, tenant_id, organization_id, session_id, participant_id, revoked_at)
            .await
    }

    pub async fn revoke_active_grants_with<'e, E>(
        &self,
        executor: E,
        tenant_id: &str,
        organization_id: &str,
        session_id: &str,
        participant_id: Option<&str>,
        revoked_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        let sql = if participant_id.is_some() {
            r#"
            UPDATE rtc_session_token_grant
            SET status = $1, revoked_at = $2
            WHERE tenant_id = $3
              AND organization_id = $4
              AND session_id = $5
              AND status = $6
              AND participant_id = $7
            "#
        } else {
            r#"
            UPDATE rtc_session_token_grant
            SET status = $1, revoked_at = $2
            WHERE tenant_id = $3
              AND organization_id = $4
              AND session_id = $5
              AND status = $6
            "#
        };
        let mut query = sqlx::query(sql)
            .bind(RtcSessionTokenGrantStatus::Revoked.as_i32())
            .bind(revoked_at)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(session_id)
            .bind(RtcSessionTokenGrantStatus::Active.as_i32());
        if let Some(participant_id) = participant_id {
            query = query.bind(participant_id);
        }
        query.execute(executor).await?;
        Ok(())
    }

    pub async fn list_session_token_grants_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
    ) -> RtcStorageResult<Vec<RtcSessionTokenGrant>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, session_id, participant_id,
                   provider_profile_id, token_hash, scope, expire_at, revoked_at, created_at, status
            FROM rtc_session_token_grant
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
            .map(postgres_row_to_session_token_grant)
            .collect()
    }

    pub async fn list_hydration_session_token_grants_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcSessionTokenGrant>> {
        let rows = sqlx::query(
            r#"
            SELECT uuid, tenant_id, organization_id, session_id, participant_id,
                   provider_profile_id, token_hash, scope, expire_at, revoked_at, created_at, status
            FROM rtc_session_token_grant
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
            .map(postgres_row_to_session_token_grant)
            .collect()
    }
}

fn sqlite_row_to_session_token_grant(
    row: SqliteRow,
) -> RtcStorageResult<RtcSessionTokenGrant> {
    let status: i32 = row.try_get("status")?;
    Ok(RtcSessionTokenGrant {
        id: row.try_get("uuid")?,
        tenant_id: row.try_get::<i64, _>("tenant_id")?.to_string(),
        organization_id: row.try_get::<i64, _>("organization_id")?.to_string(),
        session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        token_hash: row.try_get("token_hash")?,
        scope: row.try_get("scope")?,
        expire_at: row.try_get("expire_at")?,
        revoked_at: row.try_get("revoked_at")?,
        created_at: row.try_get("created_at")?,
        status: RtcSessionTokenGrantStatus::from_i32(status)
            .ok_or_else(|| RtcStorageError::InvalidEnumValue {
                field: "status",
                value: status.to_string(),
            })?,
    })
}

fn postgres_row_to_session_token_grant(row: PgRow) -> RtcStorageResult<RtcSessionTokenGrant> {
    let status: i32 = row.try_get("status")?;
    Ok(RtcSessionTokenGrant {
        id: row.try_get("uuid")?,
        tenant_id: row.try_get::<i64, _>("tenant_id")?.to_string(),
        organization_id: row.try_get::<i64, _>("organization_id")?.to_string(),
        session_id: row.try_get("session_id")?,
        participant_id: row.try_get("participant_id")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        token_hash: row.try_get("token_hash")?,
        scope: row.try_get("scope")?,
        expire_at: row.try_get("expire_at")?,
        revoked_at: row.try_get("revoked_at")?,
        created_at: row.try_get("created_at")?,
        status: RtcSessionTokenGrantStatus::from_i32(status)
            .ok_or_else(|| RtcStorageError::InvalidEnumValue {
                field: "status",
                value: status.to_string(),
            })?,
    })
}

fn sqlite_upsert_session_token_grant_sql() -> &'static str {
    r#"
    INSERT INTO rtc_session_token_grant (
        id,
        uuid,
        tenant_id,
        organization_id,
        session_id,
        participant_id,
        provider_profile_id,
        token_hash,
        scope,
        expire_at,
        revoked_at,
        created_at,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uuid) DO UPDATE SET
        provider_profile_id = excluded.provider_profile_id,
        token_hash = excluded.token_hash,
        scope = excluded.scope,
        expire_at = excluded.expire_at,
        revoked_at = excluded.revoked_at,
        status = excluded.status
    WHERE rtc_session_token_grant.status = 1
    "#
}

fn postgres_upsert_session_token_grant_sql() -> &'static str {
    r#"
    INSERT INTO rtc_session_token_grant (
        id,
        uuid,
        tenant_id,
        organization_id,
        session_id,
        participant_id,
        provider_profile_id,
        token_hash,
        scope,
        expire_at,
        revoked_at,
        created_at,
        status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (uuid) DO UPDATE SET
        provider_profile_id = excluded.provider_profile_id,
        token_hash = excluded.token_hash,
        scope = excluded.scope,
        expire_at = excluded.expire_at,
        revoked_at = excluded.revoked_at,
        status = excluded.status
    WHERE rtc_session_token_grant.status = 1
    "#
}

fn parse_i64_field(field: &'static str, value: &str) -> RtcStorageResult<i64> {
    value
        .parse::<i64>()
        .map_err(|_| RtcStorageError::InvalidEnumValue {
            field,
            value: value.to_string(),
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::SQLITE_SCHEMA;
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn sqlite_repository_persists_and_revokes_session_token_grants() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("sqlite pool");
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
        let repo = RtcSqliteSessionTokenGrantRepository::new(pool);
        let grant = RtcSessionTokenGrant {
            id: "grant-test-1".to_string(),
            tenant_id: "100001".to_string(),
            organization_id: "0".to_string(),
            session_id: "session-1".to_string(),
            participant_id: "user-1".to_string(),
            provider_profile_id: Some("profile-1".to_string()),
            token_hash: "abc123".to_string(),
            scope: "rtc.join".to_string(),
            expire_at: "2030-01-01T00:00:00.000Z".to_string(),
            revoked_at: None,
            created_at: "2026-07-06T00:00:00.000Z".to_string(),
            status: RtcSessionTokenGrantStatus::Active,
        };
        repo.upsert_session_token_grant(1, &grant)
            .await
            .expect("upsert grant");
        let listed = repo
            .list_session_token_grants_for_scope("100001", "0")
            .await
            .expect("list grants");
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, grant.id);
        repo.revoke_active_grants_for_session(
            "100001",
            "0",
            "session-1",
            "2026-07-06T01:00:00.000Z",
        )
        .await
        .expect("revoke grants");
        let status: i32 = sqlx::query_scalar(
            "SELECT status FROM rtc_session_token_grant WHERE uuid = ? LIMIT 1",
        )
        .bind(grant.id.as_str())
        .fetch_one(&repo.pool)
        .await
        .expect("status row");
        assert_eq!(status, RtcSessionTokenGrantStatus::Revoked.as_i32());
    }
}
