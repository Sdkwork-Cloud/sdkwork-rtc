# RTC Technical Architecture

Status: active  
Owner: SDKWork maintainers  
Updated: 2026-07-07  
Specs: `../sdkwork-specs/ARCHITECTURE_DECISION_SPEC.md`, `../sdkwork-specs/DOCUMENTATION_SPEC.md`

## Document Map

| Topic | Document |
| --- | --- |
| Provider plugin boundary | [TECH-2026-06-09-rtc-only-provider-plugin-boundary.md](TECH-2026-06-09-rtc-only-provider-plugin-boundary.md) |
| RTC ↔ IM boundary | [TECH-rtc-im-boundary.md](TECH-rtc-im-boundary.md) |
| Runtime topology | [TECH-topology-standard.md](TECH-topology-standard.md) |
| Production deployment | [../../guides/operator/deployment.md](../../guides/operator/deployment.md) |

## 1. Architecture Overview

`sdkwork-rtc` is the **RTC authority workspace**: provider plugins, media runtime contracts, persistence, HTTP APIs, SDK families, and runnable client surfaces. Call **signaling** remains in `sdkwork-im` (`/im/v3/api/calls/*`).

```
┌─────────────────────────────────────────────────────────────────┐
│  Client surfaces (apps/)                                        │
│  PC · H5 · Flutter · Mini Program                               │
│  → generated app/backend SDKs (no raw HTTP)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS /app|backend/v3/api/rtc/*
┌───────────────────────────▼─────────────────────────────────────┐
│  sdkwork-api-rtc-standalone-gateway                                 │
│  sdkwork-web-framework + sdkwork-iam-web-adapter                │
│  sdkwork-routes-rtc-app-api / sdkwork-routes-rtc-backend-api      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 communication-rtc-service  repository-sqlx   service-host
 (domain + provider ports)  (sdkwork-database) (Drive import)
        │                   │                   │
        └─────────┬─────────┴───────────────────┘
                  ▼
           plugins/rtc-* (Volcengine, Tencent, Agora, Aliyun, LiveKit)
```

## 2. Technology Choices

| Layer | Stack |
| --- | --- |
| HTTP runtime | Rust, Axum, `sdkwork-web-framework` |
| Persistence | PostgreSQL/SQLite via `sdkwork-database` + sqlx repository |
| File / recording storage | `sdkwork-drive` uploader + RTC Drive space references |
| Shared utilities | `sdkwork-utils-rust`, `@sdkwork/utils` |
| Client | React (PC/H5), Flutter, WeChat mini program |
| API contracts | OpenAPI under `apis/`, materialized to `sdks/` |
| Packaging | `sdkwork.workflow.json`, GitHub Actions, K8s/systemd/Docker |

**Not used (by design):** `sdkwork-discovery` — no RPC services in this workspace yet.

## 3. System Boundaries And Modules

| Owns | Does not own |
| --- | --- |
| `/app/v3/api/rtc/*`, `/backend/v3/api/rtc/*` | IM call signaling (`/im/v3/api/calls/*`) |
| Media sessions, rooms, credentials, artifacts | Direct multipart file upload endpoints |
| Provider registry, webhooks, query jobs | Vendor bucket URLs in persistence |
| RTC SDK families | IM domain error types in IM crates |

See [TECH-rtc-im-boundary.md](TECH-rtc-im-boundary.md) for dependency direction.

## 4. Directory And Package Layout

