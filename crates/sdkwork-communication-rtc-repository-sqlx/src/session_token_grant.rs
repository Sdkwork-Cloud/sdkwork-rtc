use sdkwork_communication_rtc_service::{
    RtcSessionTokenGrant, RtcSessionTokenGrantStatus,
};
use sqlx::{Executor, PgPool, Postgres, Row, postgres::PgRow};

use crate::{RtcStorageError, RtcStorageResult};



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
        let mut query = sqlx::query(sqlx::AssertSqlSafe(sql))
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

