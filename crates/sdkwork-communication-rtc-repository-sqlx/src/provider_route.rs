use sdkwork_communication_rtc_service::{RtcProviderRoute, RtcProviderRouteStatus};
use sqlx::{
    Executor, PgPool, Row, Sqlite, SqlitePool, postgres::PgRow, postgres::Postgres,
    sqlite::SqliteRow,
};

use crate::{RtcStorageError, RtcStorageResult};

#[derive(Clone, Debug)]
pub struct RtcSqliteProviderRouteRepository {
    pool: SqlitePool,
}

impl RtcSqliteProviderRouteRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn upsert_provider_route(
        &self,
        numeric_id: i64,
        route: &RtcProviderRoute,
        written_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_route_with(&self.pool, numeric_id, route, written_at)
            .await
    }

    pub async fn upsert_provider_route_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        route: &RtcProviderRoute,
        written_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Sqlite>,
    {
        sqlx::query(sqlite_upsert_provider_route_sql())
            .bind(numeric_id)
            .bind(&route.id)
            .bind(parse_i64_field("tenant_id", &route.tenant_id)?)
            .bind(parse_i64_field("organization_id", &route.organization_id)?)
            .bind(&route.provider_profile_id)
            .bind(&route.route_type)
            .bind(normalize_region(route.region.as_deref()))
            .bind(route.priority)
            .bind(provider_route_status_to_i32(&route.status))
            .bind(written_at)
            .bind(written_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn get_provider_route_by_id(
        &self,
        provider_route_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderRoute>> {
        let sql = provider_route_select_columns_sql("WHERE uuid = ?", "");
        let row = sqlx::query(&sql)
            .bind(provider_route_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(sqlite_row_to_provider_route).transpose()
    }

    pub async fn list_provider_routes(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_profile_id: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
        let sql = provider_route_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND (? IS NULL OR provider_profile_id = ?)
            "#,
            "ORDER BY route_type ASC, region ASC, priority ASC, provider_profile_id ASC, uuid ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider_profile_id)
            .bind(provider_profile_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter().map(sqlite_row_to_provider_route).collect()
    }

    pub async fn list_hydration_provider_routes_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
        let sql = provider_route_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
            "#,
            "ORDER BY updated_at DESC, id DESC LIMIT ?",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;
        rows.into_iter().map(sqlite_row_to_provider_route).collect()
    }

    pub async fn list_active_provider_routes(
        &self,
        tenant_id: &str,
        organization_id: &str,
        route_type: Option<&str>,
        region: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
        let normalized_region = region.map(|value| normalize_region(Some(value)));
        let sql = provider_route_select_columns_sql(
            r#"
            WHERE tenant_id = ?
              AND organization_id = ?
              AND status = 1
              AND (? IS NULL OR route_type = ?)
              AND (? IS NULL OR region = ?)
            "#,
            "ORDER BY priority ASC, provider_profile_id ASC, uuid ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(route_type)
            .bind(route_type)
            .bind(normalized_region.as_deref())
            .bind(normalized_region.as_deref())
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter().map(sqlite_row_to_provider_route).collect()
    }

    pub async fn list_provider_routes_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
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
                "(LOWER(uuid) LIKE ? OR LOWER(provider_profile_id) LIKE ? OR LOWER(route_type) LIKE ? OR LOWER(COALESCE(region, '')) LIKE ?)"
                    .to_string(),
            );
        }
        let order_column = provider_route_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let sql = provider_route_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!("ORDER BY {order_column} {direction}, id ASC LIMIT ? OFFSET ?"),
        );
        let mut query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
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
        rows.into_iter().map(sqlite_row_to_provider_route).collect()
    }

    pub async fn disable_provider_route(
        &self,
        provider_route_id: &str,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderRoute> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_route
            SET
                status = 2,
                updated_at = ?,
                version = version + 1
            WHERE uuid = ?
            "#,
        )
        .bind(updated_at)
        .bind(provider_route_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_route_updated(result.rows_affected(), provider_route_id)?;
        self.get_provider_route_by_id(provider_route_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderRoute {
                provider_route_id: provider_route_id.to_string(),
            })
    }
}

#[derive(Clone, Debug)]
pub struct RtcPostgresProviderRouteRepository {
    pool: PgPool,
}

impl RtcPostgresProviderRouteRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn upsert_provider_route(
        &self,
        numeric_id: i64,
        route: &RtcProviderRoute,
        written_at: &str,
    ) -> RtcStorageResult<()> {
        self.upsert_provider_route_with(&self.pool, numeric_id, route, written_at)
            .await
    }

    pub async fn upsert_provider_route_with<'e, E>(
        &self,
        executor: E,
        numeric_id: i64,
        route: &RtcProviderRoute,
        written_at: &str,
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = Postgres>,
    {
        sqlx::query(postgres_upsert_provider_route_sql())
            .bind(numeric_id)
            .bind(&route.id)
            .bind(parse_i64_field("tenant_id", &route.tenant_id)?)
            .bind(parse_i64_field("organization_id", &route.organization_id)?)
            .bind(&route.provider_profile_id)
            .bind(&route.route_type)
            .bind(normalize_region(route.region.as_deref()))
            .bind(route.priority)
            .bind(provider_route_status_to_i32(&route.status))
            .bind(written_at)
            .bind(written_at)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn get_provider_route_by_id(
        &self,
        provider_route_id: &str,
    ) -> RtcStorageResult<Option<RtcProviderRoute>> {
        let sql = postgres_provider_route_select_columns_sql("WHERE uuid = $1", "");
        let row = sqlx::query(&sql)
            .bind(provider_route_id)
            .fetch_optional(&self.pool)
            .await?;

        row.map(postgres_row_to_provider_route).transpose()
    }

    pub async fn list_provider_routes(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider_profile_id: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
        let sql = postgres_provider_route_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND ($3 IS NULL OR provider_profile_id = $4)
            "#,
            "ORDER BY route_type ASC, region ASC, priority ASC, provider_profile_id ASC, uuid ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(provider_profile_id)
            .bind(provider_profile_id)
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_route)
            .collect()
    }

    pub async fn list_hydration_provider_routes_for_scope(
        &self,
        tenant_id: &str,
        organization_id: &str,
        limit: i64,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
        let sql = postgres_provider_route_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
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
            .map(postgres_row_to_provider_route)
            .collect()
    }

    pub async fn list_active_provider_routes(
        &self,
        tenant_id: &str,
        organization_id: &str,
        route_type: Option<&str>,
        region: Option<&str>,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
        let normalized_region = region.map(|value| normalize_region(Some(value)));
        let sql = postgres_provider_route_select_columns_sql(
            r#"
            WHERE tenant_id = $1
              AND organization_id = $2
              AND status = 1
              AND ($3 IS NULL OR route_type = $4)
              AND ($5 IS NULL OR region = $6)
            "#,
            "ORDER BY priority ASC, provider_profile_id ASC, uuid ASC",
        );
        let rows = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?)
            .bind(route_type)
            .bind(route_type)
            .bind(normalized_region.as_deref())
            .bind(normalized_region.as_deref())
            .fetch_all(&self.pool)
            .await?;

        rows.into_iter()
            .map(postgres_row_to_provider_route)
            .collect()
    }

    pub async fn list_provider_routes_page(
        &self,
        tenant_id: &str,
        organization_id: &str,
        offset: usize,
        limit: usize,
        q: Option<&str>,
        sort_field: &str,
        sort_descending: bool,
    ) -> RtcStorageResult<Vec<RtcProviderRoute>> {
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
                "(LOWER(uuid) LIKE $3 OR LOWER(provider_profile_id) LIKE $4 OR LOWER(route_type) LIKE $5 OR LOWER(COALESCE(region, '')) LIKE $6)"
                    .to_string(),
            );
        }
        let order_column = provider_route_sort_column(sort_field);
        let direction = if sort_descending { "DESC" } else { "ASC" };
        let limit_param = if needle.is_some() { "$7" } else { "$3" };
        let offset_param = if needle.is_some() { "$8" } else { "$4" };
        let sql = postgres_provider_route_select_columns_sql(
            &format!("WHERE {}", where_parts.join(" AND ")),
            &format!(
                "ORDER BY {order_column} {direction}, id ASC LIMIT {limit_param} OFFSET {offset_param}"
            ),
        );
        let mut query = sqlx::query(&sql)
            .bind(parse_i64_field("tenant_id", tenant_id)?)
            .bind(parse_i64_field("organization_id", organization_id)?);
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
            .map(postgres_row_to_provider_route)
            .collect()
    }

    pub async fn disable_provider_route(
        &self,
        provider_route_id: &str,
        updated_at: &str,
    ) -> RtcStorageResult<RtcProviderRoute> {
        let result = sqlx::query(
            r#"
            UPDATE rtc_provider_route
            SET
                status = 2,
                updated_at = $1::text::timestamp,
                version = version + 1
            WHERE uuid = $2
            "#,
        )
        .bind(updated_at)
        .bind(provider_route_id)
        .execute(&self.pool)
        .await?;

        ensure_provider_route_updated(result.rows_affected(), provider_route_id)?;
        self.get_provider_route_by_id(provider_route_id)
            .await?
            .ok_or_else(|| RtcStorageError::MissingProviderRoute {
                provider_route_id: provider_route_id.to_string(),
            })
    }
}

