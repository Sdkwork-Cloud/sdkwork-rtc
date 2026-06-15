# SDKWork RTC Authority Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user explicitly forbids subagent execution for this task.

**Goal:** Move RTC provider/media runtime SDK, backend provider management API, Rust provider/storage contracts, and UI capability code into `sdkwork-rtc`, then remove RTC authority from `sdkwork-appbase` and duplicate RTC SDK authority from `sdkwork-im`. IM/call signaling remains owned by Craw Chat IM.

**Architecture:** `sdkwork-rtc` becomes the RTC provider/media runtime authority. The provider/runtime RTC SDK from `sdkwork-im/sdks/sdkwork-rtc-sdk` is copied to `sdks/sdkwork-rtc-sdk`; backend/admin HTTP SDK families are generated from RTC backend route/OpenAPI authorities; Rust crates own RTC provider, storage, and backend API contracts. User-facing call signaling, invite/accept/reject/end, participant call lifecycle, WebSocket business protocol, and `/im/v3/api/calls/*` remain in Craw Chat IM. `sdkwork-appbase` keeps no RTC package, catalog item, or direct workspace alias.

**Tech Stack:** Node test runner, Vitest, TypeScript, Rust 2024, SQLx-style schema crates, OpenAPI 3.1.2, SDKWork `sdkgen`.

---

### Task 1: Migration Audit Gate

**Files:**
- Create: `tests/rtc-migration-contract.test.mjs`
- Create: `package.json`
- Create: `README.md`

- [ ] Write a failing Node audit test that asserts `sdkwork-rtc` owns RTC SDK/UI/Rust/OpenAPI files and appbase/sdkwork-im do not retain RTC authority sources.
- [ ] Run `node --test tests/rtc-migration-contract.test.mjs` and confirm it fails because `sdkwork-rtc` is empty.
- [ ] Add root package scripts for audit, typecheck, Rust tests, SDK check, and full verify.

### Task 2: Migrate RTC Provider SDK

**Files:**
- Copy: `<workspace-root>\sdkwork-im\sdks\sdkwork-rtc-sdk` to `sdks/sdkwork-rtc-sdk`
- Modify: `sdks/sdkwork-rtc-sdk/README.md`

- [ ] Copy the active RTC SDK workspace into `sdkwork-rtc`.
- [ ] Update documentation so the workspace is no longer described as Craw Chat-owned.
- [ ] Keep public package names such as `@sdkwork/rtc-sdk`.

### Task 3: Migrate RTC PC React Package

**Files:**
- Copy: `sdkwork-appbase/packages/pc-react/communication/sdkwork-rtc-pc-react` to `apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc`
- Modify: `apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/src/rtc.ts`
- Modify: `apps/sdkwork-rtc-pc/packages/sdkwork-rtc-pc-rtc/package.json`

- [ ] Copy the RTC PC React package into `sdkwork-rtc`.
- [ ] Replace the `@sdkwork/appbase-pc-react` manifest dependency with local RTC manifest primitives so RTC UI no longer depends on appbase.
- [ ] Update package metadata to `sdkwork-rtc`.

### Task 4: Add Rust RTC Storage And Backend Route Authorities

**Files:**
- Create: `Cargo.toml`
- Create: `rust-toolchain.toml`
- Create: `crates/sdkwork-communication-rtc-service/*`
- Create: `crates/sdkwork-communication-rtc-repository-sqlx/*`
- Create: `crates/sdkwork-router-rtc-backend-api/*`

- [ ] Add focused Rust crates for core contract metadata, storage schema contracts, and backend route catalogs.
- [ ] Add SQL schema files for Postgres and SQLite.
- [ ] Add Rust tests proving table contracts and route metadata.

### Task 5: Add OpenAPI And SDK Generation Boundaries

**Files:**
- Create: `sdks/materialize-rtc-v3-openapi-boundaries.mjs`
- Create: `sdks/sdkwork-rtc-backend-sdk/*`
- Create: `sdks/_route-manifests/*`

- [ ] Materialize backend OpenAPI from Rust route catalogs.
- [ ] Add backend SDK family manifests and standard generator wrappers.
- [ ] Generate or check TypeScript SDK output with the canonical SDKWork generator.

### Task 6: Remove Appbase RTC Debt

**Files:**
- Delete: `sdkwork-appbase/packages/pc-react/communication/sdkwork-rtc-pc-react`
- Modify: `sdkwork-appbase/pnpm-workspace.yaml`
- Modify: `sdkwork-appbase/tsconfig.base.json`
- Modify: `sdkwork-appbase/packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts`
- Modify: `sdkwork-appbase/packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts`
- Modify: `sdkwork-appbase/scripts/package-catalog.mjs`
- Modify: `sdkwork-appbase/README.md`

- [ ] Remove RTC package and catalog authority from appbase.
- [ ] Remove direct workspace aliases to sdkwork-im RTC SDK.
- [ ] Update tests/scripts that expected appbase-owned RTC packages.

### Task 7: Remove Craw Chat RTC SDK Authority

**Files:**
- Delete or replace: `sdkwork-im/sdks/sdkwork-rtc-sdk`

- [ ] Remove the SDK source from sdkwork-im as an authority.
- [ ] Leave no package/build entrypoint that can publish a second RTC SDK source.

### Task 8: Verification Loop

**Files:**
- All changed files

- [ ] Run `node --test tests/rtc-migration-contract.test.mjs`.
- [ ] Run `pnpm run typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `cargo test --workspace`.
- [ ] Run SDK/OpenAPI checks.
- [ ] Search `sdkwork-appbase` and `sdkwork-im` for RTC authority leftovers and remove any remaining dead code.
