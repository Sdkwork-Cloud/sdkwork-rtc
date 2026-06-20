# RTC Database Module

Canonical lifecycle assets for `sdkwork-rtc` per `DATABASE_FRAMEWORK_SPEC.md`.

- moduleId: `rtc`
- serviceCode: `RTC`
- tablePrefix: `rtc_`

## Commands

```bash
pnpm run db:validate
pnpm run db:plan
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed
pnpm run db:status
pnpm run db:drift:check
```

## Migration status

No legacy SQL was auto-imported. Author `contract/schema.yaml` before adding migrations.

Runtime services MUST create pools through `sdkwork-database-sqlx` and register `DefaultDatabaseModule` at bootstrap.