fn sqlite_upsert_provider_route_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_route (
        id,
        uuid,
        tenant_id,
        organization_id,
        provider_profile_id,
        route_type,
        region,
        priority,
        status,
        created_at,
        updated_at,
        version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        provider_profile_id = excluded.provider_profile_id,
        route_type = excluded.route_type,
        region = excluded.region,
        priority = excluded.priority,
        status = excluded.status,
        updated_at = excluded.updated_at,
        version = rtc_provider_route.version + 1
    "#
}

fn postgres_upsert_provider_route_sql() -> &'static str {
    r#"
    INSERT INTO rtc_provider_route (
        id,
        uuid,
        tenant_id,
        organization_id,
        provider_profile_id,
        route_type,
        region,
        priority,
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
        $10::text::timestamp,
        $11::text::timestamp,
        0
    )
    ON CONFLICT(uuid) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        organization_id = excluded.organization_id,
        provider_profile_id = excluded.provider_profile_id,
        route_type = excluded.route_type,
        region = excluded.region,
        priority = excluded.priority,
        status = excluded.status,
        updated_at = excluded.updated_at,
        version = rtc_provider_route.version + 1
    "#
}

fn provider_route_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    format!(
        r#"
        SELECT
            uuid,
            tenant_id,
            organization_id,
            provider_profile_id,
            route_type,
            region,
            priority,
            status
        FROM rtc_provider_route
        {where_clause}
        {order_clause}
        "#
    )
}

fn postgres_provider_route_select_columns_sql(where_clause: &str, order_clause: &str) -> String {
    provider_route_select_columns_sql(where_clause, order_clause)
}

fn sqlite_row_to_provider_route(row: SqliteRow) -> RtcStorageResult<RtcProviderRoute> {
    let status: i32 = row.try_get("status")?;

    Ok(RtcProviderRoute {
        id: row.try_get("uuid")?,
        tenant_id: sqlite_i64_column_to_string(&row, "tenant_id")?,
        organization_id: sqlite_i64_column_to_string(&row, "organization_id")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        route_type: row.try_get("route_type")?,
        region: denormalize_region(row.try_get("region")?),
        priority: row.try_get("priority")?,
        status: i32_to_provider_route_status(status)?,
    })
}

fn postgres_row_to_provider_route(row: PgRow) -> RtcStorageResult<RtcProviderRoute> {
    let status: i32 = row.try_get("status")?;

    Ok(RtcProviderRoute {
        id: row.try_get("uuid")?,
        tenant_id: postgres_i64_column_to_string(&row, "tenant_id")?,
        organization_id: postgres_i64_column_to_string(&row, "organization_id")?,
        provider_profile_id: row.try_get("provider_profile_id")?,
        route_type: row.try_get("route_type")?,
        region: denormalize_region(row.try_get("region")?),
        priority: row.try_get("priority")?,
        status: i32_to_provider_route_status(status)?,
    })
}

fn ensure_provider_route_updated(
    rows_affected: u64,
    provider_route_id: &str,
) -> RtcStorageResult<()> {
    if rows_affected == 0 {
        return Err(RtcStorageError::MissingProviderRoute {
            provider_route_id: provider_route_id.to_string(),
        });
    }

    Ok(())
}

fn normalize_region(value: Option<&str>) -> String {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("")
        .to_string()
}