| Path | Responsibility |
| --- | --- |
| `apis/` | OpenAPI authority inputs |
| `crates/sdkwork-communication-rtc-service` | Domain types, provider ports, live streaming contracts (`domain/live_stream.rs`), capability snapshots (`provider_capability.rs`), shared webhook/recording helpers, registry (`constants.rs`, `domain/*`, `provider/*`, `provider_webhook_parse.rs`, `provider_recording_export.rs`, `time.rs`; thin `lib.rs` assembly root) |
| `crates/sdkwork-communication-rtc-repository-sqlx` | Persistence + database bootstrap |
| `crates/sdkwork-routes-rtc-*-api` | HTTP handlers wired through web framework |
| `crates/sdkwork-rtc-service-host` | Drive-backed recording import |
| `crates/sdkwork-api-rtc-standalone-gateway` | Production HTTP entrypoint |
| `plugins/rtc-*` | Vendor provider adapters |
| `configs/provider-registry/` | Default provider plugin roster (`platform-default.json`) |
| `configs/recording-policy/` | Recording artifact retention and lifecycle thresholds (`platform-default.json`) |
| `configs/provider-schemas/` | Provider admin schemas and capability declarations |
| `sdks/` | SDK generation workspaces and route manifests |
| `apps/` | Runnable client application roots |

App packages live under `apps/<app-root>/packages/` — never at repository root.

## 5. API, SDK, And Data Ownership

### HTTP envelope (mandatory)

All L2+ app-api and backend-api success bodies use `SdkWorkApiResponse`:

```json
{ "code": 0, "data": { "item": {} }, "traceId": "<uuid>" }
```

Errors use HTTP 4xx/5xx with `application/problem+json` (`ProblemDetail`, numeric `code`, `traceId`).

Legacy envelopes (`RtcApiResult`, `*ApiResult`, bare root DTOs) are forbidden.

List responses use `SdkWorkPageData` (`data.items` + `data.pageInfo` with `mode`, `hasMore`, `nextCursor`). Handlers map through `sdkwork-routes-rtc-*-api/src/responses.rs` using `sdkwork-utils-rust` (`SdkWorkApiResponse`, `SdkWorkProblemDetail`).

### Pagination (mandatory)

All L2+ list/search APIs push page selection to SQL via `RtcScopedListQuery` and repository `list_*_page` methods (`PAGINATION_SPEC.md`). Numeric continuation tokens use `pageInfo.mode = offset` via `sdkwork-utils-rust::offset_window_page_info`. In-memory `apply_list_window` is allowed only when `rtc_allows_in_memory_only_runtime()` and persistence is disabled; production list calls fail closed without a database pool.

Admin interactive lists fetch one page at a time from the server (PC/H5: `useSdkWorkPaginatedList` with load-more on rooms, accounts, profiles, routes, plugins, webhooks; Flutter admin: cursor `loadMore` on rooms). Admin rooms route is `/admin/rooms` (not media sessions). Room filters (`status`, `ownerUserId`, `createdAfter`, `q`) are pushed to SQL list APIs; room search is debounced (300ms). Column sort maps to server `sort` params — no client-side re-sort of downloaded pages. `collectSdkWorkListPages` is reserved for explicit export tooling only.

### Persistence and runtime state

Production runtimes keep an in-memory working set in `sdkwork-rtc-service-host` backed by `RtcPersistencePort` (`sdkwork-communication-rtc-repository-sqlx`). Development runtimes may omit persistence; production refuses to start without a database pool.

**Read-through retrieve.** Single-resource handlers resolve from memory first, then load from SQL on cache miss via `get_or_load_*` helpers in `sdkwork-rtc-service-host` (`get_or_load_session`, `get_or_load_provider_account`, `get_or_load_provider_application`, `get_or_load_provider_credential`, `get_or_load_provider_profile`, `get_or_load_provider_route`, `get_or_load_provider_query_job`). A DB hit validates tenant/organization scope, inserts the row into the in-memory map, and loads `rtc_media_session.version` into `session_versions` when persistence is enabled. Idempotent create replay and retrieve-after-write paths use the same read-through path so callers never depend on prior hydration.

