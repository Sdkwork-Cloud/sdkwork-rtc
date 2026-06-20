# RTC Database Module

Canonical lifecycle assets for `sdkwork-rtc` per `DATABASE_FRAMEWORK_SPEC.md`.

- moduleId: `rtc`
- serviceCode: `RTC`
- tablePrefix: `rtc_`

## Commands

```bash
pnpm run db:materialize:contract
pnpm run db:validate
```

Legacy SQL: `crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql` → `database/ddl/baseline/postgres/0001_rtc_legacy_baseline.sql`

Runtime bootstrap: `sdkwork-rtc-database-host` via `persistence_from_database_pool()` on Postgres; SQLite continues inline schema apply.