fn denormalize_region(value: String) -> Option<String> {
    let value = value.trim();
    if value.is_empty() {
        None
    } else {
        Some(value.to_string())
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

fn sqlite_i64_column_to_string(row: &SqliteRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn postgres_i64_column_to_string(row: &PgRow, column: &'static str) -> RtcStorageResult<String> {
    let value: i64 = row.try_get(column)?;
    Ok(value.to_string())
}

fn provider_route_status_to_i32(value: &RtcProviderRouteStatus) -> i32 {
    match value {
        RtcProviderRouteStatus::Active => 1,
        RtcProviderRouteStatus::Disabled => 2,
    }
}

fn i32_to_provider_route_status(value: i32) -> RtcStorageResult<RtcProviderRouteStatus> {
    match value {
        1 => Ok(RtcProviderRouteStatus::Active),
        2 => Ok(RtcProviderRouteStatus::Disabled),
        _ => Err(RtcStorageError::InvalidEnumValue {
            field: "status",
            value: value.to_string(),
        }),
    }
}

fn provider_route_sort_column(field: &str) -> &'static str {
    match field {
        "providerProfileId" | "provider_profile_id" => "provider_profile_id",
        "routeType" | "route_type" => "route_type",
        "region" => "region",
        "priority" => "priority",
        "status" => "status",
        _ => "uuid",
    }
}

#[cfg(test)]
mod tests {
    use crate::SQLITE_SCHEMA;
    use sdkwork_communication_rtc_service::{RtcProviderRoute, RtcProviderRouteStatus};
    use sqlx::sqlite::SqlitePoolOptions;

    #[tokio::test]
    async fn sqlite_repository_manages_provider_routes_for_region_selection() {
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

        let repository = super::RtcSqliteProviderRouteRepository::new(pool.clone());
        repository
            .upsert_provider_route(
                1,
                &provider_route(
                    "route-volcengine-cn",
                    "profile-volcengine",
                    Some("cn-beijing"),
                    10,
                    RtcProviderRouteStatus::Active,
                ),
                "2026-06-10T00:00:00.000Z",
            )
            .await
            .expect("volcengine region route should persist");
        repository
            .upsert_provider_route(
                2,
                &provider_route(
                    "route-tencent-cn",
                    "profile-tencent",
                    Some("cn-beijing"),
                    20,
                    RtcProviderRouteStatus::Active,
                ),
                "2026-06-10T00:00:00.000Z",
            )
            .await
            .expect("tencent region route should persist");
        repository
            .upsert_provider_route(
                3,
                &provider_route(
                    "route-default",
                    "profile-default",
                    None,
                    30,
                    RtcProviderRouteStatus::Active,
                ),
                "2026-06-10T00:00:00.000Z",
            )
            .await
            .expect("default route should persist with normalized region");

        let active_region_routes = repository
            .list_active_provider_routes("100", "200", Some("region"), Some("cn-beijing"))
            .await
            .expect("active region route lookup should work");
        assert_eq!(
            active_region_routes
                .iter()
                .map(|route| route.id.as_str())
                .collect::<Vec<_>>(),
            vec!["route-volcengine-cn", "route-tencent-cn"]
        );

        let default_routes = repository
            .list_active_provider_routes("100", "200", Some("region"), Some(""))
            .await
            .expect("default route lookup should work");
        assert_eq!(
            default_routes
                .iter()
                .map(|route| (route.id.as_str(), route.region.as_deref()))
                .collect::<Vec<_>>(),
            vec![("route-default", None)]
        );

        let disabled = repository
            .disable_provider_route("route-volcengine-cn", "2026-06-10T00:01:00.000Z")
            .await
            .expect("disable should update route");
        assert_eq!(disabled.status, RtcProviderRouteStatus::Disabled);

        let active_after_disable = repository
            .list_active_provider_routes("100", "200", Some("region"), Some("cn-beijing"))
            .await
            .expect("active route lookup should work after disable");
        assert_eq!(
            active_after_disable
                .iter()
                .map(|route| route.id.as_str())
                .collect::<Vec<_>>(),
            vec!["route-tencent-cn"]
        );

        let profile_routes = repository
            .list_provider_routes("100", "200", Some("profile-volcengine"))
            .await
            .expect("profile scoped route list should work");
        assert_eq!(
            profile_routes
                .iter()
                .map(|route| (route.id.as_str(), &route.status))
                .collect::<Vec<_>>(),
            vec![("route-volcengine-cn", &RtcProviderRouteStatus::Disabled)]
        );
    }

    fn provider_route(
        id: impl Into<String>,
        provider_profile_id: impl Into<String>,
        region: Option<&str>,
        priority: i32,
        status: RtcProviderRouteStatus,
    ) -> RtcProviderRoute {
        RtcProviderRoute {
            id: id.into(),
            tenant_id: "100".to_string(),
            organization_id: "200".to_string(),
            provider_profile_id: provider_profile_id.into(),
            route_type: "region".to_string(),
            region: region.map(ToOwned::to_owned),
            priority,
            status,
        }
    }
}