**Atomic idempotency.** Media session create and participant credential issue use `rtc_media_session_idempotency` rows claimed inside a single SQL transaction (`INSERT … ON CONFLICT DO NOTHING` on `(tenant_id, organization_id, idempotency_key)`). A successful claim inserts the session in the same transaction (`prepare_media_session_create_with_idempotency`). Duplicate keys return the stored `media_session_id` and `payload_hash`; mismatched payload hashes fail closed. Empty `response_json` on a failed mid-flight credential issue allows safe retry; populated responses replay cached credentials.

**Optimistic locking.** `rtc_media_session.version` increments on every update. `RtcProductService::persist_changes` supplies the in-memory expected version to the repository; upsert SQL applies `WHERE rtc_media_session.version = ?` and returns a storage conflict when `rows_affected = 0`. Concurrent writers must reload and retry.

**Hydration batch loading.** Gateway startup calls `hydrate_from_persistence` for `SDKWORK_RTC_HYDRATE_TENANT_ID` / `SDKWORK_RTC_HYDRATE_ORGANIZATION_ID`. `load_runtime_snapshot` loads provider control-plane rows for the scope, then fetches bounded entity pages (newest-first `ORDER BY updated_at DESC` with SQL `LIMIT`). Nested session children (tracks, artifacts, quality samples, completion records) load per hydrated media session. Caps are env-configurable with hard maxima enforced in `runtime_environment.rs`:

| Env var | Default | Max |
| --- | --- | --- |
| `SDKWORK_RTC_HYDRATION_MAX_MEDIA_SESSIONS` | `200` | `2000` |
| `SDKWORK_RTC_HYDRATION_MAX_ROOMS` | `500` | `5000` |
| `SDKWORK_RTC_HYDRATION_MAX_WEBHOOK_EVENTS` | `500` | `10000` |
| `SDKWORK_RTC_HYDRATION_MAX_PROVIDER_QUERY_JOBS` | `200` | `5000` |
| `SDKWORK_RTC_HYDRATION_MAX_PROVIDER_QUERY_SNAPSHOTS` | `200` | `5000` |
| `SDKWORK_RTC_HYDRATION_MAX_IDEMPOTENCY_RECORDS` | `500` | `10000` |
| `SDKWORK_RTC_HYDRATION_MAX_SESSION_TOKEN_GRANTS` | `500` | `10000` |

