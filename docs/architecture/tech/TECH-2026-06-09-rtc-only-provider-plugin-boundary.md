> Migrated from `docs/superpowers/plans/2026-06-09-rtc-only-provider-plugin-boundary.md` on 2026-06-24.
> Owner: SDKWork maintainers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `sdkwork-rtc` a provider-neutral RTC media capability authority with no signaling ownership and no root SDK vendor coupling.

**Architecture:** The Rust core and backend API expose media rooms, media sessions, media participants, provider credentials, recording artifacts, quality samples, and provider control-plane resources only. Provider integrations are metadata and SPI/plugin packages; runtime vendor packages live in provider packages and are loaded only when an application installs them.

**Tech Stack:** Rust crates and SQL schemas, Node/OpenAPI materialization scripts, TypeScript SDK package, Flutter/Dart SDK scaffolds, `node:test`, `cargo test`, `pnpm`.

---

### Task 1: Boundary Tests

**Files:**
- Modify: `tests/rtc-migration-contract.test.mjs`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/test/public-api-boundary.test.mjs`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/test/official-provider-catalog.test.mjs`

- [ ] **Step 1: Add failing tests for RTC-only model names**

Assert that active Rust, SQL, OpenAPI, route manifests, and SDK root files do not contain `RtcCallSession`, `RtcCallParticipant`, `RtcCallType`, `RtcCallRecord`, `rtc_call_*`, `rtc_call_invitation`, `conversation_id`, `initiator_id`, `Invited`, or `ChatLog`.

- [ ] **Step 2: Add failing tests for plugin-only SDK roots**

Assert root TypeScript SDK does not export `./providers/*`, does not export `createBuiltinRtcDriverManager`, and does not declare vendor dependencies such as `@volcengine/rtc`.

- [ ] **Step 3: Add failing tests for Flutter root package neutrality**

Assert root Flutter `pubspec.yaml` has no `volc_engine_rtc`, and `lib/rtc_sdk.dart` does not export provider bridge files.

- [ ] **Step 4: Run narrow tests and confirm failures**

Run:

```powershell
node tests\rtc-migration-contract.test.mjs
pnpm --dir sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript test
```

Expected: failures identify the existing call/session/invitation and root provider exports.

### Task 2: Rust Core And Storage Cleanup

**Files:**
- Modify: `crates/sdkwork-communication-rtc-service/src/lib.rs`
- Modify: `crates/sdkwork-rtc-service-host/src/lib.rs`
- Modify: `crates/sdkwork-communication-rtc-repository-sqlx/src/lib.rs`
- Modify: `crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql`
- Modify: `crates/sdkwork-communication-rtc-repository-sqlx/src/schema/sqlite_rtc.sql`

- [ ] **Step 1: Rename public RTC media models**

Rename call-shaped media contracts:

- `RtcCallType` -> `RtcMediaSessionMode`
- `RtcCallSessionStatus` -> `RtcMediaSessionStatus`
- `RtcCallParticipant` -> `RtcMediaParticipant`
- `RtcCallSession` -> `RtcMediaSession`
- `RtcCallRecordKind` -> `RtcRecordingArtifactKind`
- `RtcCallRecordStatus` -> `RtcRecordingArtifactStatus`
- `RtcCallRecordArtifact` -> `RtcMediaArtifact`
- `RtcCallRecordList` -> `RtcMediaArtifactList`

- [ ] **Step 2: Remove signaling lifecycle states**

Use media runtime states only: `Preparing`, `Active`, `Ended`, `Failed`, `Closing` for sessions and `Joining`, `Joined`, `Left`, `Kicked`, `Timeout` for participants. Remove `Invited`, `Ringing`, `Connecting`, `Terminated`, and `ChatLog`.

- [ ] **Step 3: Keep provider registry RTC-only**

Limit `ProviderDomain` to `Rtc`, and remove object-storage, principal-profile, and IoT default plugins from the RTC registry.

- [ ] **Step 4: Rename database tables**

Use `rtc_media_session`, `rtc_media_participant`, and `rtc_media_artifact`; remove `rtc_call_invitation` entirely. Keep Drive references for media artifacts and avoid provider storage details.

- [ ] **Step 5: Run Rust-focused tests**

Run:

```powershell
cargo test -p sdkwork-communication-rtc-service -p sdkwork-communication-rtc-repository-sqlx -p sdkwork-rtc-service-host
```

Expected: pass after implementation.

### Task 3: Backend API And OpenAPI Materialization

**Files:**
- Modify: `crates/sdkwork-routes-rtc-backend-api/src/lib.rs`
- Modify: `sdks/materialize-rtc-v3-openapi-boundaries.mjs`
- Regenerate: `sdks/_route-manifests/backend-api/sdkwork-routes-rtc-backend-api.route-manifest.json`
- Regenerate: `apis/backend-api/communication/sdkwork-rtc-backend-api.openapi.json`
- Regenerate: `sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.openapi.json`
- Regenerate: `sdks/sdkwork-rtc-backend-sdk/openapi/sdkwork-rtc-backend-api.sdkgen.json`
- Modify/regenerate: `sdks/sdkwork-rtc-backend-sdk/specs/component.spec.json`

- [ ] **Step 1: Rename backend control routes**

Use `/backend/v3/api/rtc/media-sessions`, `/media-sessions/{mediaSessionId}`, and `/media-sessions/{mediaSessionId}/close`. Operation ids become `rtc.mediaSessions.list`, `retrieve`, and `close`.

- [ ] **Step 2: Rename schemas**

Materialize `RtcMediaSession` and `RtcMediaParticipant` schemas with media runtime states only.

- [ ] **Step 3: Regenerate OpenAPI**

Run:

```powershell
pnpm run materialize:openapi
```

Expected: backend OpenAPI and route manifest use media session naming and no invitation/call lifecycle schemas.

### Task 4: SDK Plugin-Only Root

**Files:**
- Modify: `sdks/sdkwork-rtc-sdk/sdk-manifest.json`
- Modify: `sdks/sdkwork-rtc-sdk/bin/materialize-sdk.mjs`
- Modify: `sdks/sdkwork-rtc-sdk/bin/materialize-sdk-reserved-scaffolds.mjs`
- Regenerate SDK language/catalog files with `node sdks\sdkwork-rtc-sdk\bin\materialize-sdk.mjs`

- [ ] **Step 1: Change assembly standards**

Set root public policy to `none`, provider activations to package boundary or control metadata only, root public export paths to provider-neutral contracts only, and runtime baselines to package-loader entrypoints rather than direct vendor SDK imports.

- [ ] **Step 2: Make TypeScript root provider-neutral**

Remove root provider module exports and `createBuiltinRtcDriverManager`. Keep `RtcDriverManager`, `RtcDataSource`, `RtcProviderPackageLoader`, `installRtcProviderPackage`, and catalog accessors.

- [ ] **Step 3: Move provider runtime references into provider package metadata**

Provider package manifests and docs may reference their vendor packages. The root SDK package must not declare vendor dependencies or peer dependencies.

- [ ] **Step 4: Make Flutter root provider-neutral**

Root Flutter package exports only standard contracts and catalogs. Provider bridge files are not exported from `rtc_sdk.dart`, and root `pubspec.yaml` has no vendor dependency.

- [ ] **Step 5: Regenerate SDK scaffolds**

Run:

```powershell
node sdks\sdkwork-rtc-sdk\bin\materialize-sdk.mjs
```

Expected: materialized SDK metadata, docs, language catalogs, package manifests, and provider package scaffolds align to plugin-only root policy.

### Task 5: Verification

**Files:**
- All touched files

- [ ] **Step 1: Run boundary and SDK tests**

Run:

```powershell
pnpm run test:contract:migration
pnpm --dir sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript test
node sdks\sdkwork-rtc-sdk\bin\verify-sdk.mjs
node sdks\sdkwork-rtc-sdk\test\verify-sdk-automation.test.mjs
```

- [ ] **Step 2: Run materialization and workspace checks**

Run:

```powershell
pnpm run materialize:openapi
pnpm run sdk:check
pnpm run typecheck
pnpm test
```

- [ ] **Step 3: Run Rust tests**

Run:

```powershell
cargo test --workspace
```

- [ ] **Step 4: Report evidence and residual risk**

Summarize exact commands, key outputs, remaining generated-file churn, and any provider packages that are metadata scaffolds rather than production vendor bridges.