**DB-driven reconciliation.** `sdkwork-rtc-reconcile` uses `build_rtc_reconcile_bootstrap` (skips the gateway's fixed `SDKWORK_RTC_HYDRATE_*` scope at bootstrap). At runtime `hydrate_for_reconciliation` discovers tenant scopes from `rtc_media_session` rows in `Preparing`, `Active`, `Closing`, or `Failed` (`list_active_reconcile_scopes`), with optional override `SDKWORK_RTC_RECONCILE_TENANT_SCOPES`, then hydrates each scope with the same bounded caps before reconciliation passes. Per scope it closes stale active sessions (TTL + grace from provider profile), syncs provider drift when `active_query` is supported, compensates `Failed` sessions that still hold provider session ids, and runs recording-artifact lifecycle passes from `configs/recording-policy/platform-default.json`. RTC does not call IM signaling APIs; cross-service IM/RTC drift healing is owned by `sdkwork-im`.

Participant join credentials persist hashed `rtc_session_token_grant` rows (never raw tokens). Lifecycle rules:

- Issue: revoke prior active grants for the same session + participant, insert a new active grant, validate hash/expiry in-process before persist
- Close session: revoke all active session grants in the same persistence transaction as session/completion writes (`RtcSessionTokenGrantRevocation` in `RtcPersistenceChangeSet`)
- Upsert: revoked grants cannot be reactivated (`WHERE status = Active` on conflict update)

`rtc_room_participant` DDL is reserved for future room membership persistence; live call participation uses `rtc_media_participant`.

### SDK consumption

- Server: route manifests → `sdkwork-web-contract` code generation
- Clients: `@sdkwork/rtc-app-sdk` / `@sdkwork/rtc-backend-sdk` composed TypeScript facades with v3 auto-unwrap (`SDKWORK_V3_UNWRAP`); use `readSdkWorkListPage` / `readSdkWorkItem` on the SDK return value directly — never `response.data`
- Flutter admin: `backendResponseEntity` unwraps `data.item`; Flutter app RTC services rebuild v3 single-resource envelopes before `fromJson`
- Errors: map SDK `ProblemDetail` (`code`, `traceId`) through `formatSdkWorkError` helpers in admin-core packages

### Client media runtime

| Surface | Join path | Notes |
| --- | --- | --- |
| PC / H5 | `@sdkwork/rtc-sdk` + provider packages | Volcengine reference baseline |
| Flutter | `rtc_sdk` + provider plugins | Deep link auth at `sdkworkrtc://auth/callback` |
| WeChat mini program | `joinMediaSession` in runtime bundle | Requires VolcEngine `miniapp-rtc.min.js` at `apps/sdkwork-rtc-mini-program/src/lib/`; uses `v-pusher` / `v-player` wrappers over `live-pusher` / `live-player` |

All clients issue join credentials through `@sdkwork/rtc-app-sdk` (composed facade). Provider plugins fail closed on unsigned credentials outside development runtimes (`require_signed_provider_configuration`).

### Drive integration

Recording artifacts import through `sdkwork-drive-workspace-service` uploader. Persistence stores `RtcDriveReference` (`spaceType: "rtc"`), not vendor object keys.

### Database engines

PostgreSQL and SQLite share 18-table crate schemas and lifecycle baselines under `database/ddl/baseline/`. Both engines bootstrap through `sdkwork-rtc-database-host::bootstrap_rtc_database`. Bounded catalog list APIs (`provider_plugins`, `provider_schemas`) return single-page `SdkWorkPageData` without pagination query params per `PAGINATION_SPEC.md` §4.

## 6. Security, Privacy, And Observability

- Authentication: `sdkwork-iam-web-adapter` + `WebRequestContext` (no custom route middleware)
- App context integrity: production requires `SDKWORK_RTC_APP_CONTEXT_REQUIRE_SIGNATURE=true` and `SDKWORK_RTC_APP_CONTEXT_SIGNATURE_SECRET`; gateway validates `x-sdkwork-context-signature` over canonical `x-sdkwork-*` headers (`sdkwork-rtc-app-context`)
- Provider credentials: unsigned `development-placeholder` tokens rejected when `SDKWORK_RTC_ENVIRONMENT` is production/staging
- Rate limiting: declared per route in route manifests (`rateLimitTier`, idempotency on mutations)
- Session storage: app-scoped keys (`sdkwork-rtc-pc:session:v1`, etc.)
- Webhook ingress: backend-api with `openApiDefault` tier
- Health: `/healthz`; metrics: `/metrics`; database readiness when pool configured

## 7. Deployment And Runtime Topology

Topology spec: `specs/topology.spec.json` (archetype `application-http-gateway`).

| Profile | Use case |
| --- | --- |
| `standalone.split-services` | Local dev, on-prem appliance (systemd) |
| `cloud.split-services` | Platform API gateway + K8s |

Release artifacts: server tar.gz, container image (`ghcr.io/sdkwork/rtc-standalone-gateway`), cloud gateway config bundle.

Operator guide: [../../guides/operator/deployment.md](../../guides/operator/deployment.md).

## 8. Architecture Decision Index

| ID | Decision |
| --- | --- |
| ADR-RTC-001 | RTC authority separated from IM signaling |
| ADR-RTC-002 | Provider plugins under `plugins/`, not service crate deps |
| ADR-RTC-003 | File artifacts via Drive, not RTC upload APIs |
| ADR-RTC-004 | Defer discovery until RPC services exist |

Detailed shards linked in Document Map above.

## 9. Verification

```powershell
pnpm run verify
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
node ../sdkwork-specs/tools/check-database-framework-standard.mjs --root .
cargo test --workspace
```

Component spec verification list: `specs/component.spec.json`.
